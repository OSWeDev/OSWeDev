import ContextQueryVO, { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";
import EventifyEventConfVO from "../../../shared/modules/Eventify/vos/EventifyEventConfVO";
import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerConfVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../shared/modules/Stats/StatsController";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ObjectHandler, { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
import { all_promises } from "../../../shared/tools/PromiseTools";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import ThrottleHelper from "../../../shared/tools/ThrottleHelper";
import ConfigurationService from "../../env/ConfigurationService";
import AzureMemoryCheckServerController from "../AzureMemoryCheck/AzureMemoryCheckServerController";
import EventsController from "../../../shared/modules/Eventify/EventsController";
import ModuleServiceBase from "../ModuleServiceBase";
import DAOCacheHandler from "./DAOCacheHandler";
import LogDBPerfServerController from "./LogDBPerfServerController";
import ModuleDAOServer from "./ModuleDAOServer";
import ThrottledSelectQueryParam from "./vos/ThrottledSelectQueryParam";

export default class ThrottledQueryServerController {

    private static current_select_query_promises: { [parameterized_full_query: string]: Promise<any> } = {};
    private static current_promise_resolvers: { [query_index: number]: (value: unknown) => void } = {};

    /**
     * L'évènement indiquant qu'il y a des éléments dans throttled_select_query_params_by_fields_labels
     */
    // private static EVENT_push_throttled_select_query_params_by_fields_labels_CONF: EventifyEventConfVO = null;
    private static EVENT_push_throttled_select_query_params_by_fields_labels_NAME: string = 'ThrottledQueryServerController.push_throttled_select_query_params_by_fields_labels';

    /**
     * La configuration du callback pour lévènement de push des queries
     */
    // private static LISTENER_push_throttled_select_query_params_by_fields_labels_CONF: EventifyEventListenerConfVO = null;
    // private static LISTENER_push_throttled_select_query_params_by_fields_labels_INSTANCE: EventifyEventListenerInstanceVO = null;

    /**
     * Les params du throttled_select_query
     */
    private static throttled_select_query_params_by_fields_labels: { [fields_labels: string]: ThrottledSelectQueryParam[] } = {};

    private static throttled_log_dao_server_coef_0 = ThrottleHelper.declare_throttle_without_args(() => {
        if (ConfigurationService.node_configuration.debug_azure_memory_check) {
            ConsoleHandler.warn('ModuleDAOServer:handle_groups_queries:dao_server_coef == 0');
        }
    }, 10000, { leading: true, trailing: true });

    private static throttled_log_dao_server_coef_not_1 = ThrottleHelper.declare_throttle_without_args(() => {
        if (ConfigurationService.node_configuration.debug_azure_memory_check) {
            ConsoleHandler.log('ModuleDAOServer:handle_groups_queries:dao_server_coef < 0.5');
        }
    }, 10000, { leading: true, trailing: true });

    private static throttled_shift_select_queries_log_dao_server_coef_0 = ThrottleHelper.declare_throttle_without_args(() => {
        ConsoleHandler.warn('ModuleDAOServer:shift_select_queries:dao_server_coef == 0');
    }, 10000, { leading: true, trailing: true });

    /**
     * ATTENTION : le résultat de cette méthode peut être immutable ! donc toujours prévoir une copie de la data si elle a vocation à être modifiée par la suite
     * @returns {Promise<any>} résultat potentiellement freeze à tester avec Object.isFrozen
     */
    public static async throttle_select_query(
        query_: string,
        values: any = null,
        parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[] = null,
        context_query: ContextQueryVO = null
    ): Promise<any> {

        const self = this;

        return new Promise((resolve, reject) => {

            const param = new ThrottledSelectQueryParam([resolve], context_query, parameterizedQueryWrapperFields, query_, values);

            if (ConfigurationService.node_configuration.debug_throttled_select) {
                ConsoleHandler.log('throttle_select_query:' + param.parameterized_full_query);
            }

            try {
                if (!self.throttled_select_query_params_by_fields_labels[param.fields_labels]) {
                    self.throttled_select_query_params_by_fields_labels[param.fields_labels] = [];
                }
                self.throttled_select_query_params_by_fields_labels[param.fields_labels].push(param);

                // On push, donc on lance l'évènement indiquant qu'il y a des éléments dans throttled_select_query_params_by_fields_labels
                // await EventsController.emit_event(EventifyEventInstanceVO.instantiate(await this.get_EVENT_push_throttled_select_query_params_by_fields_labels()));

                // On check que le listener est bien en place, sinon on le met en place
                if (!EventsController.registered_listeners[this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME]) {
                    EventsController.on_every_event_throttle_cb(this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME, this.shift_select_queries.bind(this), 0);
                }

                EventsController.emit_event(EventifyEventInstanceVO.new_event(this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Cb de l'event de push des queries, throttled
     */
    public static async shift_select_queries(): Promise<void> {

        // const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool, 'ThrottledQueryServerController.shift_select_queries', true);
        const force_freeze: { [parameterized_full_query: string]: boolean } = {};
        const freeze_check_passed_and_refused: { [parameterized_full_query: string]: boolean } = {};
        const MAX_NB_AUTO_UNION_IN_SELECT = ConfigurationService.node_configuration.max_nb_auto_union_in_select;

        // On doit temporiser si on est sur un coef 0 lié à la charge mémoire de la BDD
        while (AzureMemoryCheckServerController.dao_server_coef == 0) {
            ConsoleHandler.log('ModuleDAOServer:shift_select_queries:AzureMemoryCheckServerController.dao_server_coef-0');
            ThrottledQueryServerController.throttled_shift_select_queries_log_dao_server_coef_0();
            await ThreadHandler.sleep(100, "ModuleDAOServer:shift_select_queries:dao_server_coef == 0");
        }

        let fields_labels: string = ObjectHandler.getFirstAttributeName(ThrottledQueryServerController.throttled_select_query_params_by_fields_labels);

        while (!!fields_labels) {

            const same_field_labels_params: ThrottledSelectQueryParam[] = ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[fields_labels];
            delete ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[fields_labels];

            // "dedoublonned" - JNE Copyright 2023
            const dedoublonned_same_field_labels_params_by_group_id: { [group_id: number]: { [query_index: number]: ThrottledSelectQueryParam } } = {};

            if (ConfigurationService.node_configuration.debug_throttled_select) {
                ConsoleHandler.log('shift_select_queries:pushing param');
            }

            let group_id = 0;
            let nb_union_in_current_group_id = 0;
            const request_by_group_id: { [group_id: number]: string } = {};
            for (const i in same_field_labels_params) {
                const same_field_labels_param = same_field_labels_params[i];

                same_field_labels_param.register_unstack_stats();

                const doublon_promise = ThrottledQueryServerController.dedoublonnage(same_field_labels_param, force_freeze, freeze_check_passed_and_refused);
                if (doublon_promise) {
                    continue;
                }

                /**
                 * On veut limiter à X le nombre de requêtes regroupées, pour pas lancer une requete de 50 unions, mais plutôt 10 requetes de 5 unions par exemple
                 */
                if (nb_union_in_current_group_id >= MAX_NB_AUTO_UNION_IN_SELECT) {
                    group_id++;
                    nb_union_in_current_group_id = 0;
                }

                /**
                 * On ajoute la gestion du cache ici
                 */
                if (same_field_labels_param.context_query && same_field_labels_param.context_query.max_age_ms && DAOCacheHandler.has_cache(same_field_labels_param.parameterized_full_query, same_field_labels_param.context_query.max_age_ms)) {
                    ThrottledQueryServerController.handle_load_from_cache(same_field_labels_param)();
                    continue;
                }
                StatsController.register_stat_COMPTEUR('ModuleDAO', 'shift_select_queries', 'not_from_cache');

                const current_promise = new Promise(async (resolve, reject) => {
                    ThrottledQueryServerController.current_promise_resolvers[same_field_labels_param.index] = resolve;
                });

                ThrottledQueryServerController.current_select_query_promises[same_field_labels_param.parameterized_full_query] = current_promise;


                if (!/^\(?select /i.test(same_field_labels_param.parameterized_full_query)) {
                    ConsoleHandler.error('Only select queries are allowed in shift_select_queries:' + same_field_labels_param.parameterized_full_query);
                    continue;
                }

                nb_union_in_current_group_id++;

                if (!dedoublonned_same_field_labels_params_by_group_id[group_id]) {
                    dedoublonned_same_field_labels_params_by_group_id[group_id] = {};
                    request_by_group_id[group_id] = null;
                }
                dedoublonned_same_field_labels_params_by_group_id[group_id][same_field_labels_param.index] = same_field_labels_param;

                /**
                 * On doit faire l'union
                 */
                const this_request = "(SELECT " + same_field_labels_param.index + " as ___throttled_select_query___index, ___throttled_select_query___query.* from (" +
                    same_field_labels_param.parameterized_full_query + ") ___throttled_select_query___query)";

                if (request_by_group_id[group_id]) {
                    request_by_group_id[group_id] += " UNION ALL " + this_request;
                } else {
                    request_by_group_id[group_id] = this_request;
                }
            }

            await ThrottledQueryServerController.handle_groups_queries(
                dedoublonned_same_field_labels_params_by_group_id,
                request_by_group_id,
                freeze_check_passed_and_refused,
                force_freeze,
                // promise_pipeline
            );

            fields_labels = ObjectHandler.getFirstAttributeName(ThrottledQueryServerController.throttled_select_query_params_by_fields_labels);
        }
    }

    private static async handle_groups_queries(
        dedoublonned_same_field_labels_params_by_group_id: { [group_id: number]: { [query_index: number]: ThrottledSelectQueryParam } },
        request_by_group_id: { [group_id: number]: string },
        freeze_check_passed_and_refused: { [parameterized_full_query: string]: boolean },
        force_freeze: { [parameterized_full_query: string]: boolean },
        // promise_pipeline: PromisePipeline
    ) {
        const self = this;
        // const old_promise_pipeline_max_concurrent_promises = promise_pipeline.max_concurrent_promises;

        for (const group_id_s in request_by_group_id) {
            const gr_id = parseInt(group_id_s);

            const request = request_by_group_id[gr_id];
            const dedoublonned_same_field_labels_params = dedoublonned_same_field_labels_params_by_group_id[gr_id];

            // On doit temporiser si on est sur un coef 0 lié à la charge mémoire de la BDD
            while (AzureMemoryCheckServerController.dao_server_coef == 0) {
                ThrottledQueryServerController.throttled_log_dao_server_coef_0();
                await ThreadHandler.sleep(100, "ModuleDAOServer:handle_groups_queries:dao_server_coef == 0");
            }

            if (AzureMemoryCheckServerController.dao_server_coef < 0.5) {
                ThrottledQueryServerController.throttled_log_dao_server_coef_not_1();
            }

            // promise_pipeline.max_concurrent_promises = Math.max(Math.floor(old_promise_pipeline_max_concurrent_promises * AzureMemoryCheckServerController.dao_server_coef), 1);

            // await promise_pipeline.push(async () => {

            // await self.do_select_query(
            //     request,
            //     null,
            //     dedoublonned_same_field_labels_params,
            //     freeze_check_passed_and_refused,
            //     force_freeze
            // );
            // });

            self.do_select_query(
                request,
                null,
                dedoublonned_same_field_labels_params,
                freeze_check_passed_and_refused,
                force_freeze
            );
        }

        // promise_pipeline.max_concurrent_promises = old_promise_pipeline_max_concurrent_promises;
    }

    private static handle_load_from_cache(
        same_field_labels_param: ThrottledSelectQueryParam
    ): () => Promise<void> {
        const res = DAOCacheHandler.get_cache(same_field_labels_param.parameterized_full_query);
        if (ConfigurationService.node_configuration.debug_throttled_select) {
            ConsoleHandler.log('shift_select_queries:do_shift_select_queries:cache:' + same_field_labels_param.parameterized_full_query);
        }
        StatsController.register_stat_COMPTEUR('ModuleDAO', 'shift_select_queries', 'from_cache');

        return async () => {

            same_field_labels_param.register_precbs_stats();

            const promises = [];
            for (const cbi in same_field_labels_param.cbs) {
                const cb = same_field_labels_param.cbs[cbi];

                promises.push((async () => {
                    await cb(res);
                })());
            }

            await all_promises(promises);
            same_field_labels_param.register_postcbs_stats();
        };
    }

    /**
     * Système de dédoublonnage qui permet de dire cette requete est déjà en cours, on attend que la promise déjà construite soit terminée
     * au lieu d'en faire encore une autre.
     * @returns true si on a trouvé une requête en cours, et qu'on a ajouté la cb à la liste des cbs à appeler - donc il ne faut pas lancer de nouvelle requete
     */
    private static dedoublonnage(
        param: ThrottledSelectQueryParam,
        force_freeze: { [parameterized_full_query: string]: boolean },
        freeze_check_passed_and_refused: { [query_index: number]: boolean }): Promise<string> {

        // Ici on voudrait un système de dédoublonnage, qui permette de dire cette requete est déjà en cours, on
        //  attend que la promise déjà construite soit terminée au lieu d'en faire encore une autre. ça nécessite de garder une trace des
        //  promises en cours
        if (ThrottledQueryServerController.current_select_query_promises[param.parameterized_full_query]) {

            if (freeze_check_passed_and_refused[param.parameterized_full_query]) {
                // si on a bloqué l'usage du current_select_query_promises, on ne doit pas en relancer avec la même requête
                // on doit attendre la fin de la précédente. Donc on attend la suppression du current_select_query_promises
                // ThrottledQueryServerController.throttled_select_query_params.push(param);

                if (!ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels]) {
                    ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels] = [];
                }
                ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels].push(param);

                return ThrottledQueryServerController.current_select_query_promises[param.parameterized_full_query];
            }

            const res = new Promise<string>(async (resolve, reject) => {

                force_freeze[param.parameterized_full_query] = true;
                const results = await ThrottledQueryServerController.current_select_query_promises[param.parameterized_full_query];
                param.register_precbs_stats();
                const promises = [];
                for (const cbi in param.cbs) {
                    const cb = param.cbs[cbi];

                    promises.push((async () => {
                        await cb(results);
                    })());
                }
                await all_promises(promises);
                resolve("dedoublonnage");
            });

            return res;
        }

        return null;
    }



    /**
     *
     * @param request la requête à exécuter avec potentiellement des paramètres qu'on retrouve dans le param values
     * @param values les valeurs des paramètres de la requête
     * @param param la configuration de la requête dans le système de gestion des requêtes en attente
     * @param freeze_check_passed_and_refused pour indiquer qu'on ne doit pas utiliser les résultats de cette requête puisqu'ils ne sont pas freeze
     * @param force_freeze si true, on force le freeze des résultats de la requête. Mis en place en particulier pour le cas d'une réponse attendue par plusieurs cbs, au niveau du dépilage des requêtes
     * @returns le résultat de la requête
     */
    private static async do_select_query(
        request: string, values: any[],
        params_by_query_index: { [query_index: number]: ThrottledSelectQueryParam },
        freeze_check_passed_and_refused: { [parameterized_full_query: string]: boolean },
        force_freeze: { [parameterized_full_query: string]: boolean }
    ): Promise<void> {

        let results = null;
        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'do_select_query', 'IN');

        try {
            const uid = LogDBPerfServerController.log_db_query_perf_start('do_select_query', request);
            results = await ModuleServiceBase.db.query(request, values);
            LogDBPerfServerController.log_db_query_perf_end(uid, 'do_select_query', request);

            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'do_select_query', 'query_OUT');
            StatsController.register_stat_DUREE('ModuleDAOServer', 'do_select_query', 'query_OUT', Dates.now_ms() - time_in);
        } catch (error) {
            ConsoleHandler.error('do_select_query:' + error);
        }

        /**
         * On ventile les résultats par index
         */
        const results_by_index: { [index: number]: any[] } = {};
        for (const i in results) {
            const result = results[i];

            const index = result['___throttled_select_query___index'];
            if (!results_by_index[index]) {
                results_by_index[index] = [];
            }
            delete result['___throttled_select_query___index'];
            results_by_index[index].push(result);
        }

        const all_params_promises = [];
        const self = this;
        for (const i in params_by_query_index) {
            const index = parseInt(i);
            const results_of_index = results_by_index[index];
            const param = params_by_query_index[index];
            const this_param_promises = [];

            all_params_promises.push((async () => {

                if (ConfigurationService.node_configuration.debug_throttled_select) {
                    ConsoleHandler.log('do_select_query:results_of_index:' + (results_of_index ? JSON.stringify(results_of_index) : 'null'));
                }

                /**
                 * Si on utilise plusieurs fois les mêmes datas résultantes de la query,
                 *  on clonait les résultats pour chaque cb, mais c'est très lourd.
                 *  Dont on va préférer les rendre non mutable, et on clone plus puisque la donnée ne peut plus changer
                 * On freeze aussi si on a un max_age_ms, car on ne veut pas que les données changent quand on les met en cache
                 */
                if ((results_of_index && (param.cbs.length > 1)) || (param.context_query && param.context_query.max_age_ms) || force_freeze[param.parameterized_full_query]) {
                    Object.freeze(results_of_index);
                } else {
                    freeze_check_passed_and_refused[param.parameterized_full_query] = true;
                }

                /**
                 * On ajoute la gestion du cache - attention a freeze les données avant de les mettre en cache
                 */
                if (param.context_query && param.context_query.max_age_ms) {
                    DAOCacheHandler.set_cache(param.parameterized_full_query, results_of_index, param.context_query.max_age_ms);
                }

                param.register_precbs_stats();
                const cbs_time_in = Dates.now_ms();

                for (const cbi in param.cbs) {
                    const cb = param.cbs[cbi];

                    this_param_promises.push(cb(results_of_index ? results_of_index : null));
                }
                await all_promises(this_param_promises);

                StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'do_select_query', 'cbs_OUT');
                StatsController.register_stat_DUREE('ModuleDAOServer', 'do_select_query', 'cbs_OUT', Dates.now_ms() - cbs_time_in);
                StatsController.register_stat_DUREE('ModuleDAOServer', 'do_select_query', 'OUT', Dates.now_ms() - time_in);

                await self.current_promise_resolvers[index](results_of_index);
                delete self.current_promise_resolvers[index];
                delete self.current_select_query_promises[param.parameterized_full_query];
                delete force_freeze[param.parameterized_full_query];
                delete freeze_check_passed_and_refused[param.parameterized_full_query];
            })());
        }

        // await all_promises(all_params_promises);
    }

    // private static async get_EVENT_push_throttled_select_query_params_by_fields_labels(): Promise<EventifyEventConfVO> {
    //     if (this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF) {
    //         return this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF;
    //     }

    //     await all_promises([
    //         (async () => {
    //             this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF = await query(EventifyEventConfVO.API_TYPE_ID)
    //                 .filter_by_text_eq(field_names<EventifyEventConfVO>().name, this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME)
    //                 .exec_as_server()
    //                 .unthrottle_query_select()
    //                 .select_vo<EventifyEventConfVO>();
    //         })(),
    //         (async () => {
    //             this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF = await query(EventifyEventListenerConfVO.API_TYPE_ID)
    //                 .filter_by_text_eq(field_names<EventifyEventListenerConfVO>().event_conf_name, this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME)
    //                 .exec_as_server()
    //                 .unthrottle_query_select()
    //                 .select_vo<EventifyEventListenerConfVO>();
    //         })()
    //     ]);

    //     if (!this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF) {
    //         this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF = new EventifyEventConfVO();
    //         this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF.name = this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME;
    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF);
    //     }

    //     if (!this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF) {
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF = new EventifyEventListenerConfVO();
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.event_conf_name = this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.cb_module_name = ModuleDAOServer.instance.name;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.cb_function_name = reflect<ModuleDAOServer>().shift_select_queries;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.cooldown_ms = 1;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.throttled = true;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.event_conf_id = this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF.id;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.event_conf_name = this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.max_calls = 0;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.name = this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME;
    //         this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF.is_bgthread = false;
    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF);
    //     }

    //     EventsController.on_every_event_throttle_cb(this.EVENT_push_throttled_select_query_params_by_fields_labels_NAME, this.shift_select_queries.bind(this), 1);

    //     this.LISTENER_push_throttled_select_query_params_by_fields_labels_INSTANCE = EventifyEventListenerInstanceVO.instantiate(this.LISTENER_push_throttled_select_query_params_by_fields_labels_CONF);
    //     EventsController.register_event_conf(this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF);
    //     EventsController.register_event_listener(this.LISTENER_push_throttled_select_query_params_by_fields_labels_INSTANCE);

    //     return this.EVENT_push_throttled_select_query_params_by_fields_labels_CONF;
    // }
}
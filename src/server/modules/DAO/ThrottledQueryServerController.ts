import ContextQueryVO from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../shared/modules/Stats/StatsController";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ObjectHandler from "../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
import { all_promises } from "../../../shared/tools/PromiseTools";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import ThrottleHelper from "../../../shared/tools/ThrottleHelper";
import ConfigurationService from "../../env/ConfigurationService";
import AzureMemoryCheckServerController from "../AzureMemoryCheck/AzureMemoryCheckServerController";
import ModuleServiceBase from "../ModuleServiceBase";
import DAOCacheHandler from "./DAOCacheHandler";
import LogDBPerfServerController from "./LogDBPerfServerController";
import ThrottledSelectQueryParam from "./vos/ThrottledSelectQueryParam";

export default class ThrottledQueryServerController {

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

        let self = this;

        return new Promise(async (resolve, reject) => {

            let param = new ThrottledSelectQueryParam([resolve], context_query, parameterizedQueryWrapperFields, query_, values);

            if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                ConsoleHandler.log('throttle_select_query:' + param.parameterized_full_query);
            }

            try {
                if (!self.throttled_select_query_params_by_fields_labels[param.fields_labels]) {
                    self.throttled_select_query_params_by_fields_labels[param.fields_labels] = [];
                }
                self.throttled_select_query_params_by_fields_labels[param.fields_labels].push(param);
                // self.throttled_select_query_params.push(param);
            } catch (error) {
                reject(error);
            }
        });
    }


    /**
     * Changement de méthode pour les querys en base, on passe par une forme de bgthread qui dépile en continue
     *  les requêtes à faire, et qui les fait en parallèle, en utilisant un PromisePipeline
     */
    public static async shift_select_queries(): Promise<void> {

        let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL, 'ThrottledQueryServerController.shift_select_queries', true);
        let force_freeze: { [parameterized_full_query: string]: boolean } = {};
        let freeze_check_passed_and_refused: { [parameterized_full_query: string]: boolean } = {};
        let MAX_NB_AUTO_UNION_IN_SELECT = ConfigurationService.node_configuration.MAX_NB_AUTO_UNION_IN_SELECT;
        let waiter = 1;
        let throttled_log_dao_server_coef_0 = ThrottleHelper.declare_throttle_without_args(() => {
            ConsoleHandler.warn('ModuleDAOServer:shift_select_queries:dao_server_coef == 0');
        }, 10000, { leading: true, trailing: true });

        while (true) {

            // On doit temporiser si on est sur un coef 0 lié à la charge mémoire de la BDD
            if (AzureMemoryCheckServerController.dao_server_coef == 0) {
                throttled_log_dao_server_coef_0();
                await ThreadHandler.sleep(100, "ModuleDAOServer:shift_select_queries:dao_server_coef == 0");
                continue;
            }

            // if (!ThrottledQueryServerController.throttled_select_query_params || !ThrottledQueryServerController.throttled_select_query_params.length) {
            //     await ThreadHandler.sleep(waiter, "ModuleDAOServer:shift_select_queries");
            //     continue;
            // }
            let fields_labels: string = ObjectHandler.getFirstAttributeName(ThrottledQueryServerController.throttled_select_query_params_by_fields_labels);
            if (!fields_labels) {
                await ThreadHandler.sleep(waiter, "ModuleDAOServer:shift_select_queries");
                continue;
            }

            // waiter = 1;
            let same_field_labels_params: ThrottledSelectQueryParam[] = ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[fields_labels];
            delete ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[fields_labels];

            // "dedoublonned" - JNE Copyright 2023
            let dedoublonned_same_field_labels_params_by_group_id: { [group_id: number]: { [query_index: number]: ThrottledSelectQueryParam } } = {};

            if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                ConsoleHandler.log('shift_select_queries:pushing param');
            }

            let group_id = 0;
            let nb_union_in_current_group_id = 0;
            let request_by_group_id: { [group_id: number]: string } = {};
            for (let i in same_field_labels_params) {
                let same_field_labels_param = same_field_labels_params[i];

                same_field_labels_param.register_unstack_stats();

                let doublon_promise = ThrottledQueryServerController.dedoublonnage(same_field_labels_param, force_freeze, freeze_check_passed_and_refused);
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

                let current_promise = new Promise(async (resolve, reject) => {
                    ThrottledQueryServerController.current_promise_resolvers[same_field_labels_param.index] = resolve;
                });

                ThrottledQueryServerController.current_select_query_promises[same_field_labels_param.parameterized_full_query] = current_promise;

                /**
                 * On ajoute la gestion du cache ici
                 */
                if (same_field_labels_param.context_query && same_field_labels_param.context_query.max_age_ms && DAOCacheHandler.has_cache(same_field_labels_param.parameterized_full_query, same_field_labels_param.context_query.max_age_ms)) {
                    ThrottledQueryServerController.handle_load_from_cache(same_field_labels_param, ThrottledQueryServerController.current_promise_resolvers[same_field_labels_param.index])();
                    continue;
                }
                StatsController.register_stat_COMPTEUR('ModuleDAO', 'shift_select_queries', 'not_from_cache');

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
                let this_request = "(SELECT " + same_field_labels_param.index + " as ___throttled_select_query___index, ___throttled_select_query___query.* from (" +
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
                promise_pipeline
            );
        }
    }

    private static current_select_query_promises: { [parameterized_full_query: string]: Promise<any> } = {};
    private static current_promise_resolvers: { [query_index: number]: (value: unknown) => void } = {};

    /**
     * Les params du throttled_select_query
     */
    private static throttled_select_query_params_by_fields_labels: { [fields_labels: string]: ThrottledSelectQueryParam[] } = {};

    private static async handle_groups_queries(
        dedoublonned_same_field_labels_params_by_group_id: { [group_id: number]: { [query_index: number]: ThrottledSelectQueryParam } },
        request_by_group_id: { [group_id: number]: string },
        freeze_check_passed_and_refused: { [parameterized_full_query: string]: boolean },
        force_freeze: { [parameterized_full_query: string]: boolean },
        promise_pipeline: PromisePipeline
    ) {
        let self = this;
        let throttled_log_dao_server_coef_0 = ThrottleHelper.declare_throttle_without_args(() => {
            if (ConfigurationService.node_configuration.DEBUG_AZURE_MEMORY_CHECK) {
                ConsoleHandler.warn('ModuleDAOServer:handle_groups_queries:dao_server_coef == 0');
            }
        }, 10000, { leading: true, trailing: true });

        let throttled_log_dao_server_coef_not_1 = ThrottleHelper.declare_throttle_without_args(() => {
            if (ConfigurationService.node_configuration.DEBUG_AZURE_MEMORY_CHECK) {
                ConsoleHandler.log('ModuleDAOServer:handle_groups_queries:dao_server_coef < 0.5');
            }
        }, 10000, { leading: true, trailing: true });
        let old_promise_pipeline_max_concurrent_promises = promise_pipeline.max_concurrent_promises;

        for (let group_id_s in request_by_group_id) {
            let gr_id = parseInt(group_id_s);

            let request = request_by_group_id[gr_id];
            let dedoublonned_same_field_labels_params = dedoublonned_same_field_labels_params_by_group_id[gr_id];

            // On doit temporiser si on est sur un coef 0 lié à la charge mémoire de la BDD
            while (AzureMemoryCheckServerController.dao_server_coef == 0) {
                throttled_log_dao_server_coef_0();
                await ThreadHandler.sleep(100, "ModuleDAOServer:handle_groups_queries:dao_server_coef == 0");
            }

            if (AzureMemoryCheckServerController.dao_server_coef < 0.5) {
                throttled_log_dao_server_coef_not_1();
            }

            promise_pipeline.max_concurrent_promises = Math.max(Math.floor(old_promise_pipeline_max_concurrent_promises * AzureMemoryCheckServerController.dao_server_coef), 1);

            await promise_pipeline.push(async () => {


                await self.do_select_query(
                    request,
                    null,
                    dedoublonned_same_field_labels_params,
                    freeze_check_passed_and_refused,
                    force_freeze
                );
            });
        }

        promise_pipeline.max_concurrent_promises = old_promise_pipeline_max_concurrent_promises;
    }

    private static handle_load_from_cache(
        same_field_labels_param: ThrottledSelectQueryParam,
        current_promise_resolver: (value: unknown) => void
    ): () => Promise<void> {
        let res = DAOCacheHandler.get_cache(same_field_labels_param.parameterized_full_query);
        if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
            ConsoleHandler.log('shift_select_queries:do_shift_select_queries:cache:' + same_field_labels_param.parameterized_full_query);
        }
        StatsController.register_stat_COMPTEUR('ModuleDAO', 'shift_select_queries', 'from_cache');

        return async () => {

            same_field_labels_param.register_precbs_stats();

            let promises = [];
            for (let cbi in same_field_labels_param.cbs) {
                let cb = same_field_labels_param.cbs[cbi];

                promises.push((async () => {
                    await cb(res);
                })());
            }
            promises.push(current_promise_resolver(res));

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

            if (!!freeze_check_passed_and_refused[param.parameterized_full_query]) {
                // si on a bloqué l'usage du current_select_query_promises, on ne doit pas en relancer avec la même requête
                // on doit attendre la fin de la précédente. Donc on attend la suppression du current_select_query_promises
                // ThrottledQueryServerController.throttled_select_query_params.push(param);

                if (!ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels]) {
                    ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels] = [];
                }
                ThrottledQueryServerController.throttled_select_query_params_by_fields_labels[param.fields_labels].push(param);

                return ThrottledQueryServerController.current_select_query_promises[param.parameterized_full_query];
            }

            let res = new Promise<string>(async (resolve, reject) => {

                force_freeze[param.parameterized_full_query] = true;
                let results = await ThrottledQueryServerController.current_select_query_promises[param.parameterized_full_query];
                param.register_precbs_stats();
                let promises = [];
                for (let cbi in param.cbs) {
                    let cb = param.cbs[cbi];

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
        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'do_select_query', 'IN');

        try {
            let uid = LogDBPerfServerController.log_db_query_perf_start('do_select_query', request);
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
        let results_by_index: { [index: number]: any[] } = {};
        for (let i in results) {
            let result = results[i];

            let index = result['___throttled_select_query___index'];
            if (!results_by_index[index]) {
                results_by_index[index] = [];
            }
            delete result['___throttled_select_query___index'];
            results_by_index[index].push(result);
        }

        let all_params_promises = [];
        let self = this;
        for (let i in params_by_query_index) {
            let index = parseInt(i);
            let results_of_index = results_by_index[index];
            let param = params_by_query_index[index];
            let this_param_promises = [];

            all_params_promises.push((async () => {

                if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
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
                let cbs_time_in = Dates.now_ms();

                for (let cbi in param.cbs) {
                    let cb = param.cbs[cbi];

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
}
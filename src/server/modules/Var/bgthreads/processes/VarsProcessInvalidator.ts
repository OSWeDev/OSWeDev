import EventsController from '../../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarDataInvalidatorVO from '../../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ConfigurationService from '../../../../env/ConfigurationService';
import DAOUpdateVOHolder from '../../../DAO/vos/DAOUpdateVOHolder';
import ParamsServerController from '../../../Params/ParamsServerController';
import CurrentBatchDSCacheHolder from '../../CurrentBatchDSCacheHolder';
import ModuleVarServer from '../../ModuleVarServer';
import VarsDatasVoUpdateHandler from '../../VarsDatasVoUpdateHandler';
import DataSourcesController from '../../datasource/DataSourcesController';
import VarsdatasComputerBGThread from '../VarsdatasComputerBGThread';
import VarsComputationHole from './VarsComputationHole';

export default class VarsProcessInvalidator {

    /**
     * Pour lancer le process d'invalidation dès qu'on pousse des éléments dans le ordered_vos_cud ou les invalidators
     */
    public static WORK_EVENT_NAME: string = 'VarsProcessInvalidator.WORK_EVENT_NAME';

    public static WARN_MAX_EXECUTION_TIME_SECOND: number = 60;
    public static ALERT_MAX_EXECUTION_TIME_SECOND: number = 120;

    private static timeout_ms_invalidation_param_name: string = 'VarsProcessInvalidator.timeout_ms_invalidation';
    private static timeout_ms_log_param_name: string = 'VarsProcessInvalidator.timeout_ms_log';

    private static instance: VarsProcessInvalidator = null;

    private static max_ordered_vos_cud_param_name: string = 'VarsProcessInvalidator.max_ordered_vos_cud';
    private static max_invalidators_param_name: string = 'VarsProcessInvalidator.max_invalidators';

    private static max_invalidators: number = 500;
    private static max_ordered_vos_cud: number = 200;
    private static timeout_ms_invalidation: number = 6000000; // Initialement 60000, on augmente largement pour tenter sans ce système, sauf cas extrême
    private static timeout_ms_log: number = 3000;

    private last_clear_datasources_cache: number = null;
    // private last_registration: number = null;

    private ten_last_intersectors_invalidations_duration_ms: number[] = [];
    private ten_last_vocuds_invalidations_duration_ms: number[] = [];

    protected constructor(
        protected name: string = 'VarsProcessInvalidator',
        // protected thread_sleep: number = 1000
    ) {

        EventsController.on_every_event_throttle_cb(
            VarsProcessInvalidator.WORK_EVENT_NAME,
            this.handle_batch_worker.bind(this),
            10
        );
    } // Le push invalidator est fait toutes les secondes de toutes manières

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessInvalidator.instance) {
            VarsProcessInvalidator.instance = new VarsProcessInvalidator();
        }
        return VarsProcessInvalidator.instance;
    }


    // public async work(): Promise<void> {

    //     // eslint-disable-next-line no-constant-condition
    //     while (true) {
    //         this.last_registration = Dates.now();

    //         let did_something = false;

    //         did_something = await this.handle_batch_worker();

    //         if (!did_something) {
    //             await ThreadHandler.sleep(this.thread_sleep, this.name);
    //         } else {
    //             // On va quand même attendre un peu pour laisser le temps aux autres process de push des vars par exemple
    //             await ThreadHandler.sleep(10, this.name);
    //         }
    //     }
    // }

    // /**
    //  * Permet de calculer le délai (en secondes) de la dernière exécution
    //  * @returns le délai en secondes
    //  */
    // public get_last_registration_delay(): number {
    //     return Dates.diff(Dates.now(), this.last_registration, TimeSegment.TYPE_SECOND);
    // }

    private async handle_batch_worker(): Promise<boolean> {

        // La première étape c'est voir si on a des invalidations à faire
        // et si oui, demander à tout le monde de se mettre en pause, les faire, remettre tout le monde en route
        if (!await VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors()) {
            return false;
        }

        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
            ConsoleHandler.log('VarsProcessInvalidator:has_vos_cud_or_intersectors');
        }

        // On met à jour les paramètres mais sans attendre le résultat, juste si on a besoin de mettre à jour on met à jour pour le prochain appel
        this.update_params();

        await VarsComputationHole.exec_in_computation_hole(async () => {

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:IN');
            }

            if (this.check_if_needs_to_invalidate_all_vars()) {
                await ModuleVarServer.getInstance().force_delete_all_cache_except_imported_data_local_thread_already_in_computation_hole();
                return;
            }

            // On s'intéresse à la durée des invalidations si on fait full vocuds ou full invalidators mais pas de mixs et pas de partiels
            const start_date_ms = Dates.now_ms();
            let handles_vocuds = false;
            let handles_invalidators = false;
            let has_max_vocuds = false;
            let has_max_invalidators = false;


            // On doit d'abord déployer les intersecteurs qui ont été demandés via des intersecteurs
            //  puis on génère ceux liés à des invalidations/modifs de VOS (qui sont déployés avant ajout à la liste des intersecteurs)
            //  et on les applique

            // On limite à 500 invalidateurs : totalement arbitraire, comme les 500 vos cuds ...
            // // On déploie les intersecteurs pour les demandes liées à des vars invalidées
            // const invalidators = VarsDatasVoUpdateHandler.invalidators ? VarsDatasVoUpdateHandler.invalidators : [];
            // VarsDatasVoUpdateHandler.invalidators = [];

            // On déploie les intersecteurs pour les demandes liées à des vars invalidées
            const invalidators = (VarsDatasVoUpdateHandler.invalidators && VarsDatasVoUpdateHandler.invalidators.length) ? VarsDatasVoUpdateHandler.invalidators.splice(0, VarsProcessInvalidator.max_invalidators).filter((e) => !!e) : [];

            let has_first_invalidator = false;
            if (invalidators.length) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb invalidators:' + invalidators.length + '/' + VarsProcessInvalidator.max_invalidators + ' max - (' + VarsDatasVoUpdateHandler.invalidators.length + ' restants)');
                handles_invalidators = true;
                has_max_invalidators = (invalidators.length == VarsProcessInvalidator.max_invalidators);
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                if (invalidators && invalidators.length) {
                    ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:first invalidator for example:');
                    invalidators[0].console_log();
                    has_first_invalidator = true;
                }
            }

            if (VarsDatasVoUpdateHandler && VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) {

                const ordered_vos_cud = (VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) ? VarsDatasVoUpdateHandler.ordered_vos_cud.splice(0, VarsProcessInvalidator.max_ordered_vos_cud).filter((e) => !!e) : [];

                if (ordered_vos_cud.length) {
                    if (ConfigurationService.node_configuration.debug_vars_processes_ordered_vos) {
                        ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb ordered_vos_cud:' + ordered_vos_cud.length + '/' + VarsProcessInvalidator.max_ordered_vos_cud + ' max - (' + VarsDatasVoUpdateHandler.ordered_vos_cud.length + ' restants)');
                    }
                    handles_vocuds = true;
                    has_max_vocuds = (ordered_vos_cud.length == VarsProcessInvalidator.max_ordered_vos_cud);
                }

                /**
                 * On se base sur les ordered_vos_cud pour définir l'invalidation ciblée du cache des datasources
                 */
                this.invalidate_datasources_cache(ordered_vos_cud);

                // On récupère les invalidateurs qui sont liées à des demandes de suppressions/modif/créa de VO
                const leafs_invalidators_handle_buffer: { [invalidator_id: string]: VarDataInvalidatorVO } = await VarsDatasVoUpdateHandler.handle_buffer(ordered_vos_cud);
                if (leafs_invalidators_handle_buffer && ObjectHandler.hasAtLeastOneAttribute(leafs_invalidators_handle_buffer)) {
                    invalidators.push(...Object.values(leafs_invalidators_handle_buffer));

                    if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                        ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb invalidators post VarsDatasVoUpdateHandler.handle_buffer:' + invalidators.length);
                        if (invalidators && invalidators.length) {
                            if (!has_first_invalidator) {
                                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:first invalidator for example:');
                                invalidators[0].console_log();
                            }
                        }
                    }
                }
            }

            let deployed_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO } = null;
            if (invalidators && invalidators.length) {
                deployed_invalidators = await VarsDatasVoUpdateHandler.deploy_invalidators(invalidators);
            }

            /**
             * Si on invalide, on veut d'une part supprimer en bdd tout ce qui intersecte les invalidators
             * et faire de même dans l'arbre actuel.
             * Ensuite, on reprend tous les subs (clients et serveurs) et on les rajoute dans l'arbre.
             */
            if (deployed_invalidators) {
                await VarsDatasVoUpdateHandler.handle_invalidators(deployed_invalidators);
            }

            if (has_max_vocuds && !handles_invalidators) {
                this.ten_last_vocuds_invalidations_duration_ms.push(Dates.now_ms() - start_date_ms);
                while (this.ten_last_vocuds_invalidations_duration_ms.length > 10) {
                    this.ten_last_vocuds_invalidations_duration_ms.shift();
                }

                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:handled max vocuds and no intersectors in:' + this.ten_last_vocuds_invalidations_duration_ms[this.ten_last_vocuds_invalidations_duration_ms.length - 1] + 'ms');
            }

            if (has_max_invalidators && !handles_vocuds) {
                this.ten_last_intersectors_invalidations_duration_ms.push(Dates.now_ms() - start_date_ms);
                while (this.ten_last_intersectors_invalidations_duration_ms.length > 10) {
                    this.ten_last_intersectors_invalidations_duration_ms.shift();
                }

                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:handled max invalidators and no vocuds in:' + this.ten_last_intersectors_invalidations_duration_ms[this.ten_last_intersectors_invalidations_duration_ms.length - 1] + 'ms');
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:OUT');
            }
        });

        // On a plus de boucle automatique sur les vars, donc si on dépile que max vos cud, il faut rappeler obligatoirement le process automatiquement pour dépiler le reste
        if (VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors()) {
            EventsController.emit_event(EventifyEventInstanceVO.new_event(VarsProcessInvalidator.WORK_EVENT_NAME));
        }

        return true;
    }

    private async update_params() {
        await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
            (async () => {
                VarsProcessInvalidator.max_invalidators = await ParamsServerController.getParamValueAsInt(VarsProcessInvalidator.max_invalidators_param_name, 500, 120000);
            })(),
            (async () => {
                VarsProcessInvalidator.max_ordered_vos_cud = await ParamsServerController.getParamValueAsInt(VarsProcessInvalidator.max_ordered_vos_cud_param_name, 200, 120000);
            })(),
            (async () => {
                VarsProcessInvalidator.timeout_ms_invalidation = await ParamsServerController.getParamValueAsInt(VarsProcessInvalidator.timeout_ms_invalidation_param_name, 6000000, 120000); // Initialement 60000, on augmente largement pour tenter sans ce système, sauf cas extrême
            })(),
            (async () => {
                VarsProcessInvalidator.timeout_ms_log = await ParamsServerController.getParamValueAsInt(VarsProcessInvalidator.timeout_ms_log_param_name, 3000, 120000);
            })(),
            (async () => {
                VarsProcessInvalidator.WARN_MAX_EXECUTION_TIME_SECOND = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_WARN_MAX_EXECUTION_TIME_SECOND, 60, 120000);
            })(),
            (async () => {
                VarsProcessInvalidator.ALERT_MAX_EXECUTION_TIME_SECOND = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_ALERT_MAX_EXECUTION_TIME_SECOND, 120, 120000);
            })(),
        ]);
    }

    /**
     * On invalide le cache des datasources de la manère la plus opti possible. Pour le moment :
     *  - on se met un timer pour vider tout le cache régulièrement
     *  - on fait la liste des vo_type des ordered_vos_cud
     *  - on invalide le cache des datasources qui ont une dépendance sur ces vo_type
     * @param ordered_vos_cud la liste des modifs qu'on va prendre en compte pour invalider le cache des datasources
     */
    private invalidate_datasources_cache(ordered_vos_cud: Array<IDistantVOBase | DAOUpdateVOHolder<IDistantVOBase>>) {

        if (!this.last_clear_datasources_cache) {
            this.last_clear_datasources_cache = Dates.now();
        } else if ((Dates.now() - this.last_clear_datasources_cache) > 10 * 60) { // 10 minutes
            this.last_clear_datasources_cache = Dates.now();
            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};
            CurrentBatchDSCacheHolder.semaphore_batch_ds_cache = {};
            CurrentBatchDSCacheHolder.semaphore_event_listener_promise = {};
            return;
        }

        const vos_types: { [vo_type: string]: boolean } = {};

        for (const i in ordered_vos_cud) {
            const vo_as_DAOUpdateVOHolder = ordered_vos_cud[i] as DAOUpdateVOHolder<IDistantVOBase>;
            const vo = ordered_vos_cud[i] as IDistantVOBase;

            if (vo_as_DAOUpdateVOHolder && vo_as_DAOUpdateVOHolder.pre_update_vo && vo_as_DAOUpdateVOHolder.post_update_vo && vo_as_DAOUpdateVOHolder.pre_update_vo._type && vo_as_DAOUpdateVOHolder.post_update_vo._type) {
                vos_types[vo_as_DAOUpdateVOHolder.pre_update_vo._type] = true;
                vos_types[vo_as_DAOUpdateVOHolder.post_update_vo._type] = true; // logiquement c'est le même mais bon...
            } else {
                vos_types[vo._type] = true;
            }
        }

        for (const vo_type in vos_types) {
            const datasources_dependencies = DataSourcesController.registeredDataSourcesControllerByVoTypeDep[vo_type];

            if (!datasources_dependencies) {
                continue;
            }

            for (const i in datasources_dependencies) {
                const ds = datasources_dependencies[i];

                delete CurrentBatchDSCacheHolder.current_batch_ds_cache[ds.name];
                delete CurrentBatchDSCacheHolder.semaphore_batch_ds_cache[ds.name];
                delete CurrentBatchDSCacheHolder.semaphore_event_listener_promise[ds.name];
            }
        }
    }

    private check_if_needs_to_invalidate_all_vars(): boolean {

        /**
         * Si on a plus de 10 rounds d'invalidations max, on peut commencer à estimer le temps que ça prendra de tout dépiler
         *   avec cette info, on compare le temps total à un temps max (paramétré) au delà duquel on décide d'invalider toutes les vars directement pour pas perdre trop de temps
         */
        let ten_last_intersectors_invalidations_duration_mean = 0;
        if (this.ten_last_intersectors_invalidations_duration_ms.length == 10) {
            for (const duration of this.ten_last_intersectors_invalidations_duration_ms) {
                ten_last_intersectors_invalidations_duration_mean += duration;
            }
            ten_last_intersectors_invalidations_duration_mean /= 10;
        }

        let ten_last_vocuds_invalidations_duration_mean = 0;
        if (this.ten_last_vocuds_invalidations_duration_ms.length == 10) {
            for (const duration of this.ten_last_vocuds_invalidations_duration_ms) {
                ten_last_vocuds_invalidations_duration_mean += duration;
            }
            ten_last_vocuds_invalidations_duration_mean /= 10;
        }
        const intersectors_invalidations_duration_remaining_estimation =
            Math.floor(VarsDatasVoUpdateHandler.invalidators.length / VarsProcessInvalidator.max_invalidators) * ten_last_intersectors_invalidations_duration_mean +
            Math.floor(VarsDatasVoUpdateHandler.ordered_vos_cud.length / VarsProcessInvalidator.max_ordered_vos_cud) * ten_last_vocuds_invalidations_duration_mean;
        if (!!intersectors_invalidations_duration_remaining_estimation) {
            if (intersectors_invalidations_duration_remaining_estimation >= VarsProcessInvalidator.timeout_ms_log) {
                ConsoleHandler.log('VarsProcessInvalidator:check_if_needs_to_invalidate_all_vars:intersectors_invalidations_duration_remaining_estimation:LOG:' + intersectors_invalidations_duration_remaining_estimation + 'ms (log >= ' + VarsProcessInvalidator.timeout_ms_log + 'ms, invalidation >= ' + VarsProcessInvalidator.timeout_ms_invalidation + 'ms)');
            }

            if (intersectors_invalidations_duration_remaining_estimation >= VarsProcessInvalidator.timeout_ms_invalidation) {
                ConsoleHandler.warn('VarsProcessInvalidator:check_if_needs_to_invalidate_all_vars:intersectors_invalidations_duration_remaining_estimation:INVALIDATION:' + intersectors_invalidations_duration_remaining_estimation + 'ms (invalidation >= ' + VarsProcessInvalidator.timeout_ms_invalidation + 'ms) :détails:' +
                    ':nb invalidators:' + VarsDatasVoUpdateHandler.invalidators.length + '/' + VarsProcessInvalidator.max_invalidators + 'max invalidators - mean ' + ten_last_intersectors_invalidations_duration_mean + 'ms par pack = ' + Math.floor(VarsDatasVoUpdateHandler.invalidators.length / VarsProcessInvalidator.max_invalidators) * ten_last_intersectors_invalidations_duration_mean + 'ms total invalidation time' +
                    ':nb ordered_vos_cud:' + VarsDatasVoUpdateHandler.ordered_vos_cud.length + '/' + VarsProcessInvalidator.max_ordered_vos_cud + 'max ordered_vos_cud - mean ' + ten_last_vocuds_invalidations_duration_mean + 'ms par pack = ' + Math.floor(VarsDatasVoUpdateHandler.ordered_vos_cud.length / VarsProcessInvalidator.max_ordered_vos_cud) * ten_last_vocuds_invalidations_duration_mean + 'ms total invalidation time');
                return true;
            }
        }

        return false;
    }
}
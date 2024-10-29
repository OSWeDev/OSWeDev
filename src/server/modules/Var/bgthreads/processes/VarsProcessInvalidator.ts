import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarDataInvalidatorVO from '../../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import DAOUpdateVOHolder from '../../../DAO/vos/DAOUpdateVOHolder';
import ModuleParamsServer from '../../../Params/ModuleParamsServer';
import CurrentBatchDSCacheHolder from '../../CurrentBatchDSCacheHolder';
import ModuleVarServer from '../../ModuleVarServer';
import VarsDatasVoUpdateHandler from '../../VarsDatasVoUpdateHandler';
import DataSourcesController from '../../datasource/DataSourcesController';
import VarsComputationHole from './VarsComputationHole';

export default class VarsProcessInvalidator {

    private static timeout_ms_invalidation_param_name: string = 'VarsProcessInvalidator.timeout_ms_invalidation';
    private static timeout_ms_log_param_name: string = 'VarsProcessInvalidator.timeout_ms_log';

    private static instance: VarsProcessInvalidator = null;

    private static max_ordered_vos_cud_param_name: string = 'VarsProcessInvalidator.max_ordered_vos_cud';
    private static max_invalidators_param_name: string = 'VarsProcessInvalidator.max_invalidators';

    private last_clear_datasources_cache: number = null;

    private ten_last_intersectors_invalidations_duration_ms: number[] = [];
    private ten_last_vocuds_invalidations_duration_ms: number[] = [];

    protected constructor(
        protected name: string = 'VarsProcessInvalidator',
        protected thread_sleep: number = 1000) { } // Le push invalidator est fait toutes les secondes de toutes manières

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessInvalidator.instance) {
            VarsProcessInvalidator.instance = new VarsProcessInvalidator();
        }
        return VarsProcessInvalidator.instance;
    }

    public async work(): Promise<void> {

        // eslint-disable-next-line no-constant-condition
        while (true) {

            let did_something = false;

            did_something = await this.handle_batch_worker();

            if (!did_something) {
                await ThreadHandler.sleep(this.thread_sleep, this.name);
            } else {
                // On va quand même attendre un peu pour laisser le temps aux autres process de push des vars par exemple
                await ThreadHandler.sleep(10, this.name);
            }
        }
    }


    private async handle_batch_worker(): Promise<boolean> {

        // La première étape c'est voir si on a des invalidations à faire
        // et si oui, demander à tout le monde de se mettre en pause, les faire, remettre tout le monde en route
        if (!await VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors()) {
            return false;
        }

        if (ConfigurationService.node_configuration.debug_vars_invalidation) {
            ConsoleHandler.log('VarsProcessInvalidator:has_vos_cud_or_intersectors');
        }

        await VarsComputationHole.exec_in_computation_hole(async () => {

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:IN');
            }

            const max_invalidators = await ModuleParams.getInstance().getParamValueAsInt(VarsProcessInvalidator.max_invalidators_param_name, 500, 30000);
            const max_ordered_vos_cud = await ModuleParams.getInstance().getParamValueAsInt(VarsProcessInvalidator.max_ordered_vos_cud_param_name, 200, 30000);

            if (await this.check_if_needs_to_invalidate_all_vars(max_invalidators, max_ordered_vos_cud)) {
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
            const invalidators = (VarsDatasVoUpdateHandler.invalidators && VarsDatasVoUpdateHandler.invalidators.length) ? VarsDatasVoUpdateHandler.invalidators.splice(0, max_invalidators).filter((e) => !!e) : [];

            let has_first_invalidator = false;
            if (invalidators.length) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb invalidators:' + invalidators.length + '/' + max_invalidators + ' max - (' + VarsDatasVoUpdateHandler.invalidators.length + ' restants)');
                handles_invalidators = true;
                has_max_invalidators = (invalidators.length == max_invalidators);
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                if (invalidators && invalidators.length) {
                    ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:first invalidator for example:');
                    invalidators[0].console_log();
                    has_first_invalidator = true;
                }
            }

            if (VarsDatasVoUpdateHandler && VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) {

                const ordered_vos_cud = (VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) ? VarsDatasVoUpdateHandler.ordered_vos_cud.splice(0, max_ordered_vos_cud).filter((e) => !!e) : [];

                if (ordered_vos_cud.length) {
                    ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb ordered_vos_cud:' + ordered_vos_cud.length + '/' + max_ordered_vos_cud + ' max - (' + VarsDatasVoUpdateHandler.ordered_vos_cud.length + ' restants)');
                    handles_vocuds = true;
                    has_max_vocuds = (ordered_vos_cud.length == max_ordered_vos_cud);
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

            const deployed_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO } = await VarsDatasVoUpdateHandler.deploy_invalidators(invalidators);

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
                if (this.ten_last_vocuds_invalidations_duration_ms.length > 10) {
                    this.ten_last_vocuds_invalidations_duration_ms.shift();
                }

                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:handled max vocuds and no intersectors in:' + this.ten_last_vocuds_invalidations_duration_ms[this.ten_last_vocuds_invalidations_duration_ms.length - 1] + 'ms');
            }

            if (has_max_invalidators && !handles_vocuds) {
                this.ten_last_intersectors_invalidations_duration_ms.push(Dates.now_ms() - start_date_ms);
                if (this.ten_last_intersectors_invalidations_duration_ms.length > 10) {
                    this.ten_last_intersectors_invalidations_duration_ms.shift();
                }

                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:handled max invalidators and no vocuds in:' + this.ten_last_intersectors_invalidations_duration_ms[this.ten_last_intersectors_invalidations_duration_ms.length - 1] + 'ms');
            }

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:OUT');
            }
        });

        return true;
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
            }
        }
    }

    private async check_if_needs_to_invalidate_all_vars(
        max_invalidators: number,
        max_ordered_vos_cud: number,
    ): Promise<boolean> {

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
            Math.floor(VarsDatasVoUpdateHandler.invalidators.length / max_invalidators) * ten_last_intersectors_invalidations_duration_mean +
            Math.floor(VarsDatasVoUpdateHandler.ordered_vos_cud.length / max_ordered_vos_cud) * ten_last_vocuds_invalidations_duration_mean;
        if (!!intersectors_invalidations_duration_remaining_estimation) {
            const timeout_ms_invalidation = await ModuleParams.getInstance().getParamValueAsInt(VarsProcessInvalidator.timeout_ms_invalidation_param_name, 60000, 30000);
            const timeout_ms_log = await ModuleParams.getInstance().getParamValueAsInt(VarsProcessInvalidator.timeout_ms_log_param_name, 3000, 30000);

            if (intersectors_invalidations_duration_remaining_estimation >= timeout_ms_log) {
                ConsoleHandler.log('VarsProcessInvalidator:check_if_needs_to_invalidate_all_vars:intersectors_invalidations_duration_remaining_estimation:LOG:' + intersectors_invalidations_duration_remaining_estimation + 'ms (log >= ' + timeout_ms_log + 'ms, invalidation >= ' + timeout_ms_invalidation + 'ms)');
            }

            if (intersectors_invalidations_duration_remaining_estimation >= timeout_ms_invalidation) {
                ConsoleHandler.warn('VarsProcessInvalidator:check_if_needs_to_invalidate_all_vars:intersectors_invalidations_duration_remaining_estimation:INVALIDATION:' + intersectors_invalidations_duration_remaining_estimation + 'ms (invalidation >= ' + timeout_ms_invalidation + 'ms) :détails:' +
                    ':nb invalidators:' + VarsDatasVoUpdateHandler.invalidators.length + '/' + max_invalidators + 'max invalidators - mean ' + ten_last_intersectors_invalidations_duration_mean + 'ms par pack = ' + Math.floor(VarsDatasVoUpdateHandler.invalidators.length / max_invalidators) * ten_last_intersectors_invalidations_duration_mean + 'ms total invalidation time' +
                    ':nb ordered_vos_cud:' + VarsDatasVoUpdateHandler.ordered_vos_cud.length + '/' + max_ordered_vos_cud + 'max ordered_vos_cud - mean ' + ten_last_vocuds_invalidations_duration_mean + 'ms par pack = ' + Math.floor(VarsDatasVoUpdateHandler.ordered_vos_cud.length / max_ordered_vos_cud) * ten_last_vocuds_invalidations_duration_mean + 'ms total invalidation time');
                return true;
            }
        }

        return false;
    }
}
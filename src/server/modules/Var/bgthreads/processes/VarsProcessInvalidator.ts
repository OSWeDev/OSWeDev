import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VarDataInvalidatorVO from '../../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import DAOUpdateVOHolder from '../../../DAO/vos/DAOUpdateVOHolder';
import CurrentBatchDSCacheHolder from '../../CurrentBatchDSCacheHolder';
import VarsDatasVoUpdateHandler from '../../VarsDatasVoUpdateHandler';
import DataSourcesController from '../../datasource/DataSourcesController';
import VarsComputationHole from './VarsComputationHole';

export default class VarsProcessInvalidator {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessInvalidator.instance) {
            VarsProcessInvalidator.instance = new VarsProcessInvalidator();
        }
        return VarsProcessInvalidator.instance;
    }

    private static instance: VarsProcessInvalidator = null;

    private last_clear_datasources_cache: number = null;

    protected constructor(
        protected name: string = 'VarsProcessInvalidator',
        protected thread_sleep: number = 1000) { } // Le push invalidator est fait toutes les secondes de toutes manières

    public async work(): Promise<void> {

        while (true) {

            let did_something = false;

            did_something = await this.handle_batch_worker();

            if (!did_something) {
                await ThreadHandler.sleep(this.thread_sleep, this.name);
            }
        }
    }


    private async handle_batch_worker(): Promise<boolean> {

        // La première étape c'est voir si on a des invalidations à faire
        // et si oui, demander à tout le monde de se mettre en pause, les faire, remettre tout le monde en route
        if (!await VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors()) {
            return false;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
            ConsoleHandler.log('VarsProcessInvalidator:has_vos_cud_or_intersectors');
        }

        await VarsComputationHole.exec_in_computation_hole(async () => {

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:IN');
            }

            // On doit d'abord déployer les intersecteurs qui ont été demandés via des intersecteurs
            //  puis on génère ceux liés à des invalidations/modifs de VOS (qui sont déployés avant ajout à la liste des intersecteurs)
            //  et on les applique

            // On déploie les intersecteurs pour les demandes liées à des vars invalidées
            let invalidators = VarsDatasVoUpdateHandler.invalidators ? VarsDatasVoUpdateHandler.invalidators : [];
            VarsDatasVoUpdateHandler.invalidators = [];

            let has_first_invalidator = false;
            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb invalidators:' + invalidators.length);
                if (invalidators && invalidators.length) {
                    ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:first invalidator for example:');
                    invalidators[0].console_log();
                    has_first_invalidator = true;
                }
            }

            let ordered_vos_cud: Array<IDistantVOBase | DAOUpdateVOHolder<IDistantVOBase>> = VarsDatasVoUpdateHandler.ordered_vos_cud;
            VarsDatasVoUpdateHandler.ordered_vos_cud = [];

            /**
             * On se base sur les ordered_vos_cud pour définir l'invalidation ciblée du cache des datasources
             */
            this.invalidate_datasources_cache(ordered_vos_cud);

            // On récupère les invalidateurs qui sont liées à des demandes de suppressions/modif/créa de VO
            let leafs_invalidators_handle_buffer: { [invalidator_id: string]: VarDataInvalidatorVO } = await VarsDatasVoUpdateHandler.handle_buffer(ordered_vos_cud);
            if (leafs_invalidators_handle_buffer && ObjectHandler.hasAtLeastOneAttribute(leafs_invalidators_handle_buffer)) {
                invalidators.push(...Object.values(leafs_invalidators_handle_buffer));

                if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                    ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:nb invalidators post VarsDatasVoUpdateHandler.handle_buffer:' + invalidators.length);
                    if (invalidators && invalidators.length) {
                        if (!has_first_invalidator) {
                            ConsoleHandler.log('VarsProcessInvalidator:exec_in_computation_hole:first invalidator for example:');
                            invalidators[0].console_log();
                        }
                    }
                }
            }

            let deployed_invalidators: { [invalidator_id: string]: VarDataInvalidatorVO } = await VarsDatasVoUpdateHandler.deploy_invalidators(invalidators);

            /**
             * Si on invalide, on veut d'une part supprimer en bdd tout ce qui intersecte les invalidators
             * et faire de même dans l'arbre actuel.
             * Ensuite, on reprend tous les subs (clients et serveurs) et on les rajoute dans l'arbre.
             */
            if (!!deployed_invalidators) {
                await VarsDatasVoUpdateHandler.handle_invalidators(deployed_invalidators);
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
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

        let vos_types: { [vo_type: string]: boolean } = {};

        for (let i in ordered_vos_cud) {
            let vo = ordered_vos_cud[i];

            if (vo instanceof DAOUpdateVOHolder) {
                vos_types[vo.pre_update_vo._type] = true;
                vos_types[vo.post_update_vo._type] = true; // logiquement c'est le même mais bon...
            } else {
                vos_types[vo._type] = true;
            }
        }

        for (let vo_type in vos_types) {
            let datasources_dependencies = DataSourcesController.registeredDataSourcesControllerByVoTypeDep[vo_type];

            if (!datasources_dependencies) {
                continue;
            }

            for (let i in datasources_dependencies) {
                let ds = datasources_dependencies[i];

                delete CurrentBatchDSCacheHolder.current_batch_ds_cache[ds.name];
            }
        }
    }
}
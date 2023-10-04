import VarDataInvalidatorVO from '../../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import CurrentBatchDSCacheHolder from '../../CurrentBatchDSCacheHolder';
import VarsDatasVoUpdateHandler from '../../VarsDatasVoUpdateHandler';
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

            // On vide le cache des DataSources
            // OPTI POSSIBLE : invalider que le cache des datasources qui ont été invalidées (cf vos_cud et datasources_dependencies)
            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};

            // On doit d'abord déployer les intersecteurs qui ont été demandés via des intersecteurs
            //  puis on génère ceux liés à des invalidations/modifs de VOS (qui sont déployés avant ajout à la liste des intersecteurs)
            //  et on les applique

            // On déploie les intersecteurs pour les demandes liées à des vars invalidées
            let invalidators = VarsDatasVoUpdateHandler.invalidators ? VarsDatasVoUpdateHandler.invalidators : [];
            VarsDatasVoUpdateHandler.invalidators = [];

            // On récupère les invalidateurs qui sont liées à des demandes de suppressions/modif/créa de VO
            let leafs_invalidators_handle_buffer: { [invalidator_id: string]: VarDataInvalidatorVO } = await VarsDatasVoUpdateHandler.handle_buffer();
            if (leafs_invalidators_handle_buffer && ObjectHandler.hasAtLeastOneAttribute(leafs_invalidators_handle_buffer)) {
                invalidators.push(...Object.values(leafs_invalidators_handle_buffer));
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
}
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
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

        await VarsComputationHole.exec_in_computation_hole(async () => {

            // On vide le cache des DataSources
            // OPTI POSSIBLE : invalider que le cache des datasources qui ont été invalidées (cf vos_cud et datasources_dependencies)
            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};

            // On génère les intersecteurs et on les applique
            await VarsDatasVoUpdateHandler.handle_buffer();

            /**
             * Si on invalide, on veut d'une part supprimer en bdd tout ce qui intersecte les invalidators
             * et faire de même dans l'arbre actuel.
             * Ensuite, on reprend tous les subs (clients et serveurs) et on les rajoute dans l'arbre.
             */
            await VarsDatasVoUpdateHandler.handle_invalidators();
        });

        return true;
    }
}
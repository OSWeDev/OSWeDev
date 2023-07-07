import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsdatasComputerBGThread from '../VarsdatasComputerBGThread';
import VarsClientsSubsCacheHandler from './VarsClientsSubsCacheHandler';

export default abstract class VarsProcessBase {

    /**
     * Si on a 0 workers, on ne fait pas de traitement en parallèle on part du principe que le traitement est synchrone (donc sans await, sans pipeline, ...)
     * @param TAG_BY_PASS_NAME Tag qui permet de dire que si le noeud est valide pour execution, on ne le traite pas et on pose le tag out directement
     */
    protected constructor(
        protected name: string,
        protected TAG_IN_NAME: string,
        protected TAG_SELF_NAME: string,
        protected TAG_OUT_NAME: string,
        protected thread_sleep: number,
        protected as_batch: boolean = false,
        protected MAX_Workers: number = 0) { }

    public async work(): Promise<void> {

        // On initialise le fait qu'on est pas en train d'attendre une invalidation
        VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[this.name] = false;

        let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps, this.name, true);
        let waiting_for_invalidation_time_in = null;

        while (true) {

            let did_something = false;

            // On checke une invalidation en attente
            waiting_for_invalidation_time_in = await this.handle_invalidations(promise_pipeline, waiting_for_invalidation_time_in);

            if (!this.as_batch) {
                did_something = await this.handle_individual_worker(promise_pipeline);
            } else {
                did_something = await this.handle_batch_worker();
            }

            if (!did_something) {
                await ThreadHandler.sleep(this.thread_sleep, this.name);
            }
        }
    }

    protected abstract worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean>;

    protected abstract worker_async(node: VarDAGNode): Promise<boolean>;
    protected abstract worker_sync(node: VarDAGNode): boolean;

    private async handle_invalidations(promise_pipeline: PromisePipeline, waiting_for_invalidation_time_in: number): Promise<number> {

        // On checke une invalidation en attente
        if (VarsdatasComputerBGThread.waiting_for_computation_hole) {
            if (!VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[this.name]) {

                if (!!this.MAX_Workers) {

                    let pipeline_end_wait_for_invalidation_time_in = Dates.now_ms();
                    // On doit attendre la fin du pipeline, pour indiquer qu'on est prêt à faire l'invalidation
                    await promise_pipeline.end();
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "pipeline_end_wait_for_invalidation", Dates.now_ms() - pipeline_end_wait_for_invalidation_time_in);
                }

                waiting_for_invalidation_time_in = Dates.now_ms();
                VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[this.name] = true;
            }
            await ThreadHandler.sleep(this.thread_sleep, this.name);
            return waiting_for_invalidation_time_in;
        }

        // si on était en attente et que l'invalidation vient de se terminer, on indique qu'on reprend le travail
        if (VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[this.name]) {
            VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[this.name] = false;
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "waiting_for_invalidation", Dates.now_ms() - waiting_for_invalidation_time_in);
        }

        return waiting_for_invalidation_time_in;
    }

    private async handle_individual_worker(promise_pipeline: PromisePipeline): Promise<boolean> {
        let self = this;
        let valid_nodes = this.get_valid_nodes();

        let did_something = Object.keys(valid_nodes).length > 0;
        for (let i in valid_nodes) {
            let node = valid_nodes[i];

            if (!!this.MAX_Workers) {
                await promise_pipeline.push(async () => {

                    let worker_time_in = Dates.now_ms();
                    let res = await self.worker_async(node);

                    node.remove_tag(this.TAG_SELF_NAME);

                    await self.handle_worker_result(res, worker_time_in, node);
                });
            } else {
                let worker_time_in = Dates.now_ms();
                let res = self.worker_sync(node);
                StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                node.remove_tag(this.TAG_SELF_NAME);

                await this.handle_worker_result(res, worker_time_in, node);
            }
        }

        return did_something;
    }

    private handle_worker_result(result: boolean, worker_time_in: number, node: VarDAGNode) {
        // Si on a pas fait l'action, on retente plus tard
        if (result) {
            StatsController.register_stat_COMPTEUR('VarsProcessBase', self.name, "worker_ok");
            StatsController.register_stat_DUREE('VarsProcessBase', self.name, "worker_ok", Dates.now_ms() - worker_time_in);
            node.add_tag(this.TAG_OUT_NAME);
        } else {
            StatsController.register_stat_COMPTEUR('VarsProcessBase', self.name, "worker_failed");
            StatsController.register_stat_DUREE('VarsProcessBase', self.name, "worker_failed", Dates.now_ms() - worker_time_in);
            node.add_tag(this.TAG_IN_NAME);
        }
    }

    private get_valid_nodes(): { [node_name: string]: VarDAGNode } {

        /**
         * Si on a des vars registered par le client on veut les prioriser, donc on ignorera les autres pour le moment
         */
        let nodes: { [node_name: string]: VarDAGNode } = this.filter_by_subs(VarsdatasComputerBGThread.current_vardag.current_step_tags[this.TAG_IN_NAME]);
        let valid_nodes: { [node_name: string]: VarDAGNode } = {};

        for (let i in nodes) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, this.TAG_IN_NAME);
            node.remove_tag(this.TAG_IN_NAME);

            // Si on a un by pass, on ne fait rien puisqu'on a déjà le tag out
            if (node.tags[this.TAG_OUT_NAME]) {
                continue;
            }

            if (!node.add_tag(this.TAG_SELF_NAME)) {
                // On a un refus, lié à une suppression en attente sur ce noeud, on arrête les traitements
                continue;
            }

            valid_nodes[node.var_data.index] = node;
        }

        return valid_nodes;
    }

    private async handle_batch_worker(): Promise<boolean> {

        let batch_nodes: { [node_name: string]: VarDAGNode } = this.get_valid_nodes();
        let has_something_to_do = Object.keys(batch_nodes).length > 0;

        if (has_something_to_do) {

            // On peut vouloir traiter en mode batch
            let worker_time_in = Dates.now_ms();
            let res = await this.worker_async_batch(batch_nodes);

            for (let i in batch_nodes) {
                let node = batch_nodes[i];
                node.remove_tag(this.TAG_SELF_NAME);

                // Si on a pas fait l'action, on retente plus tard
                if (res) {
                    StatsController.register_stat_COMPTEUR('VarsProcessBase', self.name, "worker_ok");
                    StatsController.register_stat_DUREE('VarsProcessBase', self.name, "worker_ok", Dates.now_ms() - worker_time_in);
                    node.add_tag(this.TAG_OUT_NAME);
                } else {
                    StatsController.register_stat_COMPTEUR('VarsProcessBase', self.name, "worker_failed");
                    StatsController.register_stat_DUREE('VarsProcessBase', self.name, "worker_failed", Dates.now_ms() - worker_time_in);
                    node.add_tag(this.TAG_IN_NAME);
                }
            }
        }

        return has_something_to_do;
    }

    // /**
    //  * !FIXME à réfléchir ya des gros pbs de perfs & complexité liées à cette idée d'avoir des tags condition d'entrée, et qui resteraient.
    //  * En supprimant le tag précédent à chaque avancée on évite de se redemander en permanence pour tous les noeuds si on peut avancer. Alors qu'on a déjà avancé.
    //  * Cela dit lebypass est nécessaire. Mais à faire autrement.
    //  * @returns Tous les noeuds qui ont tous les tags requis, mais pas le bypass (tag de sortie)
    //  */
    // * @param TAGS_IN_NAMES En fait le passage d'une étape à l'autre doit se faire en indiquant des tags prérequis. Le by_pass est le tag de sortie du process.
    // * Si on a tous les tags prérequis, et pas le by_pass on peut faire l'étape.
    // * On finira l'étape en posant le by_pass. Et ça déclenchera le process suivant si tous les prérequis sont ok.
    // * Attention si il y a plusieurs tags il faut mettre les plus 'rares' en premier pour optimiser le process
    // private get_valid_nodes(): VarDAGNode[] {

    //     let res: VarDAGNode[] = null;

    //     /**
    //      * On initialise la liste des noeuds à traiter sur la base du premier tag, et dans la limite où on a pas le bypass
    //      */
    //     for (let i in this.TAGS_IN_NAMES) {
    //         let TAG_IN_NAME = this.TAGS_IN_NAMES[i];

    //         if (!res) {
    //             res = Object.values(VarsdatasComputerBGThread.current_vardag.tags[TAG_IN_NAME]);
    //         }

    //         if (!res) {
    //             break;
    //         }
    //     }

    //     if ((!res) || (res.length == 0)) {
    //         return [];
    //     }

    //     res = res.filter((node) => !node.tags[this.TAG_OUT_NAME]);

    //     if (this.TAGS_IN_NAMES.length == 1) {
    //         return res;
    //     }

    //     for (let i in res) {
    //         let testnode = res[i];

    //         if (!testnode) {
    //             continue;
    //         }

    //         let is_valid = true;

    //         for (let j = 1; j < this.TAGS_IN_NAMES.length; j++) {
    //             let TAG_IN_NAME = this.TAGS_IN_NAMES[j];

    //             if (!testnode.tags[TAG_IN_NAME]) {
    //                 is_valid = false;
    //                 break;
    //             }
    //         }

    //         if (is_valid) {
    //             res.push(testnode);
    //         }
    //     }

    //     return res;
    // }

    /**
     * Filtrage des noeuds par subs clients. Pour prioriser les demandes clients. Si aucune en attente, on renvoie tous les noeuds.
     * @param nodes
     * @returns
     */
    private filter_by_subs(nodes: { [node_name: string]: VarDAGNode }): { [node_name: string]: VarDAGNode } {
        let filtered_nodes: { [node_name: string]: VarDAGNode } = {};
        let has_clients_subs = false;

        for (let i in nodes) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            if (!VarsClientsSubsCacheHandler.clients_subs_indexes_cache[node.var_data.index]) {
                continue;
            }

            filtered_nodes[i] = node;

            has_clients_subs = true;
        }

        if (!has_clients_subs) {
            return nodes;
        }

        return filtered_nodes;
    }
}
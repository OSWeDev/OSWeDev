import e from 'express';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsdatasComputerBGThread from '../VarsdatasComputerBGThread';

export default abstract class VarsProcessBase {

    /**
     * Si on a 0 workers, on ne fait pas de traitement en parallèle on part du principe que le traitement est synchrone (donc sans await, sans pipeline, ...)
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
        VarsdatasComputerBGThread.processes_waiting_for_invalidation_end[this.name] = false;

        let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps, this.name, true);
        let waiting_for_invalidation_time_in = null;

        while (true) {

            let did_something = false;

            // On checke une invalidation en attente
            waiting_for_invalidation_time_in = await this.handle_invalidations(promise_pipeline, waiting_for_invalidation_time_in);

            if (!this.as_batch) {
                did_something = await this.handle_individual_worker(promise_pipeline, did_something);
            } else {
                did_something = await this.handle_batch_worker(did_something);
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
        if (VarsdatasComputerBGThread.waiting_for_invalidation) {
            if (!VarsdatasComputerBGThread.processes_waiting_for_invalidation_end[this.name]) {

                if (!!this.MAX_Workers) {

                    let pipeline_end_wait_for_invalidation_time_in = Dates.now_ms();
                    // On doit attendre la fin du pipeline, pour indiquer qu'on est prêt à faire l'invalidation
                    await promise_pipeline.end();
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "pipeline_end_wait_for_invalidation", Dates.now_ms() - pipeline_end_wait_for_invalidation_time_in);
                }

                waiting_for_invalidation_time_in = Dates.now_ms();
                VarsdatasComputerBGThread.processes_waiting_for_invalidation_end[this.name] = true;
            }
            await ThreadHandler.sleep(this.thread_sleep, this.name);
            return waiting_for_invalidation_time_in;
        }

        // si on était en attente et que l'invalidation vient de se terminer, on indique qu'on reprend le travail
        if (VarsdatasComputerBGThread.processes_waiting_for_invalidation_end[this.name]) {
            VarsdatasComputerBGThread.processes_waiting_for_invalidation_end[this.name] = false;
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "waiting_for_invalidation", Dates.now_ms() - waiting_for_invalidation_time_in);
        }

        return waiting_for_invalidation_time_in;
    }

    private async handle_individual_worker(promise_pipeline: PromisePipeline, did_something: boolean): Promise<boolean> {
        let self = this;

        for (let i in VarsdatasComputerBGThread.current_vardag.tags[this.TAG_IN_NAME]) {
            let node = VarsdatasComputerBGThread.current_vardag.tags[this.TAG_IN_NAME][i];

            if (!node) {
                return did_something;
            }

            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, this.TAG_IN_NAME);
            node.remove_tag(this.TAG_IN_NAME);
            if (!node.add_tag(this.TAG_SELF_NAME)) {
                // On a un refus, lié à une suppression en attente sur ce noeud, on arrête les traitements
                continue;
            }

            did_something = true;

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

    private async handle_batch_worker(did_something: boolean): Promise<boolean> {

        let batch_nodes: { [node_name: string]: VarDAGNode } = {};

        for (let i in VarsdatasComputerBGThread.current_vardag.tags[this.TAG_IN_NAME]) {
            let node = VarsdatasComputerBGThread.current_vardag.tags[this.TAG_IN_NAME][i];

            if (!node) {
                continue;
            }

            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, this.TAG_IN_NAME);
            node.remove_tag(this.TAG_IN_NAME);
            if (!node.add_tag(this.TAG_SELF_NAME)) {
                // On a un refus, lié à une suppression en attente sur ce noeud, on arrête les traitements
                continue;
            }

            batch_nodes[node.var_data.index] = node;
            did_something = true;
        }

        if (did_something) {

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

        return did_something;
    }
}
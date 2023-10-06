import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import BGThreadServerController from '../../../BGThread/BGThreadServerController';
import CurrentVarDAGHolder from '../../CurrentVarDAGHolder';
import VarsBGThreadNameHolder from '../../VarsBGThreadNameHolder';
import VarsClientsSubsCacheHolder from './VarsClientsSubsCacheHolder';
import VarsComputationHole from './VarsComputationHole';

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

        // // On initialise le fait qu'on est pas en train d'attendre une invalidation
        VarsComputationHole.processes_waiting_for_computation_hole_end[this.name] = false;

        let promise_pipeline = this.as_batch ? null : new PromisePipeline(ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps, 'VarsProcessBase.' + this.name, true);
        let waiting_for_invalidation_time_in = null;

        while (true) {

            let did_something = false;

            // Particularité on doit s'enregistrer sur le main thread pour dire qu'on est en vie puisque le bgthread lui est plus vraiment adapté pour le faire
            BGThreadServerController.getInstance().register_alive_on_main_thread(VarsBGThreadNameHolder.bgthread_name);

            // On checke une invalidation en attente
            let updated_waiting_for_invalidation_time_in = await this.handle_invalidations(promise_pipeline, waiting_for_invalidation_time_in);
            if (updated_waiting_for_invalidation_time_in) {

                waiting_for_invalidation_time_in = updated_waiting_for_invalidation_time_in;
                continue;
            }

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
        if (VarsComputationHole.waiting_for_computation_hole) {
            if (!VarsComputationHole.processes_waiting_for_computation_hole_end[this.name]) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_invalidations:waiting_for_invalidation_time_in:IN');
                }

                if ((!!this.MAX_Workers) && (!this.as_batch)) {

                    let pipeline_end_wait_for_invalidation_time_in = Dates.now_ms();
                    // On doit attendre la fin du pipeline, pour indiquer qu'on est prêt à faire l'invalidation
                    await promise_pipeline.end();
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "pipeline_end_wait_for_invalidation", Dates.now_ms() - pipeline_end_wait_for_invalidation_time_in);
                }

                waiting_for_invalidation_time_in = Dates.now_ms();
                VarsComputationHole.processes_waiting_for_computation_hole_end[this.name] = true;
            }
            await ThreadHandler.sleep(this.thread_sleep, this.name);
            return waiting_for_invalidation_time_in;
        }

        // si on était en attente et que l'invalidation vient de se terminer, on indique qu'on reprend le travail
        if (VarsComputationHole.processes_waiting_for_computation_hole_end[this.name]) {
            VarsComputationHole.processes_waiting_for_computation_hole_end[this.name] = false;
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "waiting_for_invalidation", Dates.now_ms() - waiting_for_invalidation_time_in);

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_invalidations:waiting_for_invalidation_time_in:OUT');
            }
        }

        return null;
    }

    private async handle_individual_worker(promise_pipeline: PromisePipeline): Promise<boolean> {
        let self = this;
        let valid_nodes = this.get_valid_nodes();

        let did_something = false;
        for (let i in valid_nodes) {
            let node = valid_nodes[i];

            if (!!this.MAX_Workers) {
                await promise_pipeline.push(async () => {

                    let worker_time_in = Dates.now_ms();
                    let res = await self.worker_async(node);
                    did_something = did_something || res;
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                    self.handle_worker_result(res, worker_time_in, node);
                    node.remove_tag(this.TAG_SELF_NAME);
                });
            } else {
                let worker_time_in = Dates.now_ms();
                let res = this.worker_sync(node);
                did_something = did_something || res;
                StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                this.handle_worker_result(res, worker_time_in, node);
                node.remove_tag(this.TAG_SELF_NAME);
            }
        }

        return did_something;
    }

    private handle_worker_result(result: boolean, worker_time_in: number, node: VarDAGNode) {
        // Si on a pas fait l'action, on retente plus tard
        if (result) {
            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, "worker_ok");
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker_ok", Dates.now_ms() - worker_time_in);
            node.add_tag(this.TAG_OUT_NAME);
        } else {
            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, "worker_failed");
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker_failed", Dates.now_ms() - worker_time_in);
            node.add_tag(this.TAG_IN_NAME);
        }
    }

    private get_valid_nodes(): { [node_name: string]: VarDAGNode } {

        if (!CurrentVarDAGHolder.current_vardag) {
            return null;
        }

        /**
         * Si on a des vars registered par le client on veut les prioriser, donc on ignorera les autres pour le moment
         * Sinon on prend toutes les vars qui ont le tag in
         */
        let nodes: { [node_name: string]: VarDAGNode } = CurrentVarDAGHolder.current_vardag.current_step_tags[this.TAG_IN_NAME];

        if ((!nodes) || (!Object.keys(nodes).length)) {
            return null;
        }

        let subbed_nodes = this.filter_by_subs(nodes);
        if (subbed_nodes && Object.keys(subbed_nodes).length) {
            nodes = subbed_nodes;
        }

        let valid_nodes: { [node_name: string]: VarDAGNode } = {};

        for (let i in nodes) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, this.TAG_IN_NAME);

            // Si on a un by pass, on ne fait rien puisqu'on a déjà le tag out - on gère le cas spécifique du delete dont le in et out sont iso
            if ((this.TAG_OUT_NAME != this.TAG_IN_NAME) && node.tags[this.TAG_OUT_NAME]) {
                node.remove_tag(this.TAG_IN_NAME);
                continue;
            }

            if (!node.add_tag(this.TAG_SELF_NAME)) {
                // On a un refus, lié à une suppression en attente sur ce noeud, on arrête les traitements
                node.remove_tag(this.TAG_IN_NAME);
                continue;
            }

            // On remove_tag après le add_tag sinon si on a déjà tag une étape >, on peut plus tagger < à current_step
            node.remove_tag(this.TAG_IN_NAME);
            valid_nodes[node.var_data.index] = node;
        }

        return valid_nodes;
    }

    private async handle_batch_worker(): Promise<boolean> {

        let batch_nodes: { [node_name: string]: VarDAGNode } = this.get_valid_nodes();
        let has_something_to_do = batch_nodes ? Object.keys(batch_nodes).length > 0 : false;

        if (has_something_to_do) {

            // On peut vouloir traiter en mode batch
            let worker_time_in = Dates.now_ms();
            let res = await this.worker_async_batch(batch_nodes);
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

            for (let i in batch_nodes) {
                let node = batch_nodes[i];

                // Si on a pas fait l'action, on retente plus tard
                if (res) {
                    StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, "worker_ok");
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker_ok", Dates.now_ms() - worker_time_in);
                    node.add_tag(this.TAG_OUT_NAME);
                } else {
                    StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, "worker_failed");
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker_failed", Dates.now_ms() - worker_time_in);
                    node.add_tag(this.TAG_IN_NAME);
                }
                node.remove_tag(this.TAG_SELF_NAME);
            }
        }

        return has_something_to_do;
    }

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

            if (!VarsClientsSubsCacheHolder.clients_subs_indexes_cache[node.var_data.index]) {
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
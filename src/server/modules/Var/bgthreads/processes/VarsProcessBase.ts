import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDAGNode from '../../../../../server/modules/Var/vos/VarDAGNode';
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

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:IN');
        }

        while (true) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:IN:');
            }

            let did_something = false;

            // Particularité on doit s'enregistrer sur le main thread pour dire qu'on est en vie puisque le bgthread lui est plus vraiment adapté pour le faire
            BGThreadServerController.register_alive_on_main_thread(VarsBGThreadNameHolder.bgthread_name);

            let valid_nodes = this.get_valid_nodes();

            // // Si on a des noeuds, et en particulier des noeuds clients, on ne doit pas faire d'invalidation sans avoir traité les noeuds clients
            // // let has_client_nodes = false;
            // let has_node = false;
            // for (let i in valid_nodes) {
            //     let node = valid_nodes[i];

            //     if (!node) {
            //         continue;
            //     }

            //     has_node = true;
            //     break;

            //     // if (node.is_client_sub) {
            //     //     has_client_nodes = true;
            //     //     break;
            //     // }
            // }

            // // if (!has_client_nodes) {
            // if (!has_node) {
            if ((!this.has_nodes_to_process_in_current_tree) && ((!promise_pipeline) || (!promise_pipeline.nb_running_promises)) {

                // On checke une invalidation en attente
                let updated_waiting_for_invalidation_time_in = await this.handle_invalidations(promise_pipeline, waiting_for_invalidation_time_in);
                if (updated_waiting_for_invalidation_time_in) {

                    if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                        ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_invalidations:updated_waiting_for_invalidation_time_in:' + updated_waiting_for_invalidation_time_in);
                    }
                    waiting_for_invalidation_time_in = updated_waiting_for_invalidation_time_in;
                    continue;
                }
            }

            if (!this.as_batch) {
                did_something = await this.handle_individual_worker(promise_pipeline, valid_nodes);
            } else {
                did_something = await this.handle_batch_worker(valid_nodes);
            }

            if (!did_something) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                    ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:did_something:false');
                }

                await ThreadHandler.sleep(this.thread_sleep, this.name);
            }

            // On attend d'avoir un slot de disponible si besoin avant de refaire une boucle
            if (!!promise_pipeline) {
                await promise_pipeline.await_free_slot();
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:did_something:true');
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

    private async handle_individual_worker(promise_pipeline: PromisePipeline, valid_nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        let self = this;

        let time_in = Dates.now_ms();
        let untreated_nodes: { [index: string]: VarDAGNode } = {};

        for (let i in valid_nodes) {
            untreated_nodes[i] = valid_nodes[i];
        }

        let did_something = false;
        for (let i in valid_nodes) {
            let node = valid_nodes[i];

            // Si on a plus de free_slot, et qu'on a fait plus de 0.5 seconde de travail - totalement arbitraire -, on attend le prochain run
            if ((!!promise_pipeline) && (!promise_pipeline.has_free_slot()) && ((Dates.now_ms() - time_in) > 500)) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                    ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_individual_worker:break:!has_free_slot:' + node.var_data.index + ':' + node.var_data.value + ':' + ((Dates.now_ms() - time_in) / 1000));
                }

                // On peut pas break directement, il faut remettre les noeuds valids non traités en attente
                for (let j in untreated_nodes) {
                    let untreated_node = untreated_nodes[j];

                    untreated_node.remove_tag(this.TAG_SELF_NAME);
                    untreated_node.add_tag(this.TAG_IN_NAME);

                    if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                        ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:break:node:' + untreated_node.var_data.index + ':' + untreated_node.var_data.value);
                    }
                }

                break;
            }

            delete untreated_nodes[i];

            if (!!this.MAX_Workers) {
                await promise_pipeline.push(async () => {

                    if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                        ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:ASYNC:IN:' + node.var_data.index + ':' + node.var_data.value);
                    }

                    let worker_time_in = Dates.now_ms();
                    let res = await self.worker_async(node);
                    did_something = did_something || res;
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                    if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                        ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:ASYNC:OUT:' + node.var_data.index + ':' + node.var_data.value);
                    }

                    self.handle_worker_result(res, worker_time_in, node);
                    node.remove_tag(this.TAG_SELF_NAME);
                });
            } else {

                if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:SYNC:IN:' + node.var_data.index + ':' + node.var_data.value);
                }

                let worker_time_in = Dates.now_ms();
                let res = this.worker_sync(node);
                did_something = did_something || res;
                StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:SYNC:OUT:' + node.var_data.index + ':' + node.var_data.value);
                }

                this.handle_worker_result(res, worker_time_in, node);
                node.remove_tag(this.TAG_SELF_NAME);
            }
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_individual_worker:OUT');
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

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:IN');
        }

        /**
         * Si on a des vars registered par le client on veut les prioriser, donc on ignorera les autres pour le moment
         * Sinon on prend toutes les vars qui ont le tag in
         */
        let nodes: { [node_name: string]: VarDAGNode } = CurrentVarDAGHolder.current_vardag.current_step_tags[this.TAG_IN_NAME];

        if ((!nodes) || (!Object.keys(nodes).length)) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:OUT:pas de nodes');
            }

            return null;
        }

        let subbed_nodes = this.filter_by_subs(nodes);
        if (subbed_nodes && Object.keys(subbed_nodes).length) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:subbed_nodes');
            }

            nodes = subbed_nodes;
        }

        let valid_nodes: { [node_name: string]: VarDAGNode } = {};

        for (let i in nodes) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':get_valid_nodes:node:' + node.var_data.index + ':' + node.var_data.value);
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

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:OUT:' + Object.keys(valid_nodes).length);
        }

        return valid_nodes;
    }

    private async handle_batch_worker(batch_nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        let has_something_to_do = batch_nodes ? Object.keys(batch_nodes).length > 0 : false;

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_batch_worker:IN:');
        }

        if (has_something_to_do) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_batch_worker:worker_async_batch:IN:');
            }

            // On peut vouloir traiter en mode batch
            let worker_time_in = Dates.now_ms();
            let res = await this.worker_async_batch(batch_nodes);
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

            if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_batch_worker:worker_async_batch:OUT:' + res);
            }

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

        if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_batch_worker:OUT:');
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

            // On met à jour les infos de subs client (le serveur c'est moins grave)
            let is_client_sub = !!VarsClientsSubsCacheHolder.clients_subs_indexes_cache[node.var_data.index];
            if (node.is_client_sub != is_client_sub) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_PROCESSES) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':filter_by_subs:node:' + node.var_data.index + ':' + node.var_data.value + ':updated is_client_sub:' + is_client_sub);
                }

                node.is_client_sub = is_client_sub;
            }

            if ((!node.is_client_sub) &&
                (!node.is_client_sub_dep)) {
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

    get has_nodes_to_process_in_current_tree() {
        return !!CurrentVarDAGHolder.current_vardag && !!CurrentVarDAGHolder.current_vardag.nb_nodes;
    }
}
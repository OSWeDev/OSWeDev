import EventsController from '../../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import PerfReportController from '../../../../../shared/modules/PerfReport/PerfReportController';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import CurrentVarDAGHolder from '../../CurrentVarDAGHolder';
import VarsClientsSubsCacheHolder from './VarsClientsSubsCacheHolder';
import VarsComputationHole from './VarsComputationHole';

export default abstract class VarsProcessBase {

    public static registered_processes_work_event_name_by_tag_in: { [tag_in: string]: string } = {};

    /**
     * Quand on sélectionne trop de noeuds et qu'on timeout, on les met en attente pour le prochain run
     */
    protected waiting_valid_nodes: { [node_name: string]: VarDAGNode } = null;

    // protected thread_sleep_coef: number = 1;
    // protected thread_sleep_max_coef: number = 100;
    // protected thread_sleep_evol_coef: number = 1.5;

    protected promise_pipeline: PromisePipeline = null;
    protected work_event_name: string = null;

    /**
     * Si on a 0 workers, on ne fait pas de traitement en parallèle on part du principe que le traitement est synchrone (donc sans await, sans pipeline, ...)
     * @param TAG_BY_PASS_NAME Tag qui permet de dire que si le noeud est valide pour execution, on ne le traite pas et on pose le tag out directement
     */
    protected constructor(
        protected name: string,
        protected TAG_IN_NAME: string,
        protected TAG_SELF_NAME: string,
        protected TAG_OUT_NAME: string,
        // protected thread_sleep: number,
        protected as_batch: boolean = false,
        protected MAX_Workers: number = 0) {

        this.work_event_name = 'VarsProcessBase.work_event.' + this.name;
        VarsProcessBase.registered_processes_work_event_name_by_tag_in[this.TAG_IN_NAME] = this.work_event_name;

        EventsController.on_every_event_throttle_cb(
            VarsProcessBase.registered_processes_work_event_name_by_tag_in[this.TAG_IN_NAME],
            this.work.bind(this),
            1,
            true,
        );

        this.promise_pipeline = (this.as_batch || !this.MAX_Workers) ? null : new PromisePipeline(this.MAX_Workers, 'VarsProcessBase.' + this.name, true);
    }

    get has_nodes_to_process_in_current_tree() {
        return !!CurrentVarDAGHolder.current_vardag && !!CurrentVarDAGHolder.current_vardag.nb_nodes;
    }

    public async work(): Promise<void> {

        if (ConfigurationService.node_configuration.debug_vars_processes) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:IN');
        }

        // if (ConfigurationService.node_configuration.debug_vars_processes) {
        //     ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:IN:');
        // }

        // let did_something = false;

        // // Particularité on doit s'enregistrer sur le main thread pour dire qu'on est en vie puisque le bgthread lui est plus vraiment adapté pour le faire
        // BGThreadServerController.register_alive_on_main_thread({ [VarsBGThreadNameHolder.bgthread_name]: true });

        // Le get_valid_nodes block le noeud le temps du traitement, on doit donc unlock par la suite
        const valid_nodes: { [node_name: string]: VarDAGNode } = this.waiting_valid_nodes ? this.waiting_valid_nodes : this.get_valid_nodes();
        this.waiting_valid_nodes = null;

        // On lock le node pour éviter la mise à jour trop rapide du current_step, et on delock en fin de traitement
        const nodes_to_unlock: VarDAGNode[] = valid_nodes ? Object.values(valid_nodes) : [];

        if (valid_nodes && Object.keys(valid_nodes).length) {
            // A voir si on peut faire ce check sans baisser la perf globale, surtout depuis qu'on passe en events
            // // Si on a des nodes dans l'arbre, on va regarder si le process n'est pas bloqué
            // CurrentVarDAGHolder.check_current_vardag_throttler();

            if (!this.as_batch) {
                // did_something = await this.handle_individual_worker(this.promise_pipeline, valid_nodes);
                await this.handle_individual_worker(this.promise_pipeline, valid_nodes, nodes_to_unlock);
            } else {
                // did_something = await this.handle_batch_worker(valid_nodes);
                await this.handle_batch_worker(valid_nodes, nodes_to_unlock);
            }
        }

        VarDAGNode.unlock_nodes(nodes_to_unlock);

        // if (!did_something) {
        //     if (ConfigurationService.node_configuration.debug_vars_processes) {
        //         ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:did_something:false');
        //     }

        //     this.thread_sleep_coef = Math.min(this.thread_sleep_max_coef, this.thread_sleep_coef * this.thread_sleep_evol_coef);
        // } else {
        //     this.thread_sleep_coef = 1;
        // }

        // await ThreadHandler.sleep(this.thread_sleep * this.thread_sleep_coef, this.name);

        // // On attend d'avoir un slot de disponible si besoin avant de refaire une boucle
        // if (this.promise_pipeline) {
        //     await this.promise_pipeline.await_free_slot();
        // }

        if (ConfigurationService.node_configuration.debug_vars_processes) {
            // ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:LOOP:did_something:true');
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':work:OUT');
        }
    }

    private async handle_individual_worker(
        promise_pipeline: PromisePipeline,
        valid_nodes: { [node_name: string]: VarDAGNode },
        nodes_to_unlock: VarDAGNode[],
    ): Promise<boolean> {

        const self = this;

        const time_in = Dates.now_ms();
        const untreated_nodes: { [index: string]: VarDAGNode } = {};

        for (const i in valid_nodes) {
            untreated_nodes[i] = valid_nodes[i];
        }

        let did_something = false;
        for (const i in valid_nodes) {
            const node = valid_nodes[i];

            // Si on a plus de free_slot, et qu'on a fait plus de 2 secondes de travail - totalement arbitraire -, on attend le prochain run
            if ((!!promise_pipeline) && (!promise_pipeline.has_free_slot()) && ((Dates.now_ms() - time_in) > 2000)) {

                if (ConfigurationService.node_configuration.debug_vars_processes) {
                    ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_individual_worker:break:!has_free_slot:' + node.var_data.index + ':' + node.var_data.value + ':' + ((Dates.now_ms() - time_in) / 1000));
                }

                // On peut pas break directement, il faut remettre les noeuds valids non traités en attente
                this.waiting_valid_nodes = untreated_nodes;
                break;
            }

            delete untreated_nodes[i];

            if (this.MAX_Workers) {
                await promise_pipeline.push(async () => {

                    if (ConfigurationService.node_configuration.debug_vars_processes) {
                        ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:ASYNC:IN:' + node.var_data.index + ':' + node.var_data.value);
                    }

                    const worker_time_in = Dates.now_ms();
                    const res = await self.worker_async(node, nodes_to_unlock);
                    did_something = did_something || res;
                    StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                    if (ConfigurationService.node_configuration.debug_vars_processes) {
                        ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:ASYNC:OUT:' + node.var_data.index + ':' + node.var_data.value);
                    }

                    self.handle_worker_result(res, worker_time_in, node);
                    node.remove_tag(this.TAG_SELF_NAME);
                });
            } else {

                if (ConfigurationService.node_configuration.debug_vars_processes) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:SYNC:IN:' + node.var_data.index + ':' + node.var_data.value);
                }

                const worker_time_in = Dates.now_ms();
                const res = this.worker_sync(node, nodes_to_unlock);
                did_something = did_something || res;
                StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

                if (ConfigurationService.node_configuration.debug_vars_processes) {
                    ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_individual_worker:SYNC:OUT:' + node.var_data.index + ':' + node.var_data.value);
                }

                this.handle_worker_result(res, worker_time_in, node);
                node.remove_tag(this.TAG_SELF_NAME);
            }
        }

        if (ConfigurationService.node_configuration.debug_vars_processes) {
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

        this.handle_perf_report(node, worker_time_in);
    }

    private handle_perf_report(node: VarDAGNode, worker_time_in: number) {
        const perf_name = node.var_data.index;
        const perf_line_name = node.var_data.index;
        PerfReportController.add_cooldown(
            VarDAGNode.PERF_MODULE_NAME,
            perf_name,
            perf_line_name,
            null,
            worker_time_in,
            Dates.now_ms(),
            node.get_node_description_for_perfs(this.name),
        );
    }

    private get_valid_nodes(): { [node_name: string]: VarDAGNode } {

        if (!CurrentVarDAGHolder.current_vardag) {
            return null;
        }

        if (VarsComputationHole.currently_in_a_hole_semaphore) {

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:IN:currently_in_a_hole_semaphore');
            }

            return null;
        }

        if (ConfigurationService.node_configuration.debug_vars_processes) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:IN');
        }

        /**
         * Si on a des vars registered par le client on veut les prioriser, donc on ignorera les autres pour le moment
         * Sinon on prend toutes les vars qui ont le tag in
         */
        let nodes: { [node_name: string]: VarDAGNode } = CurrentVarDAGHolder.current_vardag.current_step_tags[this.TAG_IN_NAME];
        const nb_valid_nodes = nodes ? Object.keys(nodes).length : 0;

        if ((!nodes) || (!Object.keys(nodes).length)) {

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:OUT:pas de nodes');
            }

            return null;
        }

        const subbed_nodes = this.filter_by_subs(nodes);
        if (subbed_nodes && Object.keys(subbed_nodes).length) {

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:subbed_nodes');
            }

            nodes = subbed_nodes;
        }

        const valid_nodes: { [node_name: string]: VarDAGNode } = {};
        let nb_nodes = 0;

        for (const i in nodes) {
            const node = nodes[i];

            if (!node) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':get_valid_nodes:node:' + node.var_data.index + ':' + node.var_data.value);
            }

            StatsController.register_stat_COMPTEUR('VarsProcessBase', this.name, this.TAG_IN_NAME);

            // Si on a un by pass, on ne fait rien puisqu'on a déjà le tag out - on gère le cas spécifique du delete dont le in et out sont iso
            if ((this.TAG_OUT_NAME != this.TAG_IN_NAME) && node.tags[this.TAG_OUT_NAME]) {
                node.remove_tag(this.TAG_IN_NAME);
                continue;
            }

            // On lock le noeud pour limiter les traitements en parallèle sur un noeud donné
            node.lock();

            if (!node.add_tag(this.TAG_SELF_NAME)) {
                // On a un refus, lié à une suppression en attente sur ce noeud, on arrête les traitements
                node.remove_tag(this.TAG_IN_NAME);
                node.unlock();
                continue;
            }

            // On remove_tag après le add_tag sinon si on a déjà tag une étape >, on peut plus tagger < à current_step
            node.remove_tag(this.TAG_IN_NAME);
            valid_nodes[node.var_data.index] = node;

            if (this.as_batch) {
                nb_nodes++;

                if (nb_nodes >= this.MAX_Workers) {
                    // Dans le cas d'un batch on limite le nombre de nodes à traiter pour pas tout bloquer le temps de résoudre l'ensemble
                    break;
                }
            }
        }

        /**
         * Cas des évènements, avec une sélection de noeuds qui ne contient pas tous les noeuds valides, on doit prévoir une boucle, via l'appel de l'event work de ce process
         */
        if (nb_valid_nodes > Object.keys(valid_nodes).length) {
            EventsController.emit_event(EventifyEventInstanceVO.new_event(this.work_event_name));
        }

        if (ConfigurationService.node_configuration.debug_vars_processes) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':get_valid_nodes:OUT:' + Object.keys(valid_nodes).length);
        }

        return valid_nodes;
    }

    private async handle_batch_worker(
        batch_nodes: { [node_name: string]: VarDAGNode },
        nodes_to_unlock: VarDAGNode[],
    ): Promise<boolean> {

        const has_something_to_do = batch_nodes ? Object.keys(batch_nodes).length > 0 : false;

        if (ConfigurationService.node_configuration.debug_vars_processes) {
            ConsoleHandler.throttle_log('VarsProcessBase:' + this.name + ':handle_batch_worker:IN:');
        }

        if (has_something_to_do) {

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_batch_worker:worker_async_batch:IN:');
            }

            // On peut vouloir traiter en mode batch
            const worker_time_in = Dates.now_ms();
            const res = await this.worker_async_batch(batch_nodes, nodes_to_unlock);
            StatsController.register_stat_DUREE('VarsProcessBase', this.name, "worker", Dates.now_ms() - worker_time_in);

            if (ConfigurationService.node_configuration.debug_vars_processes) {
                ConsoleHandler.log('VarsProcessBase:' + this.name + ':handle_batch_worker:worker_async_batch:OUT:' + res);
            }

            for (const i in batch_nodes) {
                const node = batch_nodes[i];

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

                this.handle_perf_report(node, worker_time_in);
            }
        }

        if (ConfigurationService.node_configuration.debug_vars_processes) {
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
        const filtered_nodes: { [node_name: string]: VarDAGNode } = {};
        let has_clients_subs = false;

        for (const i in nodes) {
            const node = nodes[i];

            if (!node) {
                continue;
            }

            // On met à jour les infos de subs client (le serveur c'est moins grave)
            const is_client_sub = !!VarsClientsSubsCacheHolder.clients_subs_indexes_cache[node.var_data.index];
            if (node.is_client_sub != is_client_sub) {

                if (ConfigurationService.node_configuration.debug_vars_processes) {
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

    protected abstract worker_async_batch(nodes: { [node_name: string]: VarDAGNode }, nodes_to_unlock: VarDAGNode[]): Promise<boolean>;

    protected abstract worker_async(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): Promise<boolean>;
    protected abstract worker_sync(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): boolean;
}
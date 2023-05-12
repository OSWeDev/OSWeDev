import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import VarDAG from '../../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarBatchNodePerfVO from '../../../../shared/modules/Var/vos/VarBatchNodePerfVO';
import VarBatchPerfVO from '../../../../shared/modules/Var/vos/VarBatchPerfVO';
import VarBatchVarPerfVO from '../../../../shared/modules/Var/vos/VarBatchVarPerfVO';
import VarComputeTimeLearnBaseVO from '../../../../shared/modules/Var/vos/VarComputeTimeLearnBaseVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VarNodePerfElementVO from '../../../../shared/modules/Var/vos/VarNodePerfElementVO';
import VarPerfElementVO from '../../../../shared/modules/Var/vos/VarPerfElementVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import MatroidIndexHandler from '../../../../shared/tools/MatroidIndexHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../../env/ConfigurationService';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import StatsServerController from '../../Stats/StatsServerController';
import SlowVarKiHandler from '../SlowVarKi/SlowVarKiHandler';
import VarDagPerfsServerController from '../VarDagPerfsServerController';
import VarsComputeController from '../VarsComputeController';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static TASK_NAME_force_run_asap: string = 'VarsdatasComputerBGThread.force_run_asap';
    // public static TASK_NAME_switch_force_1_by_1_computation: string = 'VarsdatasComputerBGThread.switch_force_1_by_1_computation';
    public static TASK_NAME_switch_add_computation_time_to_learning_base: string = 'VarsdatasComputerBGThread.switch_add_computation_time_to_learning_base';

    public static PARAM_NAME_client_request_estimated_ms_limit: string = 'VarsdatasComputerBGThread.client_request_estimated_ms_limit';
    public static PARAM_NAME_bg_estimated_ms_limit: string = 'VarsdatasComputerBGThread.bg_estimated_ms_limit';
    public static PARAM_NAME_bg_min_nb_vars: string = 'VarsdatasComputerBGThread.bg_min_nb_vars';
    public static PARAM_NAME_client_request_min_nb_vars: string = 'VarsdatasComputerBGThread.client_request_min_nb_vars';

    public static getInstance() {
        if (!VarsdatasComputerBGThread.instance) {
            VarsdatasComputerBGThread.instance = new VarsdatasComputerBGThread();
        }
        return VarsdatasComputerBGThread.instance;
    }

    private static instance: VarsdatasComputerBGThread = null;

    public current_timeout: number = 2;
    public MAX_timeout: number = 2;
    public MIN_timeout: number = 1;

    public exec_in_dedicated_thread: boolean = true;

    public is_computing: boolean = false;

    /**
     * Le BATCH ID actuel
     */
    public current_batch_id: number = 0;

    /**
     * Les paramètres liés au batch actuel (les var_datas qu'on a décidé de choisir pour le batch)
     */
    public current_batch_params: { [index: string]: VarDataBaseVO } = null;

    /**
     * La liste des vars qu'on veut dépiler, dans le bon ordre pour pouvoir construire l'arbre en dépilant des vars de cette liste
     */
    public current_batch_ordered_pick_list: Array<VarDataProxyWrapperVO<VarDataBaseVO>> = null;

    /**
     * Le cache des datasources lié au batch actuel
     */
    public current_batch_ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};

    /**
     * Les VarDAGPerfs en attente d'enregistrement dans la base de données
     */
    public last_vardag_perfs: VarBatchPerfVO[] = [];

    /**
     * Marker à activer pour forcer l'exécution au plus vite du prochain calcul
     */
    public run_asap: boolean = true;

    // /**
    //  * Activate to force computation of 1 var at a time
    //  */
    // public force_1_by_1_computation: boolean = false;
    /**
     * Activate to save computation stats to the learning base
     */
    public add_computation_time_to_learning_base: boolean = false;

    /**
     * Par défaut, sans intervention extérieur, on a pas besoin de faire des calculs tellement souvent
     */

    public force_run_asap = ThrottleHelper.getInstance().declare_throttle_without_args(this.force_run_asap_throttled.bind(this), 10, { leading: true, trailing: true });
    public semaphore: boolean = false;

    /**
     * Le VarDAG lié au batch actuel
     */
    private _current_batch_vardag: VarDAG = null;

    private timeout_calculation: number = 30;
    private last_calculation_unix: number = 0;

    private partial_clean_next_ms: number = 0;

    private constructor() {
        // ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_switch_force_1_by_1_computation, this.switch_force_1_by_1_computation.bind(this));
        ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_switch_add_computation_time_to_learning_base, this.switch_add_computation_time_to_learning_base.bind(this));
        ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_force_run_asap, this.force_run_asap.bind(this));
    }

    get current_batch_vardag(): VarDAG {
        return this._current_batch_vardag;
    }

    set current_batch_vardag(vardag: VarDAG) {
        this._current_batch_vardag = vardag;
        VarNodePerfElementVO.current_var_dag = vardag ? vardag : VarNodePerfElementVO.current_var_dag;
    }

    public async switch_add_computation_time_to_learning_base(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.error('failed switch_add_computation_time_to_learning_base' + error);
                resolve(true);
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                VarsdatasComputerBGThread.getInstance().name,
                VarsdatasComputerBGThread.TASK_NAME_switch_add_computation_time_to_learning_base, resolve)) {
                return;
            }

            this.add_computation_time_to_learning_base = !this.add_computation_time_to_learning_base;
            resolve(true);
        });
    }

    get name(): string {
        return "VarsdatasComputerBGThread";
    }

    /**
     * ATTENTION à n'appeler cette fonction que dans le thread dédié à ce bgthread
     * On veut un système d'appel un peu particulier qui permette de dire si le front demande une valeur de var, on veut dépiler la demande
     *  asap, et sans qu'on puisse avec des lancements en parralèle donc quelque chose qui puisse couper le délai entre 2 appels au bgthread
     *  mais qui en revanche s'assure d'utiliser un sémaphore pour ne jamais lancer 2 fois le calcul
     */
    public async work(): Promise<number> {

        let time_in = Dates.now_ms();

        try {
            StatsServerController.register_stat('VarsdatasComputerBGThread', 'work', 'IN', StatsTypeVO.TYPE_COMPTEUR, 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

            /**
             * On change de méthode, on lance immédiatement si c'est utile/demandé, sinon on attend le timeout
             */
            if (this.semaphore) {
                this.last_calculation_unix = Dates.now();
                this.stats_out('inactive_semaphore', time_in);
                return;
            }

            let do_run: boolean = this.run_asap;

            if (!do_run) {
                if (Dates.now() > (this.last_calculation_unix + this.timeout_calculation)) {
                    do_run = true;
                }
            }

            if (do_run) {
                await this.do_calculation_run();
                this.last_calculation_unix = Dates.now();
                this.stats_out('ok', time_in);
            } else {
                this.stats_out('inactive', time_in);
            }

            return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        } catch (error) {
            ConsoleHandler.error('VarsdatasComputerBGThread.work error : ' + error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsServerController.register_stat('VarsdatasComputerBGThread', 'work', activity + '_OUT', StatsTypeVO.TYPE_COMPTEUR, 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('VarsdatasComputerBGThread', 'work', activity + '_OUT', StatsTypeVO.TYPE_DUREE, time_out - time_in,
            [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
    }

    private async do_calculation_run(): Promise<void> {
        if (this.semaphore) {
            return;
        }
        this.semaphore = true;
        this.run_asap = false;

        if ((!VarsController.getInstance().var_conf_by_id) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(VarsController.getInstance().var_conf_by_id))) {
            this.semaphore = false;
            this.run_asap = true;
            return;
        }

        try {

            VarsdatasComputerBGThread.getInstance().current_batch_id++;
            VarsdatasComputerBGThread.getInstance().is_computing = true;
            VarsdatasComputerBGThread.getInstance().current_batch_params = {};
            VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = null;

            let var_dag: VarDAG = new VarDAG();
            VarsdatasComputerBGThread.getInstance().current_batch_vardag = var_dag;
            var_dag.init_perfs(VarsdatasComputerBGThread.getInstance().current_batch_id);

            if (var_dag.perfs) {
                VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.batch_wrapper, 'batch_wrapper');
            }

            /**
             * On dépile les CUD sur les VOs et faire les invalidations
             */

            // let refuse_computation =
            await this.varsdatas_voupdate_handle_buffer_perf_wrapper(var_dag);

            /**
             * On invalide les vars si des intersecteurs sont en attente
             */
            await this.handle_invalidators_perf_wrapper(var_dag);

            /**
             * Fonctionnement :
             *  - On a sélectionné une liste de vars à calculer.
             *  - On demande au VarsComputeController de faire les calculs et de renvoyer la data
             *  - Une fois le calcul fait, on renvoie l'info aux sockets abonnés
             *  - Et on met à jour la bdd asap => insert or update puisqu'on peut avoir des demandes qui sont en mémoires et pas en base
             *      => attention pour sécuriser ce point il faudrait déclarer une clé unique sur les var datas et sécuriser le insert or update pour qu'en cas d'insertion ratée pour
             *          clé dupliquée, on retrouve le vo avec la même clé unique et on le mette à jour du coup au lieu d'insérer
             *      => La mise à jour asap est nécessaire uniquement si on a pas de cache de vars datas en mémoire en instance d'insertion en base, mais
             *          on peut imaginer d'avoir un bgthread qui traite les insert or update de vars datas en base et que les calculs par exemple prenne en compte aussi cette stack en attente
             *  - on libère le bgthread, en indiquant qu'on a eu des choses à gérer donc il faut revenir très rapidement
             */

            // let did_something: boolean = false;

            // if (!refuse_computation) {
            // did_something = await this.do_computation(var_dag);
            // }

            let did_something: boolean = await this.do_computation(var_dag);

            if (!did_something) {

                // ConsoleHandler.log('VarsdatasComputerBGThread.do_calculation_run:!did_something:refuse_computation:' + refuse_computation + ':');
                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log('VarsdatasComputerBGThread.do_calculation_run:!did_something');
                }

                if (VarsDatasVoUpdateHandler.getInstance().last_call_handled_something) {
                    this.run_asap = true;
                } else {

                    // // Si on fait rien c'est qu'on a le temps de nettoyer un peu la BDD
                    // Marche pas si on a plus de last_read or sur les pixels on en veut pas... donc à creuser si on supprimerai pas tout ce foutoir de last_read
                    // if (performance.now() > this.partial_clean_next_ms) {
                    //     // On limite à un appel toutes les secondes
                    //     this.partial_clean_next_ms = performance.now() + 1000;

                    //     if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    //         ConsoleHandler.log('VarsdatasComputerBGThread.do_calculation_run:partially_clean_bdd_cache:IN');
                    //     }
                    //     await VarsCacheController.getInstance().partially_clean_bdd_cache(); // PERF OK
                    //     if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    //         ConsoleHandler.log('VarsdatasComputerBGThread.do_calculation_run:partially_clean_bdd_cache:OUT');
                    //     }
                    // }
                }
            } else {
                this.run_asap = true;
            }

            /**
             * On met à jour la bdd si nécessaire
             */
            await this.varsdatas_proxy_handle_buffer_perf_wrapper(var_dag);

            if (var_dag.perfs) {
                VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.batch_wrapper, 'batch_wrapper');
            }

            this.log_perfs(var_dag);

            await this.save_last_dag_perfs(var_dag);
        } catch (error) {
            console.error(error);
        }

        this.semaphore = false;
    }

    /**
     * Objectif : on prend le dernier var_dag et on save en base les perfs pour que
     *  le cron en charge de recalculer les params des varconfs/varcacheconf puisse le faire tranquillement par la suite
     * Quand le batch est en cours, on construit les infos de chaque noeuds. à la fin on déduis de ces noeuds les varperfs
     *  pour chaque var_id impliqué dans l'arbre (qui a des stats). Donc à la fin on sauvegarde à la fois le batch perfs et les vars perfs qui
     *  font référence au batch perf
     * Ensuite c'est un cron/bgthread (le cron a l'avantage d'être lançable à la main rapidement quand on a besoin) qui recalcule les
     *  params des varconf et varcacheconf, en utilisant les x derniers varperfs qui sont liées à chaque var_id
     */
    private async save_last_dag_perfs(var_dag: VarDAG) {

        let vardag_perfs = var_dag.perfs;
        let vardag_perfs_res = await ModuleDAO.getInstance().insertOrUpdateVO(vardag_perfs);
        if ((!vardag_perfs_res) || (!vardag_perfs_res.id)) {
            ConsoleHandler.error('Failed insert vardag_perfs_res:save_last_dag_perfs');
            return;
        }

        vardag_perfs.id = vardag_perfs_res.id;

        let all_var_perfs: { [var_id: number]: VarBatchVarPerfVO } = {};
        for (let i in var_dag.nodes) {
            let node = var_dag.nodes[i];

            if ((!node) || (!node.perfs) || (!node.var_data)) {
                continue;
            }

            let this_var_perfs = all_var_perfs[node.var_data.var_id];
            if (!this_var_perfs) {
                this_var_perfs = this.init_new_var_batch_var_perf_element(vardag_perfs.id, node.var_data.var_id);
                all_var_perfs[node.var_data.var_id] = this_var_perfs;
            }
            this.add_var_node_perfs(node.perfs, this_var_perfs, node);
        }

        await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(Object.values(all_var_perfs));
    }

    private init_new_var_batch_var_perf_element(var_batch_perf_id: number, var_id: number): VarBatchVarPerfVO {
        let res = new VarBatchVarPerfVO();

        res.var_batch_perf_id = var_batch_perf_id;
        res.var_id = var_id;

        res.ctree_ddeps_try_load_cache_complet = new VarPerfElementVO();
        res.ctree_ddeps_load_imports_and_split_nodes = new VarPerfElementVO();
        res.ctree_ddeps_try_load_cache_partiel = new VarPerfElementVO();
        res.ctree_ddeps_get_node_deps = new VarPerfElementVO();
        res.ctree_ddeps_handle_pixellisation = new VarPerfElementVO();

        res.load_node_datas = new VarPerfElementVO();
        res.compute_node = new VarPerfElementVO();
        return res;
    }

    private add_var_node_perfs(add_this: VarBatchNodePerfVO, into: VarBatchVarPerfVO, node: VarDAGNode) {
        this.add_var_node_perf_element(add_this.ctree_ddeps_get_node_deps, into.ctree_ddeps_get_node_deps, node);
        this.add_var_node_perf_element(add_this.ctree_ddeps_handle_pixellisation, into.ctree_ddeps_handle_pixellisation, node);
        this.add_var_node_perf_element(add_this.ctree_ddeps_load_imports_and_split_nodes, into.ctree_ddeps_load_imports_and_split_nodes, node);
        this.add_var_node_perf_element(add_this.ctree_ddeps_try_load_cache_complet, into.ctree_ddeps_try_load_cache_complet, node);
        this.add_var_node_perf_element(add_this.ctree_ddeps_try_load_cache_partiel, into.ctree_ddeps_try_load_cache_partiel, node);

        this.add_var_node_perf_element(add_this.load_node_datas, into.load_node_datas, node);
        this.add_var_node_perf_element(add_this.compute_node, into.compute_node, node);
    }

    private add_var_node_perf_element(add_this: VarNodePerfElementVO, into: VarPerfElementVO, node: VarDAGNode) {
        if (into.realised_nb_calls == null) {
            into.realised_nb_calls = 0;
        }
        if (into.realised_nb_card == null) {
            into.realised_nb_card = 0;
        }
        if (into.realised_sum_ms == null) {
            into.realised_sum_ms = 0;
        }

        into.realised_nb_calls++;
        into.realised_nb_card += MatroidController.getInstance().get_cardinal(node.var_data);
        into.realised_sum_ms += add_this.total_elapsed_time;
    }

    private async force_run_asap_throttled(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.error('failed force_run_asap_throttled' + error);
                resolve(true);
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                VarsdatasComputerBGThread.getInstance().name,
                VarsdatasComputerBGThread.TASK_NAME_force_run_asap, resolve)) {
                return;
            }

            ConsoleHandler.log("VarsdatasComputerBGThread.do_calculation_run:ASAP");
            this.run_asap = true;

            resolve(true);
        });
    }

    private async do_computation(var_dag: VarDAG): Promise<boolean> {

        /**
         * Avant de compute on lance le SlowVarKi
         */

        await SlowVarKiHandler.getInstance().computationBatchSupervisor(VarsdatasComputerBGThread.getInstance().current_batch_id);

        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.computation_wrapper, 'computation_wrapper');
        }

        await VarsComputeController.getInstance().compute(); // PERF OK
        let indexes: string[] = [];
        let human_readable_indexes: string[] = [];
        if (this.add_computation_time_to_learning_base) {
            for (let i in this.current_batch_vardag) {
                let node = this.current_batch_vardag.nodes[i];
                let var_data = node.var_data;
                indexes.push(var_data.index);
                human_readable_indexes.push(MatroidIndexHandler.get_human_readable_index(var_data));
            }
        }

        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.computation_wrapper, 'computation_wrapper');
        }

        await SlowVarKiHandler.getInstance().handle_slow_var_ki_end();

        let did_something = var_dag && (var_dag.nb_nodes > 0);
        VarsdatasComputerBGThread.getInstance().is_computing = false;
        VarsdatasComputerBGThread.getInstance().current_batch_params = {};
        VarsdatasComputerBGThread.getInstance().current_batch_vardag = null;
        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = null;

        if (this.add_computation_time_to_learning_base) {
            let stat = new VarComputeTimeLearnBaseVO();
            stat.indexes = indexes;
            stat.human_readable_indexes = human_readable_indexes;
            stat.computation_start_time = var_dag.perfs.computation_wrapper.start_time;
            stat.computation_duration = var_dag.perfs.computation_wrapper.total_elapsed_time;
            await ModuleDAO.getInstance().insertOrUpdateVO(stat);
        }

        return did_something;
    }

    private async handle_invalidators_perf_wrapper(var_dag: VarDAG) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.handle_invalidators, 'handle_invalidators');
        await VarsDatasVoUpdateHandler.getInstance().handle_invalidators();
        VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.handle_invalidators, 'handle_invalidators');
    }

    private async varsdatas_proxy_handle_buffer_perf_wrapper(var_dag: VarDAG) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.handle_buffer_varsdatasproxy, 'handle_buffer_varsdatasproxy');
        await VarsDatasProxy.getInstance().handle_buffer();
        VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.handle_buffer_varsdatasproxy, 'handle_buffer_varsdatasproxy');
    }

    private async varsdatas_voupdate_handle_buffer_perf_wrapper(var_dag: VarDAG): Promise<boolean> {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.handle_buffer_varsdatasvoupdate, 'handle_buffer_varsdatasvoupdate');
        let refuse_computation = await VarsDatasVoUpdateHandler.getInstance().handle_buffer(); // PERF OK
        VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.handle_buffer_varsdatasvoupdate, 'handle_buffer_varsdatasvoupdate');
        return refuse_computation;
    }

    private log_perfs(var_dag: VarDAG) {
        let batch_wrapper_total_elapsed_time = Math.round(var_dag.perfs.batch_wrapper.total_elapsed_time ? var_dag.perfs.batch_wrapper.total_elapsed_time : 0) / 1000;
        let batch_wrapper_initial_estimated_work_time = Math.round(var_dag.perfs.batch_wrapper.initial_estimated_work_time_global ? var_dag.perfs.batch_wrapper.initial_estimated_work_time_global : 0) / 1000;

        let handle_invalidators_total_elapsed_time = Math.round(var_dag.perfs.handle_invalidators.total_elapsed_time ? var_dag.perfs.handle_invalidators.total_elapsed_time : 0) / 1000;
        let handle_invalidators_initial_estimated_work_time = Math.round(var_dag.perfs.handle_invalidators.initial_estimated_work_time_global ? var_dag.perfs.handle_invalidators.initial_estimated_work_time_global : 0) / 1000;

        let handle_buffer_varsdatasproxy_total_elapsed_time = Math.round(var_dag.perfs.handle_buffer_varsdatasproxy.total_elapsed_time ? var_dag.perfs.handle_buffer_varsdatasproxy.total_elapsed_time : 0) / 1000;
        let handle_buffer_varsdatasproxy_initial_estimated_work_time = Math.round(var_dag.perfs.handle_buffer_varsdatasproxy.initial_estimated_work_time_global ? var_dag.perfs.handle_buffer_varsdatasproxy.initial_estimated_work_time_global : 0) / 1000;

        let handle_buffer_varsdatasvoupdate_total_elapsed_time = Math.round(var_dag.perfs.handle_buffer_varsdatasvoupdate.total_elapsed_time ? var_dag.perfs.handle_buffer_varsdatasvoupdate.total_elapsed_time : 0) / 1000;
        let handle_buffer_varsdatasvoupdate_initial_estimated_work_time = Math.round(var_dag.perfs.handle_buffer_varsdatasvoupdate.initial_estimated_work_time_global ? var_dag.perfs.handle_buffer_varsdatasvoupdate.initial_estimated_work_time_global : 0) / 1000;

        let computation_wrapper_total_elapsed_time = Math.round(var_dag.perfs.computation_wrapper.total_elapsed_time ? var_dag.perfs.computation_wrapper.total_elapsed_time : 0) / 1000;
        let computation_wrapper_initial_estimated_work_time = Math.round(var_dag.perfs.computation_wrapper.initial_estimated_work_time_global ? var_dag.perfs.computation_wrapper.initial_estimated_work_time_global : 0) / 1000;

        let create_tree_total_elapsed_time = Math.round(var_dag.perfs.create_tree.total_elapsed_time ? var_dag.perfs.create_tree.total_elapsed_time : 0) / 1000;
        let create_tree_initial_estimated_work_time = Math.round(var_dag.perfs.create_tree.initial_estimated_work_time_global ? var_dag.perfs.create_tree.initial_estimated_work_time_global : 0) / 1000;

        let load_nodes_datas_total_elapsed_time = Math.round(var_dag.perfs.load_nodes_datas.total_elapsed_time ? var_dag.perfs.load_nodes_datas.total_elapsed_time : 0) / 1000;
        let load_nodes_datas_initial_estimated_work_time = Math.round(var_dag.perfs.load_nodes_datas.initial_estimated_work_time_global ? var_dag.perfs.load_nodes_datas.initial_estimated_work_time_global : 0) / 1000;

        let compute_node_wrapper_total_elapsed_time = Math.round(var_dag.perfs.compute_node_wrapper.total_elapsed_time ? var_dag.perfs.compute_node_wrapper.total_elapsed_time : 0) / 1000;
        let compute_node_wrapper_initial_estimated_work_time = Math.round(var_dag.perfs.compute_node_wrapper.initial_estimated_work_time_global ? var_dag.perfs.compute_node_wrapper.initial_estimated_work_time_global : 0) / 1000;

        let cache_datas_total_elapsed_time = Math.round(var_dag.perfs.cache_datas.total_elapsed_time ? var_dag.perfs.cache_datas.total_elapsed_time : 0) / 1000;
        let cache_datas_initial_estimated_work_time = Math.round(var_dag.perfs.cache_datas.initial_estimated_work_time_global ? var_dag.perfs.cache_datas.initial_estimated_work_time_global : 0) / 1000;

        ConsoleHandler.log('VarsdatasComputerBGThread computed : [' + var_dag.perfs.nb_batch_vars + '] registered / [' + var_dag.nb_nodes + '] all vars - took :');
        ConsoleHandler.log('    [' + batch_wrapper_total_elapsed_time + ' sec] globally' + (batch_wrapper_initial_estimated_work_time ? ' / [' + batch_wrapper_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('      [' + handle_invalidators_total_elapsed_time + ' sec] invalidating by intersectors' + (handle_invalidators_initial_estimated_work_time ? ' / [' + handle_invalidators_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('      [' + handle_buffer_varsdatasproxy_total_elapsed_time + ' sec] saving cache to bdd' + (handle_buffer_varsdatasproxy_initial_estimated_work_time ? ' / [' + handle_buffer_varsdatasproxy_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('      [' + handle_buffer_varsdatasvoupdate_total_elapsed_time + ' sec] invalidating datas (generates intersectors)' + (handle_buffer_varsdatasvoupdate_initial_estimated_work_time ? ' / [' + handle_buffer_varsdatasvoupdate_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('      [' + computation_wrapper_total_elapsed_time + ' sec] building tree & computing' + (computation_wrapper_initial_estimated_work_time ? ' / [' + computation_wrapper_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('        [' + create_tree_total_elapsed_time + ' sec] building tree' + (create_tree_initial_estimated_work_time ? ' / [' + create_tree_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('        [' + load_nodes_datas_total_elapsed_time + ' sec] loading datas' + (load_nodes_datas_initial_estimated_work_time ? ' / [' + load_nodes_datas_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('        [' + compute_node_wrapper_total_elapsed_time + ' sec] computing' + (compute_node_wrapper_initial_estimated_work_time ? ' / [' + compute_node_wrapper_initial_estimated_work_time + ' sec] initially estimated' : ''));
        ConsoleHandler.log('      [' + cache_datas_total_elapsed_time + ' sec] caching datas' + (cache_datas_initial_estimated_work_time ? ' / [' + cache_datas_initial_estimated_work_time + ' sec] initially estimated' : ''));
    }
}
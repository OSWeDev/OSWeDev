import { performance } from 'perf_hooks';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import VarDAG from '../../../../shared/modules/Var/graph/VarDAG';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarBatchPerfVO from '../../../../shared/modules/Var/vos/VarBatchPerfVO';
import VarComputeTimeLearnBaseVO from '../../../../shared/modules/Var/vos/VarComputeTimeLearnBaseVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import MatroidIndexHandler from '../../../../shared/tools/MatroidIndexHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../../env/ConfigurationService';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import SlowVarKiHandler from '../SlowVarKi/SlowVarKiHandler';
import VarsCacheController from '../VarsCacheController';
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
     * Le VarDAG lié au batch actuel
     */
    public current_batch_vardag: VarDAG = null;

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

    public force_run_asap = ThrottleHelper.getInstance().declare_throttle_without_args(this.force_run_asap_throttled.bind(this), 100, { leading: true, trailing: true });
    public semaphore: boolean = false;

    private timeout_calculation: number = 30;
    private last_calculation_unix: number = 0;

    private partial_clean_next_ms: number = 0;

    private constructor() {
        // ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_switch_force_1_by_1_computation, this.switch_force_1_by_1_computation.bind(this));
        ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_switch_add_computation_time_to_learning_base, this.switch_add_computation_time_to_learning_base.bind(this));
        ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_force_run_asap, this.force_run_asap.bind(this));
    }

    public async switch_add_computation_time_to_learning_base(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.getInstance().error('failed switch_add_computation_time_to_learning_base' + error);
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

        /**
         * On change de méthode, on lance immédiatement si c'est utile/demandé, sinon on attend le timeout
         */
        if (this.semaphore) {
            this.last_calculation_unix = Dates.now();
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
        }
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
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

            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:Starting...");

            VarsdatasComputerBGThread.getInstance().current_batch_id++;
            VarsdatasComputerBGThread.getInstance().is_computing = true;
            VarsdatasComputerBGThread.getInstance().current_batch_params = {};
            VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = null;

            let var_dag: VarDAG = new VarDAG(VarsdatasComputerBGThread.getInstance().current_batch_id);
            VarsdatasComputerBGThread.getInstance().current_batch_vardag = var_dag;

            var_dag.perfs.start();

            /**
             * On invalide les vars si des intersecteurs sont en attente
             */
            await this.handle_invalidate_intersectors_perf_wrapper(var_dag);
            await this.handle_invalidate_matroids_perf_wrapper(var_dag);

            /**
             * On met à jour la bdd si nécessaire
             */
            await this.varsdatas_proxy_handle_buffer_perf_wrapper(var_dag);

            /**
             * On dépile les CUD sur les VOs et faire les invalidations
             */

            if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
                ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasVoUpdateHandler.handle_buffer:IN");
            }

            let refuse_computation = await this.varsdatas_voupdate_handle_buffer_perf_wrapper(var_dag);

            if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
                ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasVoUpdateHandler.handle_buffer:OUT");
            }

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

            let did_something: boolean = false;

            if (!refuse_computation) {
                did_something = await this.do_computation(var_dag);
            }

            if (refuse_computation || !did_something) {

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread.do_calculation_run:refuse_computation:' + refuse_computation + ':or !did_something:' + !did_something + ':');

                if (VarsDatasVoUpdateHandler.getInstance().last_call_handled_something) {
                    this.run_asap = true;
                } else {

                    // Si on fait rien c'est qu'on a le temps de nettoyer un peu la BDD
                    if (performance.now() > this.partial_clean_next_ms) {
                        // On limite à un appel toutes les secondes
                        this.partial_clean_next_ms = performance.now() + 1000;
                        await VarsCacheController.getInstance().partially_clean_bdd_cache(); // PERF OK
                    }
                }
            }

            var_dag.perfs.end();
            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:Ended");

        } catch (error) {
            console.error(error);
        }

        this.run_asap = true;
        this.semaphore = false;
    }

    private async force_run_asap_throttled(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.getInstance().error('failed force_run_asap_throttled' + error);
                resolve(true);
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                VarsdatasComputerBGThread.getInstance().name,
                VarsdatasComputerBGThread.TASK_NAME_force_run_asap, resolve)) {
                return;
            }

            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:ASAP");
            this.run_asap = true;

            resolve(true);
        });
    }

    private async do_computation(var_dag: VarDAG): Promise<boolean> {

        /**
         * Avant de compute on lance le SlowVarKi
         */

        await SlowVarKiHandler.getInstance().computationBatchSupervisor(VarsdatasComputerBGThread.getInstance().current_batch_id);

        var_dag.perfs.computation_wrapper.start('computation_wrapper');

        await VarsComputeController.getInstance().compute(); // PERF OK
        let indexes: string[] = [];
        let human_readable_indexes: string[] = [];
        if (this.add_computation_time_to_learning_base) {
            for (let i in this.current_batch_vardag) {
                let node = this.current_batch_vardag.nodes[i];
                let var_data = node.var_data;
                indexes.push(var_data.index);
                human_readable_indexes.push(MatroidIndexHandler.getInstance().get_human_readable_index(var_data));
            }
        }

        var_dag.perfs.computation_wrapper.end('computation_wrapper');

        await SlowVarKiHandler.getInstance().handle_slow_var_ki_end();

        ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + var_dag.perfs.nb_batch_vars + '/' + var_dag.nb_nodes + ': vars : took [' +
            (Math.round(var_dag.perfs.total_elapsed_time) / 1000) + ' sec] computing / [' + Math.round(var_dag.perfs.initial_estimated_time) / 1000 + ' sec] initially estimated');

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

    private async handle_invalidate_intersectors_perf_wrapper(var_dag: VarDAG) {
        var_dag.perfs.handle_invalidate_intersectors.start('handle_invalidate_intersectors');
        await VarsDatasVoUpdateHandler.getInstance().handle_invalidate_intersectors();
        var_dag.perfs.handle_invalidate_intersectors.end('handle_invalidate_intersectors');
    }

    private async handle_invalidate_matroids_perf_wrapper(var_dag: VarDAG) {
        var_dag.perfs.handle_invalidate_matroids.start('handle_invalidate_matroids');
        await VarsDatasVoUpdateHandler.getInstance().handle_invalidate_matroids();
        var_dag.perfs.handle_invalidate_matroids.end('handle_invalidate_matroids');
    }

    private async varsdatas_proxy_handle_buffer_perf_wrapper(var_dag: VarDAG) {
        var_dag.perfs.handle_buffer_varsdatasproxy.start('handle_buffer_varsdatasproxy');
        await VarsDatasProxy.getInstance().handle_buffer();
        var_dag.perfs.handle_buffer_varsdatasproxy.end('handle_buffer_varsdatasproxy');
    }

    private async varsdatas_voupdate_handle_buffer_perf_wrapper(var_dag: VarDAG): Promise<boolean> {
        var_dag.perfs.handle_buffer_varsdatasvoupdate.start('handle_buffer_varsdatasvoupdate');
        let refuse_computation = await VarsDatasVoUpdateHandler.getInstance().handle_buffer(); // PERF OK
        var_dag.perfs.handle_buffer_varsdatasvoupdate.end('handle_buffer_varsdatasvoupdate');
        return refuse_computation;
    }
}
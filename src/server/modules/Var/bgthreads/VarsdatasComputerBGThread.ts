import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VarDAG from '../../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarBatchNodePerfVO from '../../../../shared/modules/Var/vos/VarBatchNodePerfVO';
import VarBatchVarPerfVO from '../../../../shared/modules/Var/vos/VarBatchVarPerfVO';
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
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import SlowVarKiHandler from '../SlowVarKi/SlowVarKiHandler';
import VarsComputeController from '../VarsComputeController';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';
import VarsProcessCompute from './processes/VarsProcessCompute';
import VarsProcessDagCleaner from './processes/VarsProcessDagCleaner';
import VarsProcessDeployDeps from './processes/VarsProcessDeployDeps';
import VarsProcessLoadDatas from './processes/VarsProcessLoadDatas';
import VarsProcessNotify from './processes/VarsProcessNotify';
import VarsProcessNotifyEnd from './processes/VarsProcessNotifyEnd';
import VarsProcessNotifyStart from './processes/VarsProcessNotifyStart';
import VarsProcessUpdateDB from './processes/VarsProcessUpdateDB';

export default class VarsdatasComputerBGThread implements IBGThread {

    /**
     * Le VarDAG du bgthread
     */
    public static current_vardag: VarDAG = new VarDAG();

    /**
     * Quand on veut invalider, le process d'invalidation doit indiquer qu'il attend un espace pour invalider (waiting_for_invalidation = true),
     *  les autres process doivent indiquer qu'ils sont prêt pour l'invalidation dès que possible (processes_waiting_for_invalidation_end[process_name] = true) et
     *  attendre la fin de l'invalidation. Le process d'invalidation doit indiquer qu'il a fini l'invalidation (waiting_for_invalidation = false).
     *  Enfin les autres process doivent indiquer qu'ils ne sont plus en attente de l'invalidation (processes_waiting_for_invalidation_end[process_name] = false)
     *  et reprendre leur travail.
     */
    public static waiting_for_invalidation: boolean = false;
    public static processes_waiting_for_invalidation_end: { [process_name: string]: boolean } = {};

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

    public current_timeout: number = 1;
    public MAX_timeout: number = 1000000;
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

    public semaphore: boolean = false;

    private partial_clean_next_ms: number = 0;

    private constructor() {
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

            /**
             * On change de méthode, le bgthread ne fait rien d'autre que lancer les différents process de calculs/updates de l'arbre
             */
            if (this.semaphore) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            this.semaphore = true;

            // On lance les process
            VarsProcessNotifyStart.getInstance().work();
            VarsProcessDeployDeps.getInstance().work();
            VarsProcessLoadDatas.getInstance().work();
            VarsProcessCompute.getInstance().work();
            VarsProcessNotifyEnd.getInstance().work();
            VarsProcessUpdateDB.getInstance().work();
            VarsProcessDagCleaner.getInstance().work();
        } catch (error) {
            ConsoleHandler.error('VarsdatasComputerBGThread.work error : ' + error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private async do_calculation_run(): Promise<void> {
        if (this.semaphore) {
            return;
        }
        this.semaphore = true;
        this.run_asap = false;

        if ((!VarsController.var_conf_by_id) || (!ObjectHandler.hasAtLeastOneAttribute(VarsController.var_conf_by_id))) {
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
            VarsdatasComputerBGThread.getInstance().current_vardag = var_dag;
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

    private async do_computation(var_dag: VarDAG): Promise<boolean> {

        /**
         * Avant de compute on lance le SlowVarKi
         */

        await VarsComputeController.getInstance().compute(); // PERF OK

        let did_something = var_dag && (var_dag.nb_nodes > 0);
        VarsdatasComputerBGThread.getInstance().is_computing = false;
        VarsdatasComputerBGThread.getInstance().current_batch_params = {};
        VarsdatasComputerBGThread.getInstance().current_vardag = null;
        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = null;

        return did_something;
    }

    private async handle_invalidators_perf_wrapper(var_dag: VarDAG) {
        await VarsDatasVoUpdateHandler.getInstance().handle_invalidators();
    }

    private async varsdatas_proxy_handle_buffer_perf_wrapper(var_dag: VarDAG) {
        await VarsDatasProxy.getInstance().handle_buffer();
    }

    private async varsdatas_voupdate_handle_buffer_perf_wrapper(var_dag: VarDAG): Promise<boolean> {
        let refuse_computation = await VarsDatasVoUpdateHandler.getInstance().handle_buffer(); // PERF OK
        return refuse_computation;
    }

}
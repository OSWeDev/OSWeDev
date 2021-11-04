import { throttle } from 'lodash';
import moment = require('moment');
import { performance } from 'perf_hooks';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import PerfMonConfController from '../../PerfMon/PerfMonConfController';
import PerfMonServerController from '../../PerfMon/PerfMonServerController';
import VarsPerfsController from '../perf/VarsPerfsController';
import SlowVarKiHandler from '../SlowVarKi/SlowVarKiHandler';
import VarsCacheController from '../VarsCacheController';
import VarsComputeController from '../VarsComputeController';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';
import VarsPerfMonServerController from '../VarsPerfMonServerController';
import VarsTabsSubsController from '../VarsTabsSubsController';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static TASK_NAME_force_run_asap: string = 'VarsdatasComputerBGThread.force_run_asap';

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

    public current_timeout: number = 10;
    public MAX_timeout: number = 10;
    public MIN_timeout: number = 1;

    public exec_in_dedicated_thread: boolean = true;

    public is_computing: boolean = false;
    public current_batch_id: number = 0;
    public current_batch_params: { [index: string]: VarDataBaseVO } = null;

    /**
     * Marker à activer pour forcer l'exécution au plus vite du prochain calcul
     */
    public run_asap: boolean = true;
    /**
     * Par défaut, sans intervention extérieur, on a pas besoin de faire des calculs tellement souvent
     */
    private timeout_calculation: number = 30;
    private last_calculation_unix: number = 0;

    private semaphore: boolean = false;

    private partial_clean_next_ms: number = 0;

    private constructor() {
        ForkedTasksController.getInstance().register_task(VarsdatasComputerBGThread.TASK_NAME_force_run_asap, this.force_run_asap.bind(this));
    }

    get name(): string {
        return "VarsdatasComputerBGThread";
    }

    public async force_run_asap(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            if (!ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                VarsdatasComputerBGThread.getInstance().name,
                VarsdatasComputerBGThread.TASK_NAME_force_run_asap, resolve)) {
                return;
            }

            this.run_asap = true;

            resolve(true);
        });
    }

    /**
     * ATTENTION à n'appeler cette fonction que dans le thread dédié à ce bgthread
     * On veut un système d'appel un peu particulier qui permette de dire si le front demande une valeur de var, on veut dépiler la demande
     *  asap, et sans qu'on puisse avec des lancements en parralèle donc quelque chose qui puisse couper le délai entre 2 appels au bgthread
     *  mais qui en revanche s'assure d'utiliser un sémaphore pour ne jamais lancer 2 fois le calcul
     */
    public async work(): Promise<number> {

        /**
         * On change de méthode, on lance immédiatement si c'est utile/demandé, sinon on attent le timeout
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

        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:IN");
        }

        try {

            await PerfMonServerController.getInstance().monitor_async_root(
                PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsdatasComputerBGThread__do_calculation_run],
                async () => {
                    try {

                        let promises = [];
                        let client_request_estimated_ms_limit: number = 0;
                        let bg_estimated_ms_limit: number = 0;
                        let bg_min_nb_vars: number = 0;
                        let client_request_min_nb_vars: number = 0;

                        promises.push((async () => client_request_estimated_ms_limit = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_client_request_estimated_ms_limit, 500))());
                        promises.push((async () => bg_estimated_ms_limit = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_bg_estimated_ms_limit, 5000))());
                        promises.push((async () => bg_min_nb_vars = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_bg_min_nb_vars, 75))());
                        promises.push((async () => client_request_min_nb_vars = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_client_request_min_nb_vars, 15))());

                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread", true);

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasProxy.handle_buffer:IN");
                        }

                        /**
                         * On commence par mettre à jour la bdd si nécessaire
                         */
                        promises.push(VarsDatasProxy.getInstance().handle_buffer());

                        await Promise.all(promises);

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasProxy.handle_buffer:OUT");
                        }

                        /**
                         * On dépile les CUD sur les VOs et faire les invalidations
                         */

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasVoUpdateHandler.handle_buffer:IN");
                        }

                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer", true);
                        let refuse_computation = await VarsDatasVoUpdateHandler.getInstance().handle_buffer(); // PERF OK
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer", false);

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasVoUpdateHandler.handle_buffer:OUT");
                        }

                        /**
                         * TODO FIXME REFONTE VARS à voir si on supprime ou pas le timeout suivant la stratégie de dépilage des vars à calculer au final
                         *  soit on fait un batch par appel au bgthread soit on dépile x vars, soit on se donne x ms et on essaie d'estimer le temps de calcul en fonction des vars en attente, ...
                         *  Dans tous les cas la plus grosse optimisation est certainement sur le choix des vars à grouper pour un calcul le plus efficace possible et dans la limite
                         *      de temps par batch qu'on veut se donner (si le plus efficace c'est de calculer toute la base d'un coup mais que ça prend 1H on fera pas ça dans tous les cas)
                         */

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasProxy.get_vars_to_compute_from_buffer_or_bdd:IN");
                        }

                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.selection", true);
                        let vars_datas: { [index: string]: VarDataBaseVO } = refuse_computation ? null : await VarsDatasProxy.getInstance().get_vars_to_compute_from_buffer_or_bdd(
                            client_request_estimated_ms_limit, client_request_min_nb_vars, bg_estimated_ms_limit, bg_min_nb_vars); // PERF OK
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.selection", false);

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsDatasProxy.get_vars_to_compute_from_buffer_or_bdd:OUT");
                        }

                        if ((!vars_datas) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(vars_datas))) {

                            // /**
                            //  * On dépile les CUD sur les VOs et faire les invalidations
                            //  */
                            // VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer", true);
                            // let has_done_something = await VarsDatasVoUpdateHandler.getInstance().handle_buffer();
                            // VarsPerfsController.addPerfs(performance.now(), ["__computing_bg_thread", "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer"], false);
                            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread", false);

                            if (VarsDatasVoUpdateHandler.getInstance().last_call_handled_something &&
                                ConfigurationService.getInstance().getNodeConfiguration().VARS_PERF_MONITORING) {

                                await VarsPerfsController.update_perfs_in_bdd(); // PERF OK
                            }

                            if (VarsDatasVoUpdateHandler.getInstance().last_call_handled_something) {
                                this.run_asap = true;
                                return;
                            } else {

                                // Si on fait rien c'est qu'on a le temps de nettoyer un peu la BDD
                                if (performance.now() > this.partial_clean_next_ms) {
                                    // On limite à un appel toutes les secondes
                                    this.partial_clean_next_ms = performance.now() + 1000;
                                    await VarsCacheController.getInstance().partially_clean_bdd_cache(); // PERF OK
                                }
                                return;
                            }
                        }

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsTabsSubsController.notify_vardatas:IN");
                        }

                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.notify_vardatas_computing", true);
                        await VarsTabsSubsController.getInstance().notify_vardatas(vars_datas, true); // PERF OK
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.notify_vardatas_computing", false);

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsTabsSubsController.notify_vardatas:OUT");
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

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsComputeController.compute:IN");
                        }

                        let perf_start = performance.now();

                        /**
                         * Avant de compute on lance le SlowVarKi
                         */
                        VarsdatasComputerBGThread.getInstance().current_batch_id++;
                        VarsdatasComputerBGThread.getInstance().is_computing = true;
                        VarsdatasComputerBGThread.getInstance().current_batch_params = vars_datas;
                        await SlowVarKiHandler.getInstance().computationBatchSupervisor(VarsdatasComputerBGThread.getInstance().current_batch_id);

                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute", true);
                        await VarsComputeController.getInstance().compute(vars_datas); // PERF OK
                        VarsPerfsController.addPerfs(performance.now(), ["__computing_bg_thread", "__computing_bg_thread.compute"], false);

                        await SlowVarKiHandler.getInstance().handle_slow_var_ki_end();

                        VarsdatasComputerBGThread.getInstance().is_computing = false;

                        let perf_end = performance.now();

                        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:VarsComputeController.compute:OUT");
                        }

                        if (ConfigurationService.getInstance().getNodeConfiguration().VARS_PERF_MONITORING) {
                            // if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                            //     ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + Object.keys(vars_datas).length + ': vars : took [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread"].sum_ms + ' ms] total : [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.VarsDatasVoUpdateHandler.buffer"].sum_ms + ' ms] handling update buffer, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.selection"].sum_ms + ' ms] selecting, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute"].sum_ms + ' ms] computing, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute.create_tree"].sum_ms + ' ms] computing.create_tree, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute.load_nodes_datas"].sum_ms + ' ms] computing.load_nodes_datas, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute.visit_bottom_up_to_node"].sum_ms + ' ms] computing.visit_bottom_up_to_node, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute.cache_datas"].sum_ms + ' ms] computing.cache_datas, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute.update_cards_in_perfs"].sum_ms + ' ms] computing.update_cards_in_perfs, [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread.notify_vardatas_computing"].sum_ms + ' ms] notifying');
                            // } else {
                            //     ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + Object.keys(vars_datas).length + ': vars : took [' +
                            //         VarsPerfsController.current_batch_perfs["__computing_bg_thread"].sum_ms + ' ms] total');
                            // }
                            ConsoleHandler.getInstance().log('VarsdatasComputerBGThread perfs update asked');
                            await VarsPerfsController.update_perfs_in_bdd(); // PERF OK
                            ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + Object.keys(vars_datas).length + ': vars : took [' +
                                (perf_end - perf_start) + ' ms] computing');
                        }

                    } catch (error) {
                        console.error(error);
                    }

                    this.run_asap = true;
                },
                this
            );

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        } finally {
            this.semaphore = false;
        }

        if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread.do_calculation_run:OUT");
        }
    }
}
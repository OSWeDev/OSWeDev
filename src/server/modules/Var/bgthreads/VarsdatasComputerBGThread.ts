import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VarDAG from '../../../modules/Var/vos/VarDAG';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ParamsServerController from '../../Params/ParamsServerController';
import CurrentBatchDSCacheHolder from '../CurrentBatchDSCacheHolder';
import CurrentVarDAGHolder from '../CurrentVarDAGHolder';
import ModuleVarServer from '../ModuleVarServer';
import VarsBGThreadNameHolder from '../VarsBGThreadNameHolder';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';
import VarsClientsSubsCacheManager from './processes/VarsClientsSubsCacheManager';
import VarsComputationHole from './processes/VarsComputationHole';
import VarsProcessCompute from './processes/VarsProcessCompute';
import VarsProcessDagCleaner from './processes/VarsProcessDagCleaner';
import VarsProcessDeployDeps from './processes/VarsProcessDeployDeps';
import VarsProcessInvalidator from './processes/VarsProcessInvalidator';
import VarsProcessLoadDatas from './processes/VarsProcessLoadDatas';
import VarsProcessNotifyEnd from './processes/VarsProcessNotifyEnd';
import VarsProcessNotifyStart from './processes/VarsProcessNotifyStart';
import VarsProcessUpdateDB from './processes/VarsProcessUpdateDB';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static PARAM_NAME_client_request_estimated_ms_limit: string = 'VarsdatasComputerBGThread.client_request_estimated_ms_limit';
    public static PARAM_NAME_bg_estimated_ms_limit: string = 'VarsdatasComputerBGThread.bg_estimated_ms_limit';
    public static PARAM_NAME_bg_min_nb_vars: string = 'VarsdatasComputerBGThread.bg_min_nb_vars';
    public static PARAM_NAME_client_request_min_nb_vars: string = 'VarsdatasComputerBGThread.client_request_min_nb_vars';
    public static PARAM_NAME_WARN_MAX_EXECUTION_TIME_SECOND: string = 'VarsdatasComputerBGThread.WARN_MAX_EXECUTION_TIME_SECOND';
    public static PARAM_NAME_ALERT_MAX_EXECUTION_TIME_SECOND: string = 'VarsdatasComputerBGThread.ALERT_MAX_EXECUTION_TIME_SECOND';

    /**
     * le JSON ne devrait être utilisé que au lancement de l'appli, mais systématiquement par contre au lancement, le reste du temps c'est l'appli qui fait référence pour les voscud
     */
    private static has_retrieved_vos_cud: boolean = false;

    private static instance: VarsdatasComputerBGThread = null;

    public current_timeout: number = 1;
    public MAX_timeout: number = 1000000;
    public MIN_timeout: number = 1;

    public exec_in_dedicated_thread: boolean = true;

    public internal_semaphore: boolean = false;

    private constructor() {
    }

    get name(): string {
        return VarsBGThreadNameHolder.bgthread_name;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsdatasComputerBGThread.instance) {
            VarsdatasComputerBGThread.instance = new VarsdatasComputerBGThread();
        }
        return VarsdatasComputerBGThread.instance;
    }



    /**
     * ATTENTION à n'appeler cette fonction que dans le thread dédié à ce bgthread
     * On veut un système d'appel un peu particulier qui permette de dire si le front demande une valeur de var, on veut dépiler la demande
     *  asap, et sans qu'on puisse avec des lancements en parralèle donc quelque chose qui puisse couper le délai entre 2 appels au bgthread
     *  mais qui en revanche s'assure d'utiliser un sémaphore pour ne jamais lancer 2 fois le calcul
     */
    public async work(): Promise<number> {

        try {

            if (!VarsdatasComputerBGThread.has_retrieved_vos_cud) {

                // Si le flag est actif, on invalide tout
                const current_tag_value = await ParamsServerController.getParamValueAsBoolean(VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_has_ordered_vos_cud_PARAM_NAME);
                if (current_tag_value) {
                    ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_buffer:VarsDatasVoUpdateHandler_has_ordered_vos_cud:FORCE_EMPTY_VARS_DATAS_VO_UPDATE_CACHE');
                    await ModuleVarServer.getInstance().force_delete_all_cache_except_imported_data_local_thread_already_in_computation_hole();
                }
                await ParamsServerController.setParamValueAsBoolean(VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_has_ordered_vos_cud_PARAM_NAME, false);

                //     VarsDatasVoUpdateHandler.set_ordered_vos_cud_from_JSON(await ParamsServerController.getParamValueAsString(
                //         VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

                VarsdatasComputerBGThread.has_retrieved_vos_cud = true;
            }


            /**
             * On change de méthode, le bgthread ne fait rien d'autre que lancer les différents process de calculs/updates de l'arbre
             * le bgthread est utilisé juste pour créer un nouveau thread et ne pas bloquer le thread principal
             */
            if (this.internal_semaphore) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            this.internal_semaphore = true;

            CurrentBatchDSCacheHolder.current_batch_ds_cache = {};
            CurrentBatchDSCacheHolder.semaphore_batch_ds_cache = {};
            CurrentBatchDSCacheHolder.semaphore_event_listener_promise = {};
            CurrentVarDAGHolder.current_vardag = new VarDAG();

            // On initialise ce qui a besoin de l'être
            VarsComputationHole.init();
            VarsDatasVoUpdateHandler.init();
            VarsDatasProxy.init();
            VarsClientsSubsCacheManager.init();
            CurrentVarDAGHolder.init_stats_process();

            // On lance les process
            VarsProcessNotifyStart.getInstance().work();
            VarsProcessDeployDeps.getInstance().work();
            VarsProcessLoadDatas.getInstance().work();
            VarsProcessCompute.getInstance().work();
            VarsProcessNotifyEnd.getInstance().work();
            VarsProcessUpdateDB.getInstance().work();
            VarsProcessDagCleaner.getInstance().work();

            // L'invalidation
            // VarsProcessInvalidator.getInstance().work();
            VarsProcessInvalidator.getInstance();

        } catch (error) {
            ConsoleHandler.error('VarsdatasComputerBGThread.work error : ' + error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }
}
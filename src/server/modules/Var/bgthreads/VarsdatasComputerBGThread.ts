import { throttle } from 'lodash';
import { performance } from 'perf_hooks';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import VarsPerfsController from '../perf/VarsPerfsController';
import VarsComputeController from '../VarsComputeController';
import VarsDatasProxy from '../VarsDatasProxy';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';
import VarsTabsSubsController from '../VarsTabsSubsController';

export default class VarsdatasComputerBGThread implements IBGThread {

    public static getInstance() {
        if (!VarsdatasComputerBGThread.instance) {
            VarsdatasComputerBGThread.instance = new VarsdatasComputerBGThread();
        }
        return VarsdatasComputerBGThread.instance;
    }

    private static PARAM_NAME_client_request_estimated_ms_limit: string = 'VarsdatasComputerBGThread.client_request_estimated_ms_limit';
    private static PARAM_NAME_bg_estimated_ms_limit: string = 'VarsdatasComputerBGThread.bg_estimated_ms_limit';
    private static PARAM_NAME_bg_min_nb_vars: string = 'VarsdatasComputerBGThread.bg_min_nb_vars';
    private static PARAM_NAME_client_request_min_nb_vars: string = 'VarsdatasComputerBGThread.client_request_min_nb_vars';
    private static instance: VarsdatasComputerBGThread = null;

    // public current_timeout: number = 100;
    // public MAX_timeout: number = 500;
    // public MIN_timeout: number = 1;
    public current_timeout: number = 1000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 1;

    // private enabled: boolean = true;
    // private invalidations: number = 0;
    private semaphore: boolean = false;

    private throttled_calculation_run = throttle(this.do_calculation_run, 100, { leading: false });

    private constructor() { }

    // public disable() {
    //     this.invalidations++;
    //     this.enabled = false;
    // }

    // public enable() {
    //     this.invalidations--;
    //     this.enabled = (this.invalidations == 0);
    // }

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

        this.throttled_calculation_run();
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        // if (!this.enabled) {
        //     return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        // }

        // if (!this.semaphore) {
        //     this.semaphore = true;
        //     let res = await this.do_calculation_run();
        //     this.semaphore = false;
        //     return res;
        // }
        // return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
    }

    private async do_calculation_run(): Promise<number> {
        try {

            if (this.semaphore) {
                return null;
            }
            this.semaphore = true;

            let client_request_estimated_ms_limit: number = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_client_request_estimated_ms_limit, 500);
            let bg_estimated_ms_limit: number = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_bg_estimated_ms_limit, 5000);
            let bg_min_nb_vars: number = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_bg_min_nb_vars, 75);
            let client_request_min_nb_vars: number = await ModuleParams.getInstance().getParamValueAsInt(VarsdatasComputerBGThread.PARAM_NAME_client_request_min_nb_vars, 15);

            /**
             * TODO FIXME REFONTE VARS à voir si on supprime ou pas le timeout suivant la stratégie de dépilage des vars à calculer au final
             *  soit on fait un batch par appel au bgthread soit on dépile x vars, soit on se donne x ms et on essaie d'estimer le temps de calcul en fonction des vars en attente, ...
             *  Dans tous les cas la plus grosse optimisation est certainement sur le choix des vars à grouper pour un calcul le plus efficace possible et dans la limite
             *      de temps par batch qu'on veut se donner (si le plus efficace c'est de calculer toute la base d'un coup mais que ça prend 1H on fera pas ça dans tous les cas)
             */

            /**
             * On commence par mettre à jour la bdd si nécessaire
             */
            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasProxy.buffer", true);
            await VarsDatasProxy.getInstance().handle_buffer();
            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasProxy.buffer", false);

            VarsPerfsController.addPerfs(performance.now(), ["__computing_bg_thread", "__computing_bg_thread.selection"], true);
            let vars_datas: { [index: string]: VarDataBaseVO } = await VarsDatasProxy.getInstance().get_vars_to_compute_from_buffer_or_bdd(
                client_request_estimated_ms_limit, client_request_min_nb_vars, bg_estimated_ms_limit, bg_min_nb_vars);
            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.selection", false);

            if ((!vars_datas) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(vars_datas))) {

                /**
                 * On dépile les CUD sur les VOs et faire les invalidations
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer", true);
                let has_done_something = await VarsDatasVoUpdateHandler.getInstance().handle_buffer();
                VarsPerfsController.addPerfs(performance.now(), ["__computing_bg_thread", "__computing_bg_thread.VarsDatasVoUpdateHandler.buffer"], false);

                if (has_done_something && ConfigurationService.getInstance().getNodeConfiguration().VARS_PERF_MONITORING) {
                    await VarsPerfsController.update_perfs_in_bdd();
                }

                this.semaphore = false;

                if (has_done_something) {
                    return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
                } else {
                    return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
                }
            }

            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.notify_vardatas_computing", true);
            VarsTabsSubsController.getInstance().notify_vardatas(vars_datas, true);
            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.notify_vardatas_computing", false);

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

            ConsoleHandler.getInstance().log('VarsdatasComputerBGThread starts computation...');
            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute", true);
            await VarsComputeController.getInstance().compute(vars_datas);
            VarsPerfsController.addPerfs(performance.now(), ["__computing_bg_thread", "__computing_bg_thread.compute"], false);

            if (ConfigurationService.getInstance().getNodeConfiguration().VARS_PERF_MONITORING) {
                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread computed :' + Object.keys(vars_datas).length + ': vars : took [' +
                    VarsPerfsController.current_batch_perfs["__computing_bg_thread"].sum_ms + ' ms] total : [' +
                    VarsPerfsController.current_batch_perfs["__computing_bg_thread.selection"].sum_ms + ' ms] selecting, [' +
                    VarsPerfsController.current_batch_perfs["__computing_bg_thread.compute"].sum_ms + ' ms] computing, [' +
                    VarsPerfsController.current_batch_perfs["__computing_bg_thread.notify_vardatas_computing"].sum_ms + ' ms] notifying');
                await VarsPerfsController.update_perfs_in_bdd();
            }
        } catch (error) {
            console.error(error);
        }

        this.semaphore = false;
        return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
    }
}
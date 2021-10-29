import { performance } from 'perf_hooks';
import * as  moment from 'moment';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ThreadHandler from '../../../../shared/tools/ThreadHandler';
import VarsdatasComputerBGThread from '../bgthreads/VarsdatasComputerBGThread';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import SlowVarVO from '../../../../shared/modules/Var/vos/SlowVarVO';
import VarsComputeController from '../VarsComputeController';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VarsDatasVoUpdateHandler from '../VarsDatasVoUpdateHandler';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ModuleForkServer from '../../Fork/ModuleForkServer';
import ReloadAsapForkMessage from '../../Fork/messages/ReloadAsapForkMessage';
import ForkMessageController from '../../Fork/ForkMessageController';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VarsTabsSubsController from '../VarsTabsSubsController';
import VarsServerCallBackSubsController from '../VarsServerCallBackSubsController';

/**
 * Objectif :
 *  Définir les règles de gestion, le flux - ki, des calculs de vars lente et trop lente
 *  trop lente : qui dépasse un timeout fixé en paramètre
 *  But de la technique employée : couper un calcul qui bloque les vars, et identifier automatiquement les vars qui posent problème + informer
 */
export default class SlowVarKiHandler {

    public static instance: SlowVarKiHandler = null;

    public static PARAM_timeout_ms: string = 'SlowVarKiHandler.timeout_ms';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): SlowVarKiHandler {
        if (!SlowVarKiHandler.instance) {
            SlowVarKiHandler.instance = new SlowVarKiHandler();
        }
        return SlowVarKiHandler.instance;
    }

    protected constructor() {
    }

    /**
     * Méthode appelée au lancement d'un batch de calcul pour pouvoir le couper si il dépasse le timeout
     * @param batch_id
     */
    public async computationBatchSupervisor(batch_id: number) {

        let timeout_ms = await ModuleParams.getInstance().getParamValueAsInt(SlowVarKiHandler.PARAM_timeout_ms, 60000);

        setTimeout(async () => {
            if (VarsdatasComputerBGThread.getInstance().is_computing && (VarsdatasComputerBGThread.getInstance().current_batch_id == batch_id)) {
                // Le timeout est trigger
                await SlowVarKiHandler.getInstance().handleSlowVarBatch();
            }
        }, timeout_ms);

        // Tout est ok les calculs sont déjà terminés
    }

    /**
     * Une fois qu'on a identifier un slow var batch, on veut le stopper, et stocker les infos nécessaires en base avant de reboot le thread.
     */
    private async handleSlowVarBatch() {

        ConsoleHandler.getInstance().error('handleSlowVarBatch:insertSlowVarBatchInBDD...');
        await SlowVarKiHandler.getInstance().insertSlowVarBatchInBDD();

        ConsoleHandler.getInstance().error('handleSlowVarBatch:persistVOsCUD...');
        await SlowVarKiHandler.getInstance().persistVOsCUD();

        ConsoleHandler.getInstance().error('handleSlowVarBatch:ReloadAsapForkMessage...');
        await ForkMessageController.getInstance().send(new ReloadAsapForkMessage());

        ConsoleHandler.getInstance().error('handleSlowVarBatch:kill_process...');
        await ModuleForkServer.getInstance().kill_process(0);
    }

    /**
     * On check que les voscud sont bien la version en BDD pour le reboot
     */
    private async persistVOsCUD() {
        await VarsDatasVoUpdateHandler.getInstance().update_param();
    }

    /**
     * Récupérer la liste des vars qui devaient être calculées et les stocker en base comme slow var à tester,
     *  ou si une seule comme slow var denied
     */
    private async insertSlowVarBatchInBDD() {

        let computed_vars: { [index: string]: VarDataBaseVO } = VarsdatasComputerBGThread.getInstance().current_batch_params;

        if (!computed_vars) {
            return;
        }

        let is_single: boolean = Object.keys(computed_vars).length == 1;
        let computation_ts: number = Dates.now();
        for (let i in computed_vars) {

            let computed_var = computed_vars[i];

            let slowVar = await new SlowVarVO();
            slowVar.name = computed_var.index;
            slowVar.computation_ts = computation_ts;
            slowVar.var_id = computed_var.var_id;
            slowVar.type = is_single ? SlowVarVO.TYPE_DENIED : SlowVarVO.TYPE_NEEDS_TEST;
            slowVar.estimated_calculation_time = VarsComputeController.getInstance().get_estimated_time(computed_var);
            await ModuleDAO.getInstance().insertOrUpdateVO(slowVar);

            // Si la var est seule, on la stocke en base comme denied définitivement et on notifie les intéressés
            if (is_single) {
                computed_var.value = 0;
                computed_var.value_ts = computation_ts;
                computed_var.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                let res = await ModuleDAO.getInstance().insertOrUpdateVO(computed_var);
                computed_var.id = res.id;
                await VarsTabsSubsController.getInstance().notify_vardatas([computed_var]);
                await VarsServerCallBackSubsController.getInstance().notify_vardatas([computed_var]);
            }
        }
    }
}
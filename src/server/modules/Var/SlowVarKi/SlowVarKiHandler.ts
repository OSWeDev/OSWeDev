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
import ModuleContextFilter from '../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';

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

    private actual_slow_var_test: SlowVarVO;

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

    public async handle_slow_var_ki_start(): Promise<VarDataBaseVO> {

        /**
         * 1 on check les testing qui pourrait être restés bloqués en base
         * 2 on trouve le premier totest en attente
         */
        this.actual_slow_var_test = null;

        await this.handle_stuck_slow_vars();
        return await this.get_var_data_to_test();
    }

    public async handle_slow_var_ki_end(): Promise<void> {
        if (this.actual_slow_var_test) {
            await ModuleDAO.getInstance().deleteVOs([this.actual_slow_var_test]);
        }
    }

    private async handle_stuck_slow_vars(): Promise<void> {

        let filter = new ContextFilterVO();
        filter.field_id = 'type';
        filter.vo_type = SlowVarVO.API_TYPE_ID;
        filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
        filter.param_numeric = SlowVarVO.TYPE_TESTING;

        let items: SlowVarVO[] = await ModuleContextFilter.getInstance().query_vos_from_active_filters<SlowVarVO>(
            SlowVarVO.API_TYPE_ID,
            { [SlowVarVO.API_TYPE_ID]: { ['type']: filter } },
            [SlowVarVO.API_TYPE_ID],
            0,
            0,
            null
        );

        if (items && items.length) {

            for (let i in items) {
                let slow_var: SlowVarVO = items[i];

                ConsoleHandler.getInstance().warn('HANDLING STUCK SLOW VAR:' + JSON.stringify(slow_var));
                await this.deny_slow_var(slow_var, VarDataBaseVO.from_index(slow_var.name), Dates.now());
            }
        }
    }

    private async get_var_data_to_test(): Promise<VarDataBaseVO> {

        /**
         * 1 on check les testing qui pourrait être restés bloqués en base
         * 2 on trouve le premier totest en attente
         */


        let filter = new ContextFilterVO();
        filter.field_id = 'type';
        filter.vo_type = SlowVarVO.API_TYPE_ID;
        filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
        filter.param_numeric = SlowVarVO.TYPE_NEEDS_TEST;

        let sort_by = new SortByVO();
        sort_by.field_id = 'computation_ts';
        sort_by.sort_asc = false;
        sort_by.vo_type = SlowVarVO.API_TYPE_ID;

        let items: SlowVarVO[] = await ModuleContextFilter.getInstance().query_vos_from_active_filters<SlowVarVO>(
            SlowVarVO.API_TYPE_ID,
            { [SlowVarVO.API_TYPE_ID]: { ['type']: filter } },
            [SlowVarVO.API_TYPE_ID],
            1,
            0,
            sort_by
        );

        if (items && items.length) {
            let slow_var: SlowVarVO = items[0];
            ConsoleHandler.getInstance().warn('SLOW PARAM TEST:' + JSON.stringify(slow_var));

            slow_var.type = SlowVarVO.TYPE_TESTING;
            await ModuleDAO.getInstance().insertOrUpdateVO(slow_var);

            this.actual_slow_var_test = slow_var;
            return VarDataBaseVO.from_index(slow_var.name);
        }
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
            slowVar.estimated_calculation_time = VarsComputeController.getInstance().get_estimated_time(computed_var);

            // Si la var est seule, on la stocke en base comme denied définitivement et on notifie les intéressés
            if (is_single) {
                await this.deny_slow_var(slowVar, computed_var, computation_ts);
            } else {
                slowVar.type = SlowVarVO.TYPE_NEEDS_TEST;
                await ModuleDAO.getInstance().insertOrUpdateVO(slowVar);
            }
        }
    }

    private async deny_slow_var(slowVar: SlowVarVO, computed_var: VarDataBaseVO, computation_ts: number) {
        slowVar.type = SlowVarVO.TYPE_DENIED;
        await ModuleDAO.getInstance().insertOrUpdateVO(slowVar);

        // Si la var est seule, on la stocke en base comme denied définitivement et on notifie les intéressés
        computed_var.value = 0;
        computed_var.value_ts = computation_ts;
        computed_var.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
        let res = await ModuleDAO.getInstance().insertOrUpdateVO(computed_var);
        computed_var.id = res.id;
        await VarsTabsSubsController.getInstance().notify_vardatas([computed_var]);
        await VarsServerCallBackSubsController.getInstance().notify_vardatas([computed_var]);
    }
}
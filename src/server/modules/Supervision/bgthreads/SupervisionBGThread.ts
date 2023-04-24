import { throttle } from 'lodash';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import StatsServerController from '../../Stats/StatsServerController';
import ISupervisedItemServerController from '../interfaces/ISupervisedItemServerController';
import SupervisionServerController from '../SupervisionServerController';

export default class SupervisionBGThread implements IBGThread {

    public static MAX_timeout_PARAM_NAME: string = 'SupervisionBGThread.MAX_timeout';
    public static MIN_timeout_PARAM_NAME: string = 'SupervisionBGThread.MIN_timeout';

    public static getInstance() {
        if (!SupervisionBGThread.instance) {
            SupervisionBGThread.instance = new SupervisionBGThread();
        }
        return SupervisionBGThread.instance;
    }

    private static instance: SupervisionBGThread = null;

    public current_timeout: number = 1000;
    public MAX_timeout: number = 5000;
    public MIN_timeout: number = 100;

    private loaded_param: boolean = false;

    private throttle_by_api_type_id: { [api_type_id: string]: () => Promise<boolean> } = {};

    private constructor() { }

    get name(): string {
        return "SupervisionBGThread";
    }

    /**
     * Lance les worker_inavalid de chaque api/sonde enregistré dans {@link SupervisionController.registered_controllers}.
     * @returns {number} : {@link ModuleBGThreadServer.TIMEOUT_COEF_SLOWER}
     * @throws error
     */
    public async work(): Promise<number> {

        let time_in = Dates.now_ms();

        try {

            StatsServerController.register_stat('SupervisionBGThread.work.IN', 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

            if (!this.loaded_param) {
                this.loaded_param = true;

                this.MAX_timeout = await ModuleParams.getInstance().getParamValueAsInt(SupervisionBGThread.MAX_timeout_PARAM_NAME, 5000, 180000);
                this.MIN_timeout = await ModuleParams.getInstance().getParamValueAsInt(SupervisionBGThread.MIN_timeout_PARAM_NAME, 100, 180000);
            }

            let registered_api_types = SupervisionController.getInstance().registered_controllers;

            let promises = [];

            for (let api_type_id in registered_api_types) {
                let shared_controller: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];
                let server_controller: ISupervisedItemServerController<any> = SupervisionServerController.getInstance().registered_controllers[api_type_id];

                // Si pas actif ou pas de time ms saisie, on passe au suivant
                if (!shared_controller.is_actif() || !server_controller.get_execute_time_ms()) {
                    continue;
                }

                promises.push((async () => {
                    let items: ISupervisedItem[] = await query(api_type_id)
                        .filter_is_true('invalid').select_vos<ISupervisedItem>();

                    if (server_controller.already_work) {
                        return;
                    }

                    // Si j'ai des items invalid, je vais throttle le controller
                    if (items && items.length) {

                        StatsServerController.register_stat('SupervisionBGThread.work.invalid_items.nb', items.length, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

                        if (!this.throttle_by_api_type_id[api_type_id]) {
                            this.throttle_by_api_type_id[api_type_id] = throttle(
                                server_controller.work_invalid.bind(server_controller),
                                server_controller.get_execute_time_ms(),
                                { leading: false });
                        }

                        await this.throttle_by_api_type_id[api_type_id]();
                    }
                })());
            }

            await all_promises(promises);
            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsServerController.register_stat('SupervisionBGThread.work.' + activity + '.OUT.nb', 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('SupervisionBGThread.work.' + activity + '.OUT.time', time_out - time_in,
            [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
    }
}
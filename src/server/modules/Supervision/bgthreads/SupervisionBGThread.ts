import { throttle } from 'lodash';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import SupervisionServerController from '../SupervisionServerController';
import ISupervisedItemServerController from '../interfaces/ISupervisedItemServerController';
import ParamsServerController from '../../Params/ParamsServerController';

export default class SupervisionBGThread implements IBGThread {


    public static MAX_timeout_PARAM_NAME: string = 'SupervisionBGThread.MAX_timeout';
    public static MIN_timeout_PARAM_NAME: string = 'SupervisionBGThread.MIN_timeout';

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

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SupervisionBGThread.instance) {
            SupervisionBGThread.instance = new SupervisionBGThread();
        }
        return SupervisionBGThread.instance;
    }

    /**
     * Lance les worker_inavalid de chaque api/sonde enregistré dans {@link SupervisionController.registered_controllers}.
     * @returns {number} : {@link ModuleBGThreadServer.TIMEOUT_COEF_SLOWER}
     * @throws error
     */
    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('SupervisionBGThread', 'work', 'IN');

            if (!this.loaded_param) {
                this.loaded_param = true;

                this.MAX_timeout = await ParamsServerController.getParamValueAsInt(SupervisionBGThread.MAX_timeout_PARAM_NAME, 5000, 180000);
                this.MIN_timeout = await ParamsServerController.getParamValueAsInt(SupervisionBGThread.MIN_timeout_PARAM_NAME, 100, 180000);
            }

            const registered_api_types = SupervisionController.getInstance().registered_controllers;

            const promises = [];

            for (const api_type_id in registered_api_types) {
                const shared_controller: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];
                const server_controller: ISupervisedItemServerController<any> = SupervisionServerController.getInstance().registered_controllers[api_type_id];

                // Si pas actif ou pas de time ms saisie, on passe au suivant
                if ((!shared_controller) || (!shared_controller.is_actif()) || (!server_controller) || (!server_controller.get_execute_time_ms())) {
                    continue;
                }

                promises.push((async () => {
                    const items: ISupervisedItem[] = await query(api_type_id)
                        .filter_is_true(field_names<ISupervisedItem>().invalid).select_vos<ISupervisedItem>();

                    if (server_controller.already_work) {
                        return;
                    }

                    // Si j'ai des items invalid, je vais throttle le controller
                    if (items && items.length) {

                        StatsController.register_stat_QUANTITE('SupervisionBGThread', 'work', 'invalid_items', items.length);

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

            await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('SupervisionBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('SupervisionBGThread', 'work', activity + '_OUT', time_out - time_in);
    }
}
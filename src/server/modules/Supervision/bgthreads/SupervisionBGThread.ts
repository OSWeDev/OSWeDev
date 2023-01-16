import { throttle } from 'lodash';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
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

        try {

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

        } catch (error) {
            ConsoleHandler.error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }
}
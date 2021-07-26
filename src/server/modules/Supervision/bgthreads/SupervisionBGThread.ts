import { throttle } from 'lodash';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ISupervisedItemServerController from '../interfaces/ISupervisedItemServerController';
import SupervisionServerController from '../SupervisionServerController';

export default class SupervisionBGThread implements IBGThread {

    public static getInstance() {
        if (!SupervisionBGThread.instance) {
            SupervisionBGThread.instance = new SupervisionBGThread();
        }
        return SupervisionBGThread.instance;
    }

    private static instance: SupervisionBGThread = null;

    public current_timeout: number = 1000;
    public MAX_timeout: number = 5000;
    public MIN_timeout: number = 1000;

    private throttle_by_api_type_id: { [api_type_id: string]: () => Promise<boolean> } = {};

    private constructor() { }

    get name(): string {
        return "SupervisionBGThread";
    }

    public async work(): Promise<number> {

        try {
            let registered_api_types = SupervisionController.getInstance().registered_controllers;

            for (let api_type_id in registered_api_types) {
                let shared_controller: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];
                let server_controller: ISupervisedItemServerController<any> = SupervisionServerController.getInstance().registered_controllers[api_type_id];

                // Si pas actif ou pas de time ms saisie, on passe au suivant
                if (!shared_controller.is_actif() || !server_controller.get_execute_time_ms()) {
                    continue;
                }

                let items: ISupervisedItem[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<ISupervisedItem>(
                    api_type_id,
                    null,
                    null,
                    'invalid',
                    ['true']
                );

                if (server_controller.already_work) {
                    continue;
                }

                // Si j'ai des items invalid, je vais throttle le controller
                if (items && items.length) {
                    if (!this.throttle_by_api_type_id[api_type_id]) {
                        this.throttle_by_api_type_id[api_type_id] = throttle(
                            server_controller.work_invalid.bind(server_controller),
                            server_controller.get_execute_time_ms(),
                            { leading: false });
                    }

                    this.throttle_by_api_type_id[api_type_id]();
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }
}
import ISupervisedItemClientController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemClientController';
import SupervisedCRONVO from '../../../../shared/modules/Supervision/vos/SupervisedCRONVO';
import SupervisedCRONClientController from './cron_supervision/SupervisedCRONClientController';
import './supervision_crud.scss';

export default class SupervisionClientController {

    // istanbul ignore next: nothing to test
    public static getInstance(): SupervisionClientController {
        if (!SupervisionClientController.instance) {
            SupervisionClientController.instance = new SupervisionClientController();
        }

        return SupervisionClientController.instance;
    }

    private static instance: SupervisionClientController = null;

    private registered_client_controllers_: { [api_type_id: string]: ISupervisedItemClientController<any> } = {};

    private constructor() {
        this.registered_client_controllers_[SupervisedCRONVO.API_TYPE_ID] = SupervisedCRONClientController.getInstance();
    }

    get registered_client_controllers(): { [api_type_id: string]: ISupervisedItemClientController<any> } {
        return this.registered_client_controllers_;
    }

    public register_client_controllers(api_type_id: string, controller: ISupervisedItemClientController<any>) {
        this.registered_client_controllers_[api_type_id] = controller;
    }
}
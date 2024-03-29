import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import PostModulesPoliciesPatchBase from '../../patchs/PostModulesPoliciesPatchBase';

export default class AddMaintenanceCreationPolicy extends PostModulesPoliciesPatchBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): AddMaintenanceCreationPolicy {
        if (!AddMaintenanceCreationPolicy.instance) {
            AddMaintenanceCreationPolicy.instance = new AddMaintenanceCreationPolicy();
        }
        return AddMaintenanceCreationPolicy.instance;
    }

    private static instance: AddMaintenanceCreationPolicy = null;

    private constructor() {
        super('AddMaintenanceCreationPolicy');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }) {

        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID)],
            [
                roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS],
            ]);
    }
}
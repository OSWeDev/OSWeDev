import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import PostModulesPoliciesPatchBase from '../PostModulesPoliciesPatchBase';


export default class Patch20201218AddMaintenanceCreationPolicy extends PostModulesPoliciesPatchBase {

    public static getInstance(): Patch20201218AddMaintenanceCreationPolicy {
        if (!Patch20201218AddMaintenanceCreationPolicy.instance) {
            Patch20201218AddMaintenanceCreationPolicy.instance = new Patch20201218AddMaintenanceCreationPolicy();
        }
        return Patch20201218AddMaintenanceCreationPolicy.instance;
    }

    private static instance: Patch20201218AddMaintenanceCreationPolicy = null;

    private constructor() {
        super('Patch20201218AddMaintenanceCreationPolicy');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }) {

        await this.activate_policies(
            policies_ids_by_name[ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID)],
            [
                roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS],
            ]);
    }
}
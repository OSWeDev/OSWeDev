/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import SharedFiltersVO from "../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20231123AddRightsSharedFilters extends PostModulesPoliciesPatchBase {

    public static getInstance(): Patch20231123AddRightsSharedFilters {
        if (!Patch20231123AddRightsSharedFilters.instance) {
            Patch20231123AddRightsSharedFilters.instance = new Patch20231123AddRightsSharedFilters();
        }
        return Patch20231123AddRightsSharedFilters.instance;
    }

    private static instance: Patch20231123AddRightsSharedFilters = null;

    private constructor() {
        super('Patch20231123AddRightsSharedFilters');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, SharedFiltersVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SharedFiltersVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
    }
}
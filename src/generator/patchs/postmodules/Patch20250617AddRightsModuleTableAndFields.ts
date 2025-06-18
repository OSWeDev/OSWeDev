/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../shared/modules/DAO/vos/ModuleTableVO";
import SharedFiltersVO from "../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20250617AddRightsModuleTableAndFields extends PostModulesPoliciesPatchBase {


    private static instance: Patch20250617AddRightsModuleTableAndFields = null;

    private constructor() {
        super('Patch20250617AddRightsModuleTableAndFields');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250617AddRightsModuleTableAndFields {
        if (!Patch20250617AddRightsModuleTableAndFields.instance) {
            Patch20250617AddRightsModuleTableAndFields.instance = new Patch20250617AddRightsModuleTableAndFields();
        }
        return Patch20250617AddRightsModuleTableAndFields.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, ModuleTableVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ModuleTableVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );

        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, ModuleTableFieldVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ModuleTableFieldVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
    }
}
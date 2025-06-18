/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import CRUDDBLinkVO from "../../../shared/modules/DashboardBuilder/vos/crud/CRUDDBLinkVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20250618AddRightsCRUDDBLink extends PostModulesPoliciesPatchBase {


    private static instance: Patch20250618AddRightsCRUDDBLink = null;

    private constructor() {
        super('Patch20250618AddRightsCRUDDBLink');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250618AddRightsCRUDDBLink {
        if (!Patch20250618AddRightsCRUDDBLink.instance) {
            Patch20250618AddRightsCRUDDBLink.instance = new Patch20250618AddRightsCRUDDBLink();
        }
        return Patch20250618AddRightsCRUDDBLink.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, CRUDDBLinkVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, CRUDDBLinkVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
    }
}
/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import PwaClientSubscriptionVO from "../../../shared/modules/PWA/vos/PwaClientSubscriptionVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20250409AddRightsPWA extends PostModulesPoliciesPatchBase {

    private static instance: Patch20250409AddRightsPWA = null;

    private constructor() {
        super('Patch20250409AddRightsPWA');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250409AddRightsPWA {
        if (!Patch20250409AddRightsPWA.instance) {
            Patch20250409AddRightsPWA.instance = new Patch20250409AddRightsPWA();
        }
        return Patch20250409AddRightsPWA.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, PwaClientSubscriptionVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, PwaClientSubscriptionVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, PwaClientSubscriptionVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, PwaClientSubscriptionVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
    }
}
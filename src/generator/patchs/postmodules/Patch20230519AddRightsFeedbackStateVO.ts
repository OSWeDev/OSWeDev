/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import FeedbackStateVO from "../../../shared/modules/Feedback/vos/FeedbackStateVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20230519AddRightsFeedbackStateVO extends PostModulesPoliciesPatchBase {

    public static getInstance(): Patch20230519AddRightsFeedbackStateVO {
        if (!Patch20230519AddRightsFeedbackStateVO.instance) {
            Patch20230519AddRightsFeedbackStateVO.instance = new Patch20230519AddRightsFeedbackStateVO();
        }
        return Patch20230519AddRightsFeedbackStateVO.instance;
    }

    private static instance: Patch20230519AddRightsFeedbackStateVO = null;

    private constructor() {
        super('Patch20230519AddRightsFeedbackStateVO');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, FeedbackStateVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, FeedbackStateVO.API_TYPE_ID)],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]]
        );
    }
}
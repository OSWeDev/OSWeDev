/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import ModuleSupervision from "../../../shared/modules/Supervision/ModuleSupervision";
import SupervisedCategoryVO from "../../../shared/modules/Supervision/vos/SupervisedCategoryVO";
import SupervisedProbeVO from "../../../shared/modules/Supervision/vos/SupervisedProbeVO";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20250102AddRightsSupervisedProbe extends PostModulesPoliciesPatchBase {

    private static instance: Patch20250102AddRightsSupervisedProbe = null;

    private constructor() {
        super('Patch20250102AddRightsSupervisedProbe');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250102AddRightsSupervisedProbe {
        if (!Patch20250102AddRightsSupervisedProbe.instance) {
            Patch20250102AddRightsSupervisedProbe.instance = new Patch20250102AddRightsSupervisedProbe();
        }
        return Patch20250102AddRightsSupervisedProbe.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {

        if (!ModuleSupervision.getInstance().actif) {
            return;
        }
        // on duplique les droits déclarés pour les supervisedCategory sur les supervisedprobe
        const access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);


        const LIST_roles_ids: number[] = [];
        for (const role_id in access_matrix[policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, SupervisedCategoryVO.API_TYPE_ID)]]) {
            LIST_roles_ids.push(parseInt(role_id));
        }

        if (!!LIST_roles_ids.length) {
            await this.activate_policies(
                policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, SupervisedProbeVO.API_TYPE_ID)],
                LIST_roles_ids
            );
        }

        const READ_roles_ids: number[] = [];
        for (const role_id in access_matrix[policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SupervisedCategoryVO.API_TYPE_ID)]]) {
            READ_roles_ids.push(parseInt(role_id));
        }

        if (!!READ_roles_ids.length) {
            await this.activate_policies(
                policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SupervisedProbeVO.API_TYPE_ID)],
                READ_roles_ids
            );
        }

        const INS_UPD_roles_ids: number[] = [];
        for (const role_id in access_matrix[policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, SupervisedCategoryVO.API_TYPE_ID)]]) {
            INS_UPD_roles_ids.push(parseInt(role_id));
        }

        if (!!INS_UPD_roles_ids.length) {
            await this.activate_policies(
                policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, SupervisedProbeVO.API_TYPE_ID)],
                INS_UPD_roles_ids
            );
        }

        const DEL_roles_ids: number[] = [];
        for (const role_id in access_matrix[policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, SupervisedCategoryVO.API_TYPE_ID)]]) {
            DEL_roles_ids.push(parseInt(role_id));
        }

        if (!!DEL_roles_ids.length) {
            await this.activate_policies(
                policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, SupervisedProbeVO.API_TYPE_ID)],
                DEL_roles_ids
            );
        }
    }
}
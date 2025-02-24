/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import RolePolicyVO from "../../../shared/modules/AccessPolicy/vos/RolePolicyVO";
import DAOController from "../../../shared/modules/DAO/DAOController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import ModuleSupervision from "../../../shared/modules/Supervision/ModuleSupervision";
import SupervisionController from "../../../shared/modules/Supervision/SupervisionController";
import { field_names } from "../../../shared/tools/ObjectHandler";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';

export default class Patch20250214AddRightsSupervisedPAUSE extends PostModulesPoliciesPatchBase {

    private static instance: Patch20250214AddRightsSupervisedPAUSE = null;

    private constructor() {
        super('Patch20250214AddRightsSupervisedPAUSE');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250214AddRightsSupervisedPAUSE {
        if (!Patch20250214AddRightsSupervisedPAUSE.instance) {
            Patch20250214AddRightsSupervisedPAUSE.instance = new Patch20250214AddRightsSupervisedPAUSE();
        }
        return Patch20250214AddRightsSupervisedPAUSE.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {

        if (!ModuleSupervision.getInstance().actif) {
            return;
        }

        // const access_matrix: {
        //     [policy_id: number]: {
        //         [role_id: number]: boolean;
        //     };
        // } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);


        // on parcours toute les sonde
        // et on récupere les role avec droit d'update
        const registered_api_types = SupervisionController.getInstance().registered_controllers;
        const has_any_update_access_by_role_id: { [policy_name: string]: number } = {};
        const checked_INS_UPD_roles_ids: number[] = [];


        for (const api_type in registered_api_types) {

            let bo_policy_id: number = policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, api_type)];
            let sup_bo_roleaccpols: RolePolicyVO[] = await query(RolePolicyVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<RolePolicyVO>().accpol_id, bo_policy_id)
                .select_vos<RolePolicyVO>();

            if (!sup_bo_roleaccpols || !sup_bo_roleaccpols.length) {
                continue;
            }

            for (const i in sup_bo_roleaccpols) {
                if (!!has_any_update_access_by_role_id[sup_bo_roleaccpols[i].role_id]) {
                    continue;
                }
                has_any_update_access_by_role_id[sup_bo_roleaccpols[i].role_id] = 1;
                checked_INS_UPD_roles_ids.push(sup_bo_roleaccpols[i].role_id);
            }

        }

        if (!!checked_INS_UPD_roles_ids?.length) {
            await this.activate_policies(
                policies_ids_by_name[ModuleSupervision.POLICY_ACTION_PAUSE_ACCESS],
                checked_INS_UPD_roles_ids
            );
        }
    }
}
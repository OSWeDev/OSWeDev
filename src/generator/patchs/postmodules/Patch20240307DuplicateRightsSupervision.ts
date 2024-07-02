/* istanbul ignore file: no unit tests on patchs */

import RolePolicyVO from "../../../shared/modules/AccessPolicy/vos/RolePolicyVO";
import ModuleSupervision from "../../../shared/modules/Supervision/ModuleSupervision";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class Patch20240307DuplicateRightsSupervision extends PostModulesPoliciesPatchBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240307DuplicateRightsSupervision {
        if (!Patch20240307DuplicateRightsSupervision.instance) {
            Patch20240307DuplicateRightsSupervision.instance = new Patch20240307DuplicateRightsSupervision();
        }
        return Patch20240307DuplicateRightsSupervision.instance;
    }

    private static instance: Patch20240307DuplicateRightsSupervision = null;

    private constructor() {
        super('Patch20240307DuplicateRightsSupervision');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {

        if (!ModuleSupervision.getInstance().actif) {
            return;
        }

        let bo_policy_id: number = policies_ids_by_name[ModuleSupervision.POLICY_BO_ACCESS];
        let sup_bo_roleaccpols: RolePolicyVO[] = await query(RolePolicyVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<RolePolicyVO>().accpol_id, bo_policy_id)
            .select_vos<RolePolicyVO>();

        if (!sup_bo_roleaccpols || !sup_bo_roleaccpols.length) {
            return;
        }

        let fo_policy_id: number = policies_ids_by_name[ModuleSupervision.POLICY_FO_ACCESS];
        let role_ids: number[] = sup_bo_roleaccpols.map((roleaccpol) => roleaccpol.role_id);

        await this.activate_policies(
            fo_policy_id,
            role_ids
        );

    }
}
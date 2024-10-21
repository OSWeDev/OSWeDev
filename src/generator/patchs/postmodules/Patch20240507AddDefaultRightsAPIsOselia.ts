/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleGPT from "../../../shared/modules/GPT/ModuleGPT";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20240507AddDefaultRightsAPIsOselia extends PostModulesPoliciesPatchBase {

    private static instance: Patch20240507AddDefaultRightsAPIsOselia = null;

    private constructor() {
        super('Patch20240507AddDefaultRightsAPIsOselia');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240507AddDefaultRightsAPIsOselia {
        if (!Patch20240507AddDefaultRightsAPIsOselia.instance) {
            Patch20240507AddDefaultRightsAPIsOselia.instance = new Patch20240507AddDefaultRightsAPIsOselia();
        }
        return Patch20240507AddDefaultRightsAPIsOselia.instance;
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[ModuleGPT.POLICY_ask_assistant],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
        await this.activate_policies(
            policies_ids_by_name[ModuleGPT.POLICY_generate_response],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
        await this.activate_policies(
            policies_ids_by_name[ModuleGPT.POLICY_rerun],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
    }
}
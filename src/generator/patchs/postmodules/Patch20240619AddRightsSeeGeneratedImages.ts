/* istanbul ignore file: no unit tests on patchs */

import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleOselia from "../../../shared/modules/Oselia/ModuleOselia";
import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";

export default class Patch20240619AddRightsSeeGeneratedImages extends PostModulesPoliciesPatchBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240619AddRightsSeeGeneratedImages {
        if (!Patch20240619AddRightsSeeGeneratedImages.instance) {
            Patch20240619AddRightsSeeGeneratedImages.instance = new Patch20240619AddRightsSeeGeneratedImages();
        }
        return Patch20240619AddRightsSeeGeneratedImages.instance;
    }

    private static instance: Patch20240619AddRightsSeeGeneratedImages = null;

    private constructor() {
        super('Patch20240619AddRightsSeeGeneratedImages');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    ) {
        await this.activate_policies(
            policies_ids_by_name[ModuleOselia.POLICY_GENERATED_IMAGES_FO_ACCESS],
            [roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]]
        );
    }
}
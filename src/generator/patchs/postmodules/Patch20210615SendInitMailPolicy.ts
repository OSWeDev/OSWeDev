import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import PostModulesPoliciesPatchBase from '../PostModulesPoliciesPatchBase';


export default class Patch20210615SendInitMailPolicy extends PostModulesPoliciesPatchBase {

    public static getInstance(): Patch20210615SendInitMailPolicy {
        if (!Patch20210615SendInitMailPolicy.instance) {
            Patch20210615SendInitMailPolicy.instance = new Patch20210615SendInitMailPolicy();
        }
        return Patch20210615SendInitMailPolicy.instance;
    }

    private static instance: Patch20210615SendInitMailPolicy = null;

    private constructor() {
        super('Patch20210615SendInitMailPolicy');
    }

    protected async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }) {

        await this.activate_policies(
            policies_ids_by_name[ModuleAccessPolicy.POLICY_SENDINITPWD],
            [
                roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS],
            ]);
    }
}
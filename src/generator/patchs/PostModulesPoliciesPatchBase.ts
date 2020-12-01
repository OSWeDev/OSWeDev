import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyVO from '../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../IGeneratorWorker';

export default abstract class PostModulesPoliciesPatchBase implements IGeneratorWorker {

    private access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};

    protected constructor(public uid: string) { }

    public async work(db: IDatabase<any>) {

        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        this.access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        let roles_ids_by_name: { [role_name: string]: number } = await this.get_roles_ids_by_name();
        let policies_ids_by_name: { [policy_name: string]: number } = await this.get_policies_ids_by_name();

        await this.do_policies_activations(roles_ids_by_name, policies_ids_by_name);
    }

    protected abstract async do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    );

    protected async get_roles_ids_by_name(): Promise<{ [role_name: string]: number }> {
        let roles_ids_by_name: { [role_name: string]: number } = {};
        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);

        for (let i in roles) {
            let role = roles[i];

            roles_ids_by_name[role.translatable_name] = role.id;
        }

        return roles_ids_by_name;
    }

    protected async get_policies_ids_by_name(): Promise<{ [policy_name: string]: number }> {
        let policies_ids_by_name: { [role_name: string]: number } = {};
        let policies: AccessPolicyVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID);

        for (let i in policies) {
            let policy = policies[i];

            policies_ids_by_name[policy.translatable_name] = policy.id;
        }

        return policies_ids_by_name;
    }

    protected async activate_policy(policy_id: number, role_id: number) {

        if ((!this.access_matrix[policy_id]) || (!this.access_matrix[policy_id][role_id])) {
            await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id);
        }
    }

    protected async activate_policies(
        policy_id: number,
        roles_ids: number[]) {

        for (let i in roles_ids) {
            await this.activate_policy(policy_id, roles_ids[i]);
        }
    }
}
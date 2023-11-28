import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../server/modules/DAO/ModuleDAOServer';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyVO from '../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePolicyVO from '../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../shared/modules/ContextFilter/vos/ContextQueryVO';
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

    protected abstract do_policies_activations(
        roles_ids_by_name: { [role_name: string]: number },
        policies_ids_by_name: { [policy_name: string]: number }
    );

    protected async get_roles_ids_by_name(): Promise<{ [role_name: string]: number }> {
        let roles_ids_by_name: { [role_name: string]: number } = {};
        let roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).select_vos<RoleVO>();

        for (let i in roles) {
            let role = roles[i];

            roles_ids_by_name[role.translatable_name] = role.id;
        }

        return roles_ids_by_name;
    }

    protected async get_policies_ids_by_name(): Promise<{ [policy_name: string]: number }> {
        let policies_ids_by_name: { [role_name: string]: number } = {};
        let policies: AccessPolicyVO[] = await query(AccessPolicyVO.API_TYPE_ID).select_vos<AccessPolicyVO>();

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

    protected async revoke_policy(policy_id: number, role_id: number) {

        if ((!!this.access_matrix[policy_id]) && (!!this.access_matrix[policy_id][role_id])) {
            await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id);
        }
    }

    protected async revoke_policies(
        policy_id: number,
        roles_ids: number[]) {

        for (let i in roles_ids) {
            await this.revoke_policy(policy_id, roles_ids[i]);
        }
    }

    /**
     * On supprime tous les droits du role_destination et on lui redonne les mêmes que le role_source
     * @param role_source
     * @param role_destination
     */
    protected async copy_role(role_source: RoleVO, role_destination: RoleVO) {

        if (!role_source) {
            return;
        }

        if (!role_destination) {
            return;
        }

        /**
         * Supprimer les droits existants du role_destination
         */
        let rights_role_destination: RolePolicyVO[] = await query(RolePolicyVO.API_TYPE_ID).filter_by_num_eq('role_id', role_destination.id).select_vos<RolePolicyVO>();
        await ModuleDAO.getInstance().deleteVOs(rights_role_destination);

        /**
         * Charger les droits du role_source
         */
        let rights_role_source: RolePolicyVO[] = await query(RolePolicyVO.API_TYPE_ID).filter_by_num_eq('role_id', role_source.id).select_vos<RolePolicyVO>();

        /**
         * Dupliquer pour le role_destination
         */
        rights_role_destination = [];
        for (let i in rights_role_source) {
            let right_role_source = rights_role_source[i];

            let right_role_destination = new RolePolicyVO();
            right_role_destination.accpol_id = right_role_source.accpol_id;
            right_role_destination.granted = right_role_source.granted;
            right_role_destination.role_id = role_destination.id;
            rights_role_destination.push(right_role_destination);
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(rights_role_destination);
    }
}
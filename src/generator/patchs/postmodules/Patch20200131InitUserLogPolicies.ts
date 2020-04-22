/* istanbul ignore file: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';

export default class Patch20200131InitUserLogPolicies implements IGeneratorWorker {

    public static getInstance(): Patch20200131InitUserLogPolicies {
        if (!Patch20200131InitUserLogPolicies.instance) {
            Patch20200131InitUserLogPolicies.instance = new Patch20200131InitUserLogPolicies();
        }
        return Patch20200131InitUserLogPolicies.instance;
    }

    private static instance: Patch20200131InitUserLogPolicies = null;

    get uid(): string {
        return 'Patch20200131InitUserLogPolicies';
    }

    private constructor() { }

    /**
     * Objectif : Init policies
     */
    public async work(db: IDatabase<any>) {


        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        let access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        let roles_ids_by_name: { [role_name: string]: number } = await this.get_roles_ids_by_name();
        let policies_ids_by_name: { [policy_name: string]: number } = await this.get_policies_ids_by_name();

        await this.activate_policies_ROLE_ANONYMOUS(access_matrix, policies_ids_by_name, roles_ids_by_name[ModuleAccessPolicy.ROLE_ANONYMOUS]);
    }

    private async activate_policies_ROLE_ANONYMOUS(
        access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        },
        policies_ids_by_name: { [policy_name: string]: number },
        role_id: number) {

        // UserLog
        await this.activate_policy(policies_ids_by_name[ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
        await this.activate_policy(policies_ids_by_name[ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
        await this.activate_policy(policies_ids_by_name[ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
    }


    private async get_roles_ids_by_name(): Promise<{ [role_name: string]: number }> {
        let roles_ids_by_name: { [role_name: string]: number } = {};
        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);

        for (let i in roles) {
            let role = roles[i];

            roles_ids_by_name[role.translatable_name] = role.id;
        }

        return roles_ids_by_name;
    }

    private async get_policies_ids_by_name(): Promise<{ [policy_name: string]: number }> {
        let policies_ids_by_name: { [role_name: string]: number } = {};
        let policies: AccessPolicyVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID);

        for (let i in policies) {
            let policy = policies[i];

            policies_ids_by_name[policy.translatable_name] = policy.id;
        }

        return policies_ids_by_name;
    }

    private async activate_policy(
        policy_id: number,
        role_id: number,
        access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        }) {

        if ((!access_matrix[policy_id]) || (!access_matrix[policy_id][role_id])) {
            await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id);
        }
    }
}
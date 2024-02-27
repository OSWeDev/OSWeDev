/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';

export default class InitUserLogPolicies implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): InitUserLogPolicies {
        if (!InitUserLogPolicies.instance) {
            InitUserLogPolicies.instance = new InitUserLogPolicies();
        }
        return InitUserLogPolicies.instance;
    }

    private static instance: InitUserLogPolicies = null;

    get uid(): string {
        return 'InitUserLogPolicies';
    }

    private constructor() { }

    /**
     * Objectif : Init policies
     */
    public async work(db: IDatabase<any>) {


        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        const access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        const roles_ids_by_name: { [role_name: string]: number } = await this.get_roles_ids_by_name();
        const policies_ids_by_name: { [policy_name: string]: number } = await this.get_policies_ids_by_name();

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
        await this.activate_policy(policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
        await this.activate_policy(policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
        await this.activate_policy(policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, UserLogVO.API_TYPE_ID)], role_id, access_matrix);
    }


    private async get_roles_ids_by_name(): Promise<{ [role_name: string]: number }> {
        const roles_ids_by_name: { [role_name: string]: number } = {};
        const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).select_vos<RoleVO>();

        for (const i in roles) {
            const role = roles[i];

            roles_ids_by_name[role.translatable_name] = role.id;
        }

        return roles_ids_by_name;
    }

    private async get_policies_ids_by_name(): Promise<{ [policy_name: string]: number }> {
        const policies_ids_by_name: { [role_name: string]: number } = {};
        const policies: AccessPolicyVO[] = await query(AccessPolicyVO.API_TYPE_ID).select_vos<AccessPolicyVO>();

        for (const i in policies) {
            const policy = policies[i];

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
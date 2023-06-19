import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';


export default class InitFrontVarsPolicies2 implements IGeneratorWorker {

    public static getInstance(): InitFrontVarsPolicies2 {
        if (!InitFrontVarsPolicies2.instance) {
            InitFrontVarsPolicies2.instance = new InitFrontVarsPolicies2();
        }
        return InitFrontVarsPolicies2.instance;
    }

    private static instance: InitFrontVarsPolicies2 = null;

    get uid(): string {
        return 'InitFrontVarsPolicies2';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {


        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        let access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        let roles_ids_by_name: { [role_name: string]: number } = await this.get_roles_ids_by_name();
        let policies_ids_by_name: { [policy_name: string]: number } = await this.get_policies_ids_by_name();

        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, VarConfVO.API_TYPE_ID)],
            [
                roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED],
            ], access_matrix);

        await this.activate_policies(
            policies_ids_by_name[DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, VarConfVO.API_TYPE_ID)],
            [
                roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED],
            ], access_matrix);
    }

    private async get_roles_ids_by_name(): Promise<{ [role_name: string]: number }> {
        let roles_ids_by_name: { [role_name: string]: number } = {};
        let roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).select_vos<RoleVO>();

        for (let i in roles) {
            let role = roles[i];

            roles_ids_by_name[role.translatable_name] = role.id;
        }

        return roles_ids_by_name;
    }

    private async get_policies_ids_by_name(): Promise<{ [policy_name: string]: number }> {
        let policies_ids_by_name: { [role_name: string]: number } = {};
        let policies: AccessPolicyVO[] = await query(AccessPolicyVO.API_TYPE_ID).select_vos<AccessPolicyVO>();

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

    private async activate_policies(
        policy_id: number,
        roles_ids: number[],
        access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        }) {

        for (let i in roles_ids) {
            await this.activate_policy(policy_id, roles_ids[i], access_matrix);
        }
    }
}
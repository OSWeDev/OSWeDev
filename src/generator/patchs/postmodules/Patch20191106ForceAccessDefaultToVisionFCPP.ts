/* istanbul ignore file: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20191106ForceAccessDefaultToVisionFCPP implements IGeneratorWorker {

    public static getInstance(): Patch20191106ForceAccessDefaultToVisionFCPP {
        if (!Patch20191106ForceAccessDefaultToVisionFCPP.instance) {
            Patch20191106ForceAccessDefaultToVisionFCPP.instance = new Patch20191106ForceAccessDefaultToVisionFCPP();
        }
        return Patch20191106ForceAccessDefaultToVisionFCPP.instance;
    }

    private static instance: Patch20191106ForceAccessDefaultToVisionFCPP = null;

    get uid(): string {
        return 'Patch20191106ForceAccessDefaultToVisionFCPP';
    }

    private constructor() { }

    /**
     * Objectif : on set accès true à la vision fc du programplan puisque initialement les projets n'ont pas besoin de fixer ce param pour l'accéder. à changer dans les projets qui peuvent en avoir besoin
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

        await this.activate_policies_ROLE_LOGGED(access_matrix, policies_ids_by_name, roles_ids_by_name[ModuleAccessPolicy.ROLE_LOGGED]);
    }

    private async activate_policies_ROLE_LOGGED(
        access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        },
        policies_ids_by_name: { [policy_name: string]: number },
        role_id: number) {

        await this.activate_policy(policies_ids_by_name[ModuleProgramPlanBase.POLICY_FO_SEE_FC], role_id, access_matrix);
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
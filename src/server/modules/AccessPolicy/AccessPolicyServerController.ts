import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleVO from '../../../shared/modules/ModuleVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModulesManagerServer from '../ModulesManagerServer';
import AccessPolicyDeleteSessionBGThread from './bgthreads/AccessPolicyDeleteSessionBGThread';

export default class AccessPolicyServerController {

    public static TASK_NAME_set_registered_role = 'AccessPolicyServerController.set_registered_role';
    public static TASK_NAME_set_registered_user_role = 'AccessPolicyServerController.set_registered_user_role';
    public static TASK_NAME_delete_registered_user_role = 'AccessPolicyServerController.delete_registered_user_role';
    public static TASK_NAME_set_registered_policy = 'AccessPolicyServerController.set_registered_policy';
    public static TASK_NAME_set_policy_dependency = 'AccessPolicyServerController.set_policy_dependency';
    public static TASK_NAME_set_role_policy = 'AccessPolicyServerController.set_role_policy';
    public static TASK_NAME_update_registered_policy = 'AccessPolicyServerController.update_registered_policy';
    public static TASK_NAME_update_policy_dependency = 'AccessPolicyServerController.update_policy_dependency';
    public static TASK_NAME_update_role_policy = 'AccessPolicyServerController.update_role_policy';
    public static TASK_NAME_update_role = 'AccessPolicyServerController.update_role';
    public static TASK_NAME_update_user_role = 'AccessPolicyServerController.update_user_role';
    public static TASK_NAME_delete_registered_policy = 'AccessPolicyServerController.delete_registered_policy';
    public static TASK_NAME_delete_registered_policy_dependency = 'AccessPolicyServerController.delete_registered_policy_dependency';
    public static TASK_NAME_delete_registered_role_policy = 'AccessPolicyServerController.delete_registered_role_policy';
    public static TASK_NAME_delete_registered_role = 'AccessPolicyServerController.delete_registered_role';
    public static TASK_NAME_reload_access_matrix = 'AccessPolicyServerController.reload_access_matrix';

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */
    public static access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    public static access_matrix_heritance_only: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    /**
     * la matrice d'accès doit être initialisée totalement avant usage, et tout changement nécessite une recompilation de la matrice avant le prochain usage
     */
    public static access_matrix_validity: boolean = false;
    public static access_matrix_heritance_only_validity: boolean = false;

    public static registered_roles_by_ids: { [role_id: number]: RoleVO } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    public static role_anonymous: RoleVO = null;
    public static role_logged: RoleVO = null;
    public static role_admin: RoleVO = null;

    public static hook_user_login: (email: string, password: string) => Promise<UserVO> = null;

    public static init_tasks() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_set_registered_role, AccessPolicyServerController.set_registered_role);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_set_registered_user_role, AccessPolicyServerController.set_registered_user_role);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_delete_registered_user_role, AccessPolicyServerController.delete_registered_user_role);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_set_registered_policy, AccessPolicyServerController.set_registered_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_set_policy_dependency, AccessPolicyServerController.set_policy_dependency);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_set_role_policy, AccessPolicyServerController.set_role_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_reload_access_matrix, AccessPolicyServerController.reload_access_matrix);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_update_registered_policy, AccessPolicyServerController.update_registered_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_update_policy_dependency, AccessPolicyServerController.update_policy_dependency);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_update_role_policy, AccessPolicyServerController.update_role_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_update_role, AccessPolicyServerController.update_role);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_update_user_role, AccessPolicyServerController.update_user_role);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_delete_registered_policy, AccessPolicyServerController.delete_registered_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_delete_registered_policy_dependency, AccessPolicyServerController.delete_registered_policy_dependency);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_delete_registered_role_policy, AccessPolicyServerController.delete_registered_role_policy);
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyServerController.TASK_NAME_delete_registered_role, AccessPolicyServerController.delete_registered_role);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!AccessPolicyServerController.instance) {
            AccessPolicyServerController.instance = new AccessPolicyServerController();
        }
        return AccessPolicyServerController.instance;
    }

    public static get_registered_role(role_name: string): RoleVO {
        return AccessPolicyServerController.registered_roles[role_name ? role_name.toLowerCase() : role_name];
    }

    public static get_registered_role_by_id(role_id: number): RoleVO {
        return AccessPolicyServerController.registered_roles_by_ids[role_id];
    }

    public static get_role_policy_by_ids(role_id: number, policy_id: number): RolePolicyVO {
        return AccessPolicyServerController.registered_roles_policies[role_id] ? AccessPolicyServerController.registered_roles_policies[role_id][policy_id] : null;
    }

    public static get_user_roles_by_uid(uid: number): RoleVO[] {
        return AccessPolicyServerController.registered_users_roles[uid];
    }

    public static get_registered_policy_group(group_name: string): AccessPolicyGroupVO {
        return AccessPolicyServerController.registered_policy_groups[group_name ? group_name.toLowerCase() : group_name];
    }

    public static get_registered_policy(policy_name: string): AccessPolicyVO {
        if (!policy_name) {
            return null;
        }
        return AccessPolicyServerController.registered_policies[policy_name ? policy_name.toLowerCase() : policy_name];
    }

    public static get_registered_policy_by_id(policy_id: number): AccessPolicyVO {
        return AccessPolicyServerController.registered_policies_by_ids[policy_id];
    }

    /**
     * Privilégier cette fonction synchrone pour vérifier les droits côté serveur
     * @param policy_name
     */
    public static checkAccessSync(policy_name: string, can_fail: boolean = false): boolean {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!policy_name)) {
            ConsoleHandler.error('checkAccessSync:!policy_name');
            return false;
        }

        if (!StackContext.get('IS_CLIENT')) {
            return true;
        }

        const target_policy: AccessPolicyVO = AccessPolicyServerController.get_registered_policy(policy_name);
        if (!target_policy) {
            ConsoleHandler.error('checkAccessSync:!target_policy:' + policy_name + ':');
            return false;
        }

        const uid: number = StackContext.get('UID');
        if (!uid) {
            // profil anonyme
            return AccessPolicyServerController.checkAccessTo(
                target_policy,
                AccessPolicyServerController.getUsersRoles(false, null),
                undefined, undefined, undefined, undefined, undefined, can_fail);
        }

        if (!AccessPolicyServerController.get_registered_user_roles_by_uid(uid)) {
            ConsoleHandler.warn('checkAccessSync:!get_registered_user_roles_by_uid:uid:' + uid + ':policy_name:' + policy_name + ':');
            return false;
        }

        return AccessPolicyServerController.checkAccessTo(
            target_policy,
            AccessPolicyServerController.getUsersRoles(true, uid),
            undefined, undefined, undefined, undefined, undefined, can_fail);
    }

    public static async preload_registered_roles_policies() {
        AccessPolicyServerController.registered_roles_policies = {};

        const rolesPolicies: RolePolicyVO[] = await query(RolePolicyVO.API_TYPE_ID).select_vos<RolePolicyVO>();
        for (const i in rolesPolicies) {
            const rolePolicy: RolePolicyVO = rolesPolicies[i];

            if (!AccessPolicyServerController.registered_roles_policies[rolePolicy.role_id]) {
                AccessPolicyServerController.registered_roles_policies[rolePolicy.role_id] = {};
            }

            AccessPolicyServerController.registered_roles_policies[rolePolicy.role_id][rolePolicy.accpol_id] = rolePolicy;
        }
    }

    public static has_access_by_name(policy_name: string, roles_names: string[]): boolean {

        if (!policy_name) {
            return false;
        }

        if (!AccessPolicyServerController.registered_policies[policy_name.toLowerCase()]) {
            ConsoleHandler.error('has_access_by_name:Failed find policy by name:' + policy_name);
            return false;
        }

        const policy_id: number = AccessPolicyServerController.registered_policies[policy_name.toLowerCase()].id;
        const roles_ids: number[] = [];

        for (const i in roles_names) {
            const role_name = roles_names[i];

            if (!AccessPolicyServerController.registered_roles[role_name.toLowerCase()]) {
                ConsoleHandler.error('has_access_by_name:Failed find role by name:' + role_name);
                return false;
            }

            roles_ids.push(AccessPolicyServerController.registered_roles[role_name.toLowerCase()].id);
        }

        return AccessPolicyServerController.has_access_by_ids(policy_id, roles_ids);
    }

    public static has_access_by_ids(policy_id: number, roles_ids: number[]): boolean {

        if (!AccessPolicyServerController.access_matrix[policy_id]) {
            ConsoleHandler.error('has_access_by_ids:Failed find policy by id in matrix:' + policy_id);
            return false;
        }

        /**
         * Si on a le rôle admin on dégage immédiatement
         */
        if (roles_ids && AccessPolicyServerController.role_admin && (roles_ids.indexOf(AccessPolicyServerController.role_admin.id) >= 0)) {
            return true;
        }

        for (const i in roles_ids) {
            const role_id = roles_ids[i];

            if (AccessPolicyServerController.access_matrix[policy_id][role_id] == null) {
                ConsoleHandler.error('has_access_by_ids:Failed find role by id for policy in matrix:' + role_id + ':' + policy_id);
                return false;
            }

            if (AccessPolicyServerController.access_matrix[policy_id][role_id]) {
                return true;
            }
        }

        return false;
    }

    /**
     * On commence par invalider la matrice pour indiquer qu'on ne doit plus l'utiliser, et on prévoit une refonte de la matrice rapidement
     */
    public static async reload_access_matrix(): Promise<boolean> {
        AccessPolicyServerController.access_matrix_validity = false;
        AccessPolicyServerController.access_matrix_heritance_only_validity = false;
        AccessPolicyServerController.throttled_reload_access_matrix_computation();
        return true;
    }

    public static reload_access_matrix_computation() {
        /**
         * Le changement de access_matrix et validity sont fait directement en générant la matrice
         */
        if (!AccessPolicyServerController.access_matrix_validity) {
            AccessPolicyServerController.getAccessMatrix(false);
        }
        if (!AccessPolicyServerController.access_matrix_heritance_only_validity) {
            AccessPolicyServerController.getAccessMatrix(true);
        }
    }

    public static async preload_registered_users_roles() {
        AccessPolicyServerController.registered_users_roles = {};

        const usersRoles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).select_vos<UserRoleVO>();
        for (const i in usersRoles) {
            const userRole: UserRoleVO = usersRoles[i];

            if (!AccessPolicyServerController.registered_users_roles[userRole.user_id]) {
                AccessPolicyServerController.registered_users_roles[userRole.user_id] = [];
            }

            AccessPolicyServerController.registered_users_roles[userRole.user_id].push(AccessPolicyServerController.registered_roles_by_ids[userRole.role_id]);
        }
    }

    public static async preload_registered_roles() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.clean_registered_roles();

        const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).exec_as_server().select_vos<RoleVO>();
        for (const i in roles) {
            const role: RoleVO = roles[i];

            AccessPolicyServerController.set_registered_role(role);

            if (role.translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                AccessPolicyServerController.role_admin = role;
            }
            if (role.translatable_name == ModuleAccessPolicy.ROLE_ANONYMOUS) {
                AccessPolicyServerController.role_anonymous = role;
            }
            if (role.translatable_name == ModuleAccessPolicy.ROLE_LOGGED) {
                AccessPolicyServerController.role_logged = role;
            }
        }
    }

    public static async preload_registered_policies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.clean_registered_policies();

        await ModulesManagerServer.getInstance().preload_modules();
        const policies: AccessPolicyVO[] = await query(AccessPolicyVO.API_TYPE_ID).exec_as_server().select_vos<AccessPolicyVO>();
        const promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'AccessPolicyServerController.preload_registered_policies');
        for (const i in policies) {
            const policy: AccessPolicyVO = policies[i];

            await promises_pipeline.push(async () => {
                const moduleVO: ModuleVO = policy.module_id ? await ModulesManagerServer.getInstance().getModuleVOById(policy.module_id) : null;
                if (policy.module_id && ((!moduleVO) || (!moduleVO.actif))) {
                    return;
                }
                AccessPolicyServerController.set_registered_policy(policy);
            });
        }
        await promises_pipeline.end();
    }

    public static async preload_registered_policy_groups() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.clean_registered_policy_groups();

        const groups: AccessPolicyGroupVO[] = await query(AccessPolicyGroupVO.API_TYPE_ID).select_vos<AccessPolicyGroupVO>();
        for (const i in groups) {
            const group: AccessPolicyGroupVO = groups[i];

            AccessPolicyServerController.set_registered_policy_group(group);
        }
    }

    public static async preload_registered_dependencies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.registered_dependencies = {};

        const dependencies: PolicyDependencyVO[] = await query(PolicyDependencyVO.API_TYPE_ID).select_vos<PolicyDependencyVO>();
        for (const i in dependencies) {
            const dependency: PolicyDependencyVO = dependencies[i];

            if (!AccessPolicyServerController.registered_dependencies[dependency.src_pol_id]) {
                AccessPolicyServerController.registered_dependencies[dependency.src_pol_id] = [];
            }
            AccessPolicyServerController.registered_dependencies[dependency.src_pol_id].push(dependency);

            if (!AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id]) {
                AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id] = [];
            }
            AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id][dependency.depends_on_pol_id] = dependency;
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static clean_registered_roles() {
        AccessPolicyServerController.registered_roles = {};
        AccessPolicyServerController.registered_roles_by_ids = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static clean_registered_policy_groups() {
        AccessPolicyServerController.registered_policy_groups = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static clean_registered_policies() {
        AccessPolicyServerController.registered_policies = {};
        AccessPolicyServerController.registered_policies_by_ids = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_registered_role(object: RoleVO): boolean {
        AccessPolicyServerController.registered_roles[object.translatable_name.toLowerCase()] = object;
        AccessPolicyServerController.registered_roles_by_ids[object.id] = object;
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_registered_user_role(vo: UserRoleVO): boolean {
        if (!vo) {
            return true;
        }

        if (!AccessPolicyServerController.registered_users_roles[vo.user_id]) {
            AccessPolicyServerController.registered_users_roles[vo.user_id] = [];
        }
        AccessPolicyServerController.registered_users_roles[vo.user_id].push(AccessPolicyServerController.registered_roles_by_ids[vo.role_id]);
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_registered_policy_group(object: AccessPolicyGroupVO): boolean {
        if (!object) {
            return true;
        }
        AccessPolicyServerController.registered_policy_groups[object.translatable_name.toLowerCase()] = object;
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_registered_policy(object: AccessPolicyVO): boolean {
        if (!object) {
            return true;
        }
        AccessPolicyServerController.registered_policies[object.translatable_name.toLowerCase()] = object;
        AccessPolicyServerController.registered_policies_by_ids[object.id] = object;
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static update_registered_policy(vo_update_holder: DAOUpdateVOHolder<AccessPolicyVO>): boolean {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return true;
        }
        if ((!AccessPolicyServerController.registered_policies_by_ids[vo_update_holder.post_update_vo.id]) || (!AccessPolicyServerController.get_registered_policy(AccessPolicyServerController.registered_policies_by_ids[vo_update_holder.post_update_vo.id].translatable_name))) {
            return true;
        }

        if (AccessPolicyServerController.registered_policies_by_ids[vo_update_holder.post_update_vo.id].translatable_name != vo_update_holder.post_update_vo.translatable_name) {
            AccessPolicyServerController.delete_registered_policy(AccessPolicyServerController.registered_policies_by_ids[vo_update_holder.post_update_vo.id]);
        }
        AccessPolicyServerController.set_registered_policy(vo_update_holder.post_update_vo);
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_policy_dependency(object: PolicyDependencyVO): boolean {
        if (!object) {
            return true;
        }

        if (!AccessPolicyServerController.registered_dependencies[object.src_pol_id]) {
            AccessPolicyServerController.registered_dependencies[object.src_pol_id] = [];
        }
        AccessPolicyServerController.registered_dependencies[object.src_pol_id].push(object);
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static update_policy_dependency(vo_update_holder: DAOUpdateVOHolder<PolicyDependencyVO>): boolean {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return true;
        }

        delete AccessPolicyServerController.registered_dependencies_for_loading_process[vo_update_holder.pre_update_vo.src_pol_id][vo_update_holder.pre_update_vo.depends_on_pol_id];
        AccessPolicyServerController.registered_dependencies_for_loading_process[vo_update_holder.post_update_vo.src_pol_id][vo_update_holder.post_update_vo.depends_on_pol_id] = vo_update_holder.post_update_vo;

        for (const i in AccessPolicyServerController.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id]) {
            if (AccessPolicyServerController.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id][i].id == vo_update_holder.post_update_vo.id) {
                AccessPolicyServerController.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id][i] = vo_update_holder.post_update_vo;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (const j in AccessPolicyServerController.registered_dependencies) {
            for (const i in AccessPolicyServerController.registered_dependencies[j]) {
                if (AccessPolicyServerController.registered_dependencies[j][i].id == vo_update_holder.post_update_vo.id) {
                    AccessPolicyServerController.registered_dependencies[j][i] = vo_update_holder.post_update_vo;
                    return true;
                }
            }
        }

        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static set_role_policy(object: RolePolicyVO): boolean {
        if (!object) {
            return true;
        }

        if (!AccessPolicyServerController.registered_roles_policies[object.role_id]) {
            AccessPolicyServerController.registered_roles_policies[object.role_id] = {};
        }
        AccessPolicyServerController.registered_roles_policies[object.role_id][object.accpol_id] = object;
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static update_role_policy(vo_update_holder: DAOUpdateVOHolder<RolePolicyVO>): boolean {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return true;
        }

        if (AccessPolicyServerController.registered_roles_policies[vo_update_holder.post_update_vo.role_id] && AccessPolicyServerController.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id] &&
            (AccessPolicyServerController.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id].id == vo_update_holder.post_update_vo.id)) {
            AccessPolicyServerController.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id] = vo_update_holder.post_update_vo;
            return true;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (const j in AccessPolicyServerController.registered_roles_policies) {
            for (const i in AccessPolicyServerController.registered_roles_policies[j]) {
                if (AccessPolicyServerController.registered_roles_policies[j][i].id == vo_update_holder.post_update_vo.id) {
                    AccessPolicyServerController.registered_roles_policies[j][i] = vo_update_holder.post_update_vo;
                    return true;
                }
            }
        }
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static update_role(vo_update_holder: DAOUpdateVOHolder<RoleVO>): boolean {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return true;
        }

        if ((!AccessPolicyServerController.registered_roles_by_ids[vo_update_holder.post_update_vo.id]) || (!AccessPolicyServerController.get_registered_role(AccessPolicyServerController.registered_roles_by_ids[vo_update_holder.post_update_vo.id].translatable_name))) {
            return true;
        }

        if (AccessPolicyServerController.registered_roles_by_ids[vo_update_holder.post_update_vo.id].translatable_name != vo_update_holder.post_update_vo.translatable_name) {
            AccessPolicyServerController.delete_registered_role(AccessPolicyServerController.registered_roles_by_ids[vo_update_holder.post_update_vo.id]);
        }
        AccessPolicyServerController.set_registered_role(vo_update_holder.post_update_vo);
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static update_user_role(vo_update_holder: DAOUpdateVOHolder<UserRoleVO>): boolean {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return true;
        }

        const role: RoleVO = AccessPolicyServerController.registered_roles_by_ids[vo_update_holder.post_update_vo.role_id];

        for (const i in AccessPolicyServerController.registered_users_roles[vo_update_holder.post_update_vo.user_id]) {
            if (AccessPolicyServerController.registered_users_roles[vo_update_holder.post_update_vo.user_id][i].id == role.id) {
                AccessPolicyServerController.registered_users_roles[vo_update_holder.post_update_vo.user_id][i] = role;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (const j in AccessPolicyServerController.registered_users_roles) {
            for (const i in AccessPolicyServerController.registered_users_roles[j]) {
                if (AccessPolicyServerController.registered_users_roles[j][i].id == role.id) {
                    AccessPolicyServerController.registered_users_roles[j][i] = role;
                    return true;
                }
            }
        }
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_role(role: RoleVO): boolean {
        if (!role) {
            return true;
        }
        delete AccessPolicyServerController.registered_roles[role.translatable_name.toLowerCase()];
        delete AccessPolicyServerController.registered_roles_by_ids[role.id];
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_user_role(vo: UserRoleVO): boolean {
        if (!vo) {
            return true;
        }

        const role: RoleVO = AccessPolicyServerController.registered_roles_by_ids[vo.role_id];

        for (const i in AccessPolicyServerController.registered_users_roles[vo.user_id]) {
            if (AccessPolicyServerController.registered_users_roles[vo.user_id][i].id == role.id) {
                AccessPolicyServerController.registered_users_roles[vo.user_id].splice(parseInt(i), 1);
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (const j in AccessPolicyServerController.registered_users_roles) {
            for (const i in AccessPolicyServerController.registered_users_roles[j]) {
                if (AccessPolicyServerController.registered_users_roles[j][i].id == role.id) {
                    AccessPolicyServerController.registered_users_roles[j].splice(parseInt(i), 1);
                    return true;
                }
            }
        }

        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_policy_group(name: string): boolean {
        if (!name) {
            return true;
        }
        delete AccessPolicyServerController.registered_policy_groups[name.toLowerCase()];
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_policy(object: AccessPolicyVO): boolean {
        if (!object) {
            return true;
        }
        delete AccessPolicyServerController.registered_policies[object.translatable_name.toLowerCase()];
        delete AccessPolicyServerController.registered_policies_by_ids[object.id];
        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_policy_dependency(object: PolicyDependencyVO): boolean {

        delete AccessPolicyServerController.registered_dependencies_for_loading_process[object.src_pol_id][object.depends_on_pol_id];

        for (const i in AccessPolicyServerController.registered_dependencies[object.src_pol_id]) {
            if (AccessPolicyServerController.registered_dependencies[object.src_pol_id][i].id == object.id) {
                AccessPolicyServerController.registered_dependencies[object.src_pol_id].splice(parseInt(i), 1);
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (const j in AccessPolicyServerController.registered_dependencies) {
            for (const i in AccessPolicyServerController.registered_dependencies[j]) {
                if (AccessPolicyServerController.registered_dependencies[j][i].id == object.id) {
                    AccessPolicyServerController.registered_dependencies[j].splice(parseInt(i), 1);
                    return true;
                }
            }
        }

        return true;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public static delete_registered_role_policy(object: RolePolicyVO): boolean {

        if (AccessPolicyServerController.registered_roles_policies[object.role_id] && AccessPolicyServerController.registered_roles_policies[object.role_id][object.accpol_id] &&
            (AccessPolicyServerController.registered_roles_policies[object.role_id][object.accpol_id].id == object.id)) {
            delete AccessPolicyServerController.registered_roles_policies[object.role_id][object.accpol_id];
            return true;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (const j in AccessPolicyServerController.registered_roles_policies) {
            for (const i in AccessPolicyServerController.registered_roles_policies[j]) {
                if (AccessPolicyServerController.registered_roles_policies[j][i].id == object.id) {
                    delete AccessPolicyServerController.registered_roles_policies[j][i];
                    return true;
                }
            }
        }

        return true;
    }

    /**
     * @param role Le rôle à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public static async registerRole(role: RoleVO, default_translation: DefaultTranslationVO): Promise<RoleVO> {
        if ((!role) || (!role.translatable_name)) {
            return null;
        }

        const translatable_name: string = role.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.registered_roles) {
            AccessPolicyServerController.registered_roles = {};
        }
        if (!AccessPolicyServerController.registered_roles_by_ids) {
            AccessPolicyServerController.registered_roles_by_ids = {};
        }

        if (AccessPolicyServerController.registered_roles[translatable_name.toLowerCase()]) {
            return AccessPolicyServerController.registered_roles[translatable_name.toLowerCase()];
        }

        if (default_translation) {
            default_translation.code_text = role.translatable_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.registerDefaultTranslation(default_translation);
        }

        // Un nouveau rôle a forcément un parent :
        //  - si c'est le rôle 'identifié', son parent est le rôle 'anonyme'
        //  - si c'est le rôle 'anonyme', il n'a pas de parent (c'est le seul)
        //  - si c'est le rôle 'admin', son parent est 'identifié'
        //  - pour tout autre rôle, son parent est soit 'identifié' soit un autre rôle ajouté (ne peut dépendre de 'anonyme' ou de 'admin')

        if (AccessPolicyServerController.role_anonymous && (role.translatable_name == AccessPolicyServerController.role_anonymous.translatable_name)) {
            role.parent_role_id = null;
        } else if (AccessPolicyServerController.role_logged && (role.translatable_name == AccessPolicyServerController.role_logged.translatable_name)) {
            role.parent_role_id = AccessPolicyServerController.role_anonymous.id;
        } else if (AccessPolicyServerController.role_admin && (role.translatable_name == AccessPolicyServerController.role_admin.translatable_name)) {
            role.parent_role_id = AccessPolicyServerController.role_logged.id;
        } else {
            if ((!role.parent_role_id) || (AccessPolicyServerController.role_anonymous && (role.parent_role_id == AccessPolicyServerController.role_anonymous.id)) || (AccessPolicyServerController.role_admin && (role.parent_role_id == AccessPolicyServerController.role_admin.id))) {
                role.parent_role_id = AccessPolicyServerController.role_logged.id;
            }
        }

        let roleFromBDD: RoleVO = null;
        try {
            roleFromBDD = await query(RoleVO.API_TYPE_ID).filter_by_text_eq(field_names<RoleVO>().translatable_name, role.translatable_name).select_vo<RoleVO>();
        } catch (error) {
            if (error.message == 'Multiple results on select_vo is not allowed : ' + RoleVO.API_TYPE_ID) {
                // Gestion cas duplication qui n'a aucun impact au fond faut juste vider et recréer
                ConsoleHandler.error('Duplicate role ' + role.translatable_name + ' detected, deleting it');
                const vos = await query(RoleVO.API_TYPE_ID).filter_by_text_eq(field_names<RoleVO>().translatable_name, role.translatable_name).select_vos<RoleVO>();
                await ModuleDAOServer.getInstance().deleteVOs_as_server(vos);
                roleFromBDD = null;
            } else {
                throw error;
            }
        }

        if (roleFromBDD) {
            AccessPolicyServerController.registered_roles[translatable_name.toLowerCase()] = roleFromBDD;
            AccessPolicyServerController.registered_roles_by_ids[roleFromBDD.id] = roleFromBDD;
            return roleFromBDD;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(role);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.error('Ajout de role échoué:' + role.translatable_name + ':');
            return null;
        }

        role.id = insertOrDeleteQueryResult.id;
        AccessPolicyServerController.registered_roles[role.translatable_name.toLowerCase()] = role;
        AccessPolicyServerController.registered_roles_by_ids[role.id] = role;
        ConsoleHandler.error('Ajout du role OK:' + role.translatable_name + ':');
        return role;
    }

    /**
     * @param group Le group à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public static async registerPolicyGroup(group: AccessPolicyGroupVO, default_translation: DefaultTranslationVO): Promise<AccessPolicyGroupVO> {
        if ((!group) || (!group.translatable_name)) {
            return null;
        }

        const translatable_name: string = group.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.registered_policy_groups) {
            AccessPolicyServerController.registered_policy_groups = {};
        }

        if (AccessPolicyServerController.registered_policy_groups[translatable_name.toLowerCase()]) {
            return AccessPolicyServerController.registered_policy_groups[translatable_name.toLowerCase()];
        }

        if (default_translation) {
            default_translation.code_text = group.translatable_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.registerDefaultTranslation(default_translation);
        }

        let groupFromBDD: AccessPolicyGroupVO = null;
        try {
            groupFromBDD = await query(AccessPolicyGroupVO.API_TYPE_ID).filter_by_text_eq(field_names<AccessPolicyGroupVO>().translatable_name, group.translatable_name).select_vo<AccessPolicyGroupVO>();
        } catch (error) {
            if (error.message == 'Multiple results on select_vo is not allowed : ' + AccessPolicyGroupVO.API_TYPE_ID) {
                // Gestion cas duplication qui n'a aucun impact au fond faut juste vider et recréer
                ConsoleHandler.error('Duplicate group ' + group.translatable_name + ' detected, deleting it');
                const vos = await query(AccessPolicyGroupVO.API_TYPE_ID).filter_by_text_eq(field_names<AccessPolicyGroupVO>().translatable_name, group.translatable_name).select_vos<AccessPolicyGroupVO>();
                await ModuleDAOServer.getInstance().deleteVOs_as_server(vos);
                groupFromBDD = null;
            } else {
                throw error;
            }
        }
        if (groupFromBDD) {
            AccessPolicyServerController.registered_policy_groups[translatable_name.toLowerCase()] = groupFromBDD;
            return groupFromBDD;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(group);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.error('Ajout de groupe échoué :' + group.translatable_name + ':');
            return null;
        }

        group.id = insertOrDeleteQueryResult.id;
        AccessPolicyServerController.registered_policy_groups[translatable_name.toLowerCase()] = group;
        ConsoleHandler.error('Ajout du groupe OK :' + group.translatable_name + ':');
        return group;
    }

    /**
     * @param policy La policy à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public static async registerPolicy(policy: AccessPolicyVO, default_translation: DefaultTranslationVO, moduleVO: ModuleVO): Promise<AccessPolicyVO> {
        if ((!policy) || (!policy.translatable_name)) {
            return null;
        }

        const moduleVoID = moduleVO ? moduleVO.id : null;
        policy.module_id = moduleVoID;
        const translatable_name: string = policy.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.registered_policies) {
            AccessPolicyServerController.registered_policies = {};
        }

        if (!AccessPolicyServerController.registered_policies_by_ids) {
            AccessPolicyServerController.registered_policies_by_ids = {};
        }

        if (AccessPolicyServerController.registered_policies[translatable_name.toLowerCase()]) {
            return AccessPolicyServerController.registered_policies[translatable_name.toLowerCase()];
        }

        if (default_translation) {
            default_translation.code_text = policy.translatable_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.registerDefaultTranslation(default_translation);
        }

        let policyFromBDD: AccessPolicyVO = null;
        try {
            policyFromBDD = await query(AccessPolicyVO.API_TYPE_ID).filter_by_text_eq(field_names<AccessPolicyVO>().translatable_name, policy.translatable_name).select_vo<AccessPolicyVO>();
        } catch (error) {
            if (error.message == 'Multiple results on select_vo is not allowed :' + AccessPolicyVO.API_TYPE_ID) {
                // Gestion cas duplication qui n'a aucun impact au fond faut juste vider et recréer
                ConsoleHandler.error('Duplicate policy ' + policy.translatable_name + ' detected, deleting it');
                const vos = await query(AccessPolicyVO.API_TYPE_ID).filter_by_text_eq(field_names<AccessPolicyVO>().translatable_name, policy.translatable_name).select_vos<AccessPolicyVO>();
                await ModuleDAOServer.getInstance().deleteVOs_as_server(vos);
                ConsoleHandler.error('Duplicate policy ' + policy.translatable_name + ' detected, deleted');
                policyFromBDD = null;
            } else {
                throw error;
            }
        }

        if (policyFromBDD) {

            // On vérifie les champs tout de même pour prendre en compte les modifs qui ont pu intervenir dans la définition du droit
            // La seule chose qu'on ne récupère pas est le weight pour le moment, a priori on doit pouvoir réorganiser dans l'admin ?
            // le comportement par défaut et le groupe sont eux fixés par l'appli, le changement dans l'admin sera donc écrasé à chaque redémarrage
            if ((policyFromBDD.default_behaviour != policy.default_behaviour) ||
                (policyFromBDD.group_id != policy.group_id) ||
                (policyFromBDD.module_id != moduleVoID)) {

                policyFromBDD.module_id = moduleVoID;
                policyFromBDD.default_behaviour = policy.default_behaviour;
                policyFromBDD.group_id = policy.group_id;
                const insertOrDeleteQueryResult_modif: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(policyFromBDD);
                if ((!insertOrDeleteQueryResult_modif) || (!insertOrDeleteQueryResult_modif.id)) {
                    ConsoleHandler.error('Modification de droit échoué :' + policyFromBDD.translatable_name + ':');
                    return null;
                }
                ConsoleHandler.error('Modification du droit :' + policyFromBDD.translatable_name + ': OK');
            }

            AccessPolicyServerController.registered_policies[translatable_name.toLowerCase()] = policyFromBDD;
            AccessPolicyServerController.registered_policies_by_ids[policyFromBDD.id] = policyFromBDD;
            return policyFromBDD;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(policy);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.error('Ajout de droit échoué :' + policy.translatable_name + ':');
            return null;
        }

        policy.id = insertOrDeleteQueryResult.id;
        AccessPolicyServerController.registered_policies[translatable_name.toLowerCase()] = policy;
        AccessPolicyServerController.registered_policies_by_ids[policy.id] = policy;
        ConsoleHandler.error('Ajout du droit OK :' + policy.translatable_name + ':');
        return policy;
    }

    public static async registerPolicyDependency(dependency: PolicyDependencyVO): Promise<PolicyDependencyVO> {

        if (AccessPolicyServerController.registered_dependencies_for_loading_process && AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id] && AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id][dependency.depends_on_pol_id]) {
            return AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id][dependency.depends_on_pol_id];
        }

        if (!AccessPolicyServerController.registered_dependencies) {
            AccessPolicyServerController.registered_dependencies = {};
        }

        if (!AccessPolicyServerController.registered_dependencies_for_loading_process) {
            AccessPolicyServerController.registered_dependencies_for_loading_process = {};
        }

        if (!AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id]) {
            AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id] = {};
        }

        if (!AccessPolicyServerController.registered_dependencies[dependency.src_pol_id]) {
            AccessPolicyServerController.registered_dependencies[dependency.src_pol_id] = [];
        }

        let dependencyFromBDD: PolicyDependencyVO = null;
        try {
            dependencyFromBDD = await query(PolicyDependencyVO.API_TYPE_ID).filter_by_num_eq(field_names<PolicyDependencyVO>().src_pol_id, dependency.src_pol_id).filter_by_num_eq(field_names<PolicyDependencyVO>().depends_on_pol_id, dependency.depends_on_pol_id).select_vo<PolicyDependencyVO>();
        } catch (error) {
            if (error.message == 'Multiple results on select_vo is not allowed : ' + PolicyDependencyVO.API_TYPE_ID) {
                // Gestion cas duplication de dépendance qui n'a aucun impact au fond faut juste vider et recréer
                ConsoleHandler.error('Duplicate policy dependency ' + dependency.src_pol_id + ' -> ' + dependency.depends_on_pol_id + ' detected, deleting it');
                const vos = await query(PolicyDependencyVO.API_TYPE_ID).filter_by_num_eq(field_names<PolicyDependencyVO>().src_pol_id, dependency.src_pol_id).filter_by_num_eq(field_names<PolicyDependencyVO>().depends_on_pol_id, dependency.depends_on_pol_id).select_vos<PolicyDependencyVO>();
                await ModuleDAOServer.getInstance().deleteVOs_as_server(vos);
                dependencyFromBDD = null;
            } else {
                throw error;
            }
        }
        if (dependencyFromBDD) {
            AccessPolicyServerController.registered_dependencies[dependency.src_pol_id].push(dependencyFromBDD);
            AccessPolicyServerController.registered_dependencies_for_loading_process[dependency.src_pol_id][dependency.depends_on_pol_id] = dependencyFromBDD;
            return dependencyFromBDD;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(dependency);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.error('Ajout de dépendance échouée :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
            return null;
        }

        dependency.id = insertOrDeleteQueryResult.id;
        AccessPolicyServerController.registered_dependencies[dependency.src_pol_id].push(dependency);
        ConsoleHandler.error('Ajout de dépendance OK :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
        return dependency;
    }

    public static get_registered_user_roles_by_uid(uid: number): RoleVO[] {
        return AccessPolicyServerController.registered_users_roles[uid];
    }

    /**
     * Public static pour faire des tests unitaires principalement.
     * @param bdd_user_roles Les roles tels qu'extraits de la bdd (donc potentiellement sans les héritages de rôles)
     * @param all_roles Tous les rôles possibles
     */
    public static getUsersRoles(
        logged_in: boolean,
        uid: number,
        bdd_user_roles: RoleVO[] = AccessPolicyServerController.registered_users_roles[uid],
        all_roles: { [role_id: number]: RoleVO } = AccessPolicyServerController.registered_roles_by_ids): { [role_id: number]: RoleVO } {
        const res: { [role_id: number]: RoleVO } = {};

        if ((!logged_in) || (!all_roles)) {
            return {
                [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
            };
        }

        // On ajoute le role connecté par défaut dans ce cas au cas où il serait pas en param
        const user_roles: RoleVO[] = [];

        for (const i in bdd_user_roles) {
            if (bdd_user_roles[i]) {
                user_roles.push(bdd_user_roles[i]);
            }
        }
        user_roles.push(AccessPolicyServerController.role_logged);

        for (const i in user_roles) {
            let role: RoleVO = user_roles[i];

            while (role && role.translatable_name) {

                if (!res[role.id]) {
                    res[role.id] = role;
                }
                role = role.parent_role_id ? all_roles[role.parent_role_id] : null;
            }
        }

        return res;
    }

    public static getAccessMatrix(ignore_role: boolean = false): { [policy_id: number]: { [role_id: number]: boolean } } {
        if (!AccessPolicyServerController.checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return null;
        }

        const res: { [policy_id: number]: { [role_id: number]: boolean } } = {};

        // Pour toutes les policies et tous les rôles, on fait un checkaccess. C'est bourrin mais pas mieux en stock pour être sûr d'avoir le bon résultat
        for (const i in AccessPolicyServerController.registered_policies) {
            const policy: AccessPolicyVO = AccessPolicyServerController.registered_policies[i];

            if (!res[policy.id]) {
                res[policy.id] = {};
            }

            for (const j in AccessPolicyServerController.registered_roles) {
                const role: RoleVO = AccessPolicyServerController.registered_roles[j];

                // On ignore l'admin qui a accès à tout
                if (AccessPolicyServerController.role_admin && (role.id == AccessPolicyServerController.role_admin.id)) {
                    continue;
                }

                res[policy.id][role.id] = AccessPolicyServerController.checkAccessTo(
                    policy,
                    { [role.id]: role },
                    AccessPolicyServerController.registered_roles_by_ids,
                    AccessPolicyServerController.registered_roles_policies,
                    AccessPolicyServerController.registered_policies_by_ids,
                    AccessPolicyServerController.registered_dependencies,
                    ignore_role ? role : null,
                    true);
            }
        }

        /**
         * Si on génère une matrice globale, on la set directement comme nouvelle version valide à date
         */
        if (!ignore_role) {
            AccessPolicyServerController.access_matrix = res;
            AccessPolicyServerController.access_matrix_validity = true;
        } else {
            AccessPolicyServerController.access_matrix_heritance_only = res;
            AccessPolicyServerController.access_matrix_heritance_only_validity = true;
        }

        return res;
    }

    /**
     * Public static pour faire des tests unitaires principalement.
     * Pour faciliter les tests on prend en entrée le maximum de données pour pas avoir besoin de la BDD
     * et on sort juste le boolean
     * @param target_policy La policy cible de l'appel pour laquelle on veut savoir si le user a accès
     * @param user_roles Les rôles du user
     * @param all_roles Tous les rôles
     * @param role_policies Les liaisons entre droits et rôles
     * @param policies Les droits
     * @param policies_dependencies Les dépendances
     * @param ignore_role_policy Pour le cas où on veut tester l'accès par héritage (important pour l'admin). Dans ce cas on a obligatoirement un seul role en param
     * @param is_recur_test_call Pour les appels récurrents qui peuvent renvoyer false, mais être issu d'un appel global qui renverra true, ne pas logger le false
     */
    public static checkAccessTo(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO } = AccessPolicyServerController.registered_roles_by_ids,
        role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = AccessPolicyServerController.registered_roles_policies,
        policies: { [policy_id: number]: AccessPolicyVO } = AccessPolicyServerController.registered_policies_by_ids,
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = AccessPolicyServerController.registered_dependencies,
        ignore_role_policy: RoleVO = null,
        is_recur_test_call: boolean = false): boolean {

        if ((!target_policy) || (!user_roles) || (!all_roles)) {
            if (!is_recur_test_call) {
                ConsoleHandler.warn('checkAccessTo:!target_policy');
            }
            return false;
        }

        /**
         * FastTrack : si la matrice d'accès a été initialisée, on passe par elle
         */
        if ((!ignore_role_policy) && AccessPolicyServerController.access_matrix_validity) {
            return AccessPolicyServerController.has_access_by_ids(target_policy.id, Object.values(user_roles).map((role) => role.id));
        }

        /**
         * Les règles de résolution d'un accès :
         *  - Si un de mes rôle me donne accès, j'ai accès
         *  - On doit éliminer les rôles un par un en cherchant à autoriser l'accès. Par défaut on refusera l'accès
         *  - Pour chaque rôle, et chaque rôle hérité :
         *      - Cas 0 je suis Admin, j'ai accès
         *      - Cas 1 : Si j'ai explicitement un paramétrage pour ce droit sur ce rôle et !ignore_role_policy :
         *          - Si accès granted : return true;
         *          - Si accès denied : on ne peut pas avoir accès avec ce rôle, on passe au suivant.
         *      - Cas 2 : Sinon : Je peux vérifier que le droit lui-même me donne pas accès par défaut, suivant son comportement et le rôle que je suis entrain de tester.
         *      - Cas 3 : Sinon : Je peux tester les dépendances de droit sur ce droit
         *          - Si ces dépendances existent, et que l'un au moins est en "par défaut en Access granted",
         *              je peux retester sur les dépendances (et donc si checkAccess de tous les droits, alors return true)
         *              il faut que toutes les deps en default denied soient ok et au moins une en default granted
         *          - Sinon, je n'ai pas accès à ce droit.
         */

        // On identifie d'abord les rôles et rôles hérités
        const user_roles_and_inherited: { [role_id: number]: RoleVO } = {};
        for (const i in user_roles) {
            let role: RoleVO = user_roles[i];

            while (role) {
                if (!user_roles_and_inherited[role.id]) {
                    user_roles_and_inherited[role.id] = role;
                }

                role = (role.parent_role_id && all_roles[role.parent_role_id]) ? all_roles[role.parent_role_id] : null;
            }
        }

        for (const i in user_roles_and_inherited) {
            const user_role: RoleVO = user_roles_and_inherited[i];


            let is_ignored_role: boolean = false;
            if (ignore_role_policy && (ignore_role_policy.id == user_role.id)) {
                is_ignored_role = true;
            }

            // Cas 0
            if (AccessPolicyServerController.role_admin && (user_role.id == AccessPolicyServerController.role_admin.id)) {
                return true;
            }

            if (!AccessPolicyServerController.hasCleanDependencies(
                target_policy,
                [user_role],
                all_roles,
                role_policies,
                policies,
                policies_dependencies,
                true)) {

                continue;
            }

            // Cas 1
            if ((!is_ignored_role) && role_policies && role_policies[user_role.id] && role_policies[user_role.id][target_policy.id]) {
                if (role_policies[user_role.id][target_policy.id].granted) {

                    return true;
                } else {
                    continue;
                }
            }

            // Cas 2
            if (policies && policies[target_policy.id]) {
                switch (policies[target_policy.id].default_behaviour) {
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE:
                        return true;
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS:
                        if (AccessPolicyServerController.role_anonymous && (user_role.id != AccessPolicyServerController.role_anonymous.id)) {
                            return true;
                        }
                        break;
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN:
                    default:
                    // Le cas de l'admin est déjà géré
                }
            }

            // Cas 3
            if (policies_dependencies && policies_dependencies[target_policy.id] && policies_dependencies[target_policy.id].length) {

                for (const j in policies_dependencies[target_policy.id]) {
                    const dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

                    if (dependency.default_behaviour != PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED) {
                        continue;
                    }

                    if (AccessPolicyServerController.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies, null, true)) {
                        return true;
                    }
                }
            }
        }

        if (!is_recur_test_call) {
            ConsoleHandler.warn('checkAccessTo:refused:' +
                'target_policy:' + (target_policy ? target_policy.translatable_name : 'N/A') + ':' +
                'uid:' + StackContext.get('UID') + ':' +
                'user_roles:' + (user_roles ? Object.values(user_roles).map(function (role) { return role.translatable_name; }).join(',') : 'N/A') + ':' +
                'all_roles:' + (all_roles ? 'LOADED' : 'N/A') + ':' +
                'role_policies:' + (role_policies ? 'LOADED' : 'N/A') + ':' +
                'policies:' + (policies ? 'LOADED' : 'N/A') + ':' +
                'policies_dependencies:' + (policies_dependencies ? 'LOADED' : 'N/A') + ':' +
                'ignore_role_policy:' + JSON.stringify(ignore_role_policy) + ':'
            );

            // On ajoute la session au bgthread d'invalidation si on a un sid
            const session: IServerUserSession = StackContext.get('SESSION');
            if (session && session.sid) {
                ForkedTasksController.exec_self_on_bgthread(
                    AccessPolicyDeleteSessionBGThread.getInstance().name,
                    AccessPolicyDeleteSessionBGThread.TASK_NAME_set_session_to_delete_by_sids,
                    session
                ).then().catch((error) => ConsoleHandler.error(error));
            }
        }
        return false;
    }

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */

    /**
     * Opti pour le démarrage du serveur
     */
    private static registered_dependencies_for_loading_process: { [src_pol_id: number]: { [dst_pol_id: number]: PolicyDependencyVO } } = {};

    private static registered_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {};

    private static registered_users_roles: { [uid: number]: RoleVO[] } = {};
    private static registered_roles_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {};
    private static registered_policies_by_ids: { [policy_id: number]: AccessPolicyVO } = {};

    private static registered_roles: { [role_name: string]: RoleVO } = {};
    private static registered_policy_groups: { [group_name: string]: AccessPolicyGroupVO } = {};
    private static registered_policies: { [policy_name: string]: AccessPolicyVO } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    private static instance: AccessPolicyServerController = null;

    private static throttled_reload_access_matrix_computation = ThrottleHelper.declare_throttle_without_args(AccessPolicyServerController.reload_access_matrix_computation.bind(this), 1000);

    private static hasCleanDependencies(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO },
        role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } },
        policies: { [policy_id: number]: AccessPolicyVO },
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] },
        is_recur_test_call: boolean = false): boolean {

        if ((!policies_dependencies) || (!policies)) {
            return true;
        }

        for (const j in policies_dependencies[target_policy.id]) {
            const dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

            if ((dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED) && (!AccessPolicyServerController.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies, null, is_recur_test_call))) {
                return false;
            }
        }

        return true;
    }

    private constructor() { }
}
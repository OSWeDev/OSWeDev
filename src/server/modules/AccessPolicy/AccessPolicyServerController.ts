import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleVO from '../../../shared/modules/ModuleVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IServerUserSession from '../../IServerUserSession';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModulesManagerServer from '../ModulesManagerServer';
import AccessPolicyDeleteSessionBGThread from './bgthreads/AccessPolicyDeleteSessionBGThread';
import ModuleAccessPolicyServer from './ModuleAccessPolicyServer';

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

    public static getInstance() {
        if (!AccessPolicyServerController.instance) {
            AccessPolicyServerController.instance = new AccessPolicyServerController();
        }
        return AccessPolicyServerController.instance;
    }

    private static instance: AccessPolicyServerController = null;

    public role_anonymous: RoleVO = null;
    public role_logged: RoleVO = null;
    public role_admin: RoleVO = null;

    public hook_user_login: (email: string, password: string) => Promise<UserVO> = null;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */
    private registered_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {};

    private registered_roles_by_ids: { [role_id: number]: RoleVO } = {};
    private registered_users_roles: { [uid: number]: RoleVO[] } = {};
    private registered_roles_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {};
    private registered_policies_by_ids: { [policy_id: number]: AccessPolicyVO } = {};

    private registered_roles: { [role_name: string]: RoleVO } = {};
    private registered_policy_groups: { [group_name: string]: AccessPolicyGroupVO } = {};
    private registered_policies: { [policy_name: string]: AccessPolicyVO } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    public constructor() {
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_set_registered_role, this.set_registered_role.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_set_registered_user_role, this.set_registered_user_role.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_delete_registered_user_role, this.delete_registered_user_role.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_set_registered_policy, this.set_registered_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_set_policy_dependency, this.set_policy_dependency.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_set_role_policy, this.set_role_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_update_registered_policy, this.update_registered_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_update_policy_dependency, this.update_policy_dependency.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_update_role_policy, this.update_role_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_update_role, this.update_role.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_update_user_role, this.update_user_role.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_delete_registered_policy, this.delete_registered_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_delete_registered_policy_dependency, this.delete_registered_policy_dependency.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_delete_registered_role_policy, this.delete_registered_role_policy.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyServerController.TASK_NAME_delete_registered_role, this.delete_registered_role.bind(this));
    }

    public async preload_registered_roles_policies() {
        this.registered_roles_policies = {};

        let rolesPolicies: RolePolicyVO[] = await ModuleDAO.getInstance().getVos<RolePolicyVO>(RolePolicyVO.API_TYPE_ID);
        for (let i in rolesPolicies) {
            let rolePolicy: RolePolicyVO = rolesPolicies[i];

            if (!this.registered_roles_policies[rolePolicy.role_id]) {
                this.registered_roles_policies[rolePolicy.role_id] = {};
            }

            this.registered_roles_policies[rolePolicy.role_id][rolePolicy.accpol_id] = rolePolicy;
        }
    }

    public async preload_registered_users_roles() {
        this.registered_users_roles = {};

        let usersRoles: UserRoleVO[] = await ModuleDAO.getInstance().getVos<UserRoleVO>(UserRoleVO.API_TYPE_ID);
        for (let i in usersRoles) {
            let userRole: UserRoleVO = usersRoles[i];

            if (!this.registered_users_roles[userRole.user_id]) {
                this.registered_users_roles[userRole.user_id] = [];
            }

            this.registered_users_roles[userRole.user_id].push(this.registered_roles_by_ids[userRole.role_id]);
        }
    }

    public async preload_registered_roles() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.clean_registered_roles();

        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);
        for (let i in roles) {
            let role: RoleVO = roles[i];

            this.set_registered_role(role);

            if (role.translatable_name == this.role_admin.translatable_name) {
                this.role_admin = role;
            }
            if (role.translatable_name == this.role_anonymous.translatable_name) {
                this.role_anonymous = role;
            }
            if (role.translatable_name == this.role_logged.translatable_name) {
                this.role_logged = role;
            }
        }
    }

    public async preload_registered_policies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.clean_registered_policies();

        let policies: AccessPolicyVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID);
        for (let i in policies) {
            let policy: AccessPolicyVO = policies[i];

            let moduleVO: ModuleVO = policy.module_id ? await ModulesManagerServer.getInstance().getModuleVOById(policy.module_id) : null;
            if (policy.module_id && ((!moduleVO) || (!moduleVO.actif))) {
                continue;
            }
            this.set_registered_policy(policy);
        }
    }

    public async preload_registered_dependencies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.registered_dependencies = {};

        let dependencies: PolicyDependencyVO[] = await ModuleDAO.getInstance().getVos<PolicyDependencyVO>(PolicyDependencyVO.API_TYPE_ID);
        for (let i in dependencies) {
            let dependency: PolicyDependencyVO = dependencies[i];

            if (!this.registered_dependencies[dependency.src_pol_id]) {
                this.registered_dependencies[dependency.src_pol_id] = [];
            }
            this.registered_dependencies[dependency.src_pol_id].push(dependency);
        }
    }

    public get_registered_role(role_name: string): RoleVO {
        return this.registered_roles[role_name ? role_name.toLowerCase() : role_name];
    }

    public get_registered_role_by_id(role_id: number): RoleVO {
        return this.registered_roles_by_ids[role_id];
    }

    public get_role_policy_by_ids(role_id: number, policy_id: number): RolePolicyVO {
        return this.registered_roles_policies[role_id] ? this.registered_roles_policies[role_id][policy_id] : null;
    }

    public get_user_roles_by_uid(uid: number): RoleVO[] {
        return this.registered_users_roles[uid];
    }

    public get_registered_policy_group(group_name: string): AccessPolicyGroupVO {
        return this.registered_policy_groups[group_name ? group_name.toLowerCase() : group_name];
    }

    public get_registered_policy(policy_name: string): AccessPolicyVO {
        if (!policy_name) {
            return null;
        }
        return this.registered_policies[policy_name ? policy_name.toLowerCase() : policy_name];
    }

    public get_registered_policy_by_id(policy_id: number): AccessPolicyVO {
        return this.registered_policies_by_ids[policy_id];
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public clean_registered_roles() {
        this.registered_roles = {};
        this.registered_roles_by_ids = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public clean_registered_policy_groups() {
        this.registered_policy_groups = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public clean_registered_policies() {
        this.registered_policies = {};
        this.registered_policies_by_ids = {};
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_registered_role(object: RoleVO) {
        this.registered_roles[object.translatable_name.toLowerCase()] = object;
        this.registered_roles_by_ids[object.id] = object;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_registered_user_role(vo: UserRoleVO) {
        if (!vo) {
            return;
        }

        if (!this.registered_users_roles[vo.user_id]) {
            this.registered_users_roles[vo.user_id] = [];
        }
        this.registered_users_roles[vo.user_id].push(this.registered_roles_by_ids[vo.role_id]);
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_registered_policy_group(object: AccessPolicyGroupVO) {
        if (!object) {
            return;
        }
        this.registered_policy_groups[object.translatable_name.toLowerCase()] = object;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_registered_policy(object: AccessPolicyVO) {
        if (!object) {
            return;
        }
        this.registered_policies[object.translatable_name.toLowerCase()] = object;
        this.registered_policies_by_ids[object.id] = object;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public update_registered_policy(vo_update_holder: DAOUpdateVOHolder<AccessPolicyVO>) {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return;
        }
        if ((!this.registered_policies_by_ids[vo_update_holder.post_update_vo.id]) || (!this.get_registered_policy(this.registered_policies_by_ids[vo_update_holder.post_update_vo.id].translatable_name))) {
            return true;
        }

        if (this.registered_policies_by_ids[vo_update_holder.post_update_vo.id].translatable_name != vo_update_holder.post_update_vo.translatable_name) {
            this.delete_registered_policy(this.registered_policies_by_ids[vo_update_holder.post_update_vo.id]);
        }
        this.set_registered_policy(vo_update_holder.post_update_vo);
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_policy_dependency(object: PolicyDependencyVO) {
        if (!object) {
            return;
        }

        if (!this.registered_dependencies[object.src_pol_id]) {
            this.registered_dependencies[object.src_pol_id] = [];
        }
        this.registered_dependencies[object.src_pol_id].push(object);
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public update_policy_dependency(vo_update_holder: DAOUpdateVOHolder<PolicyDependencyVO>) {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return;
        }

        for (let i in this.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id]) {
            if (this.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id][i].id == vo_update_holder.post_update_vo.id) {
                this.registered_dependencies[vo_update_holder.post_update_vo.src_pol_id][i] = vo_update_holder.post_update_vo;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (let j in this.registered_dependencies) {
            for (let i in this.registered_dependencies[j]) {
                if (this.registered_dependencies[j][i].id == vo_update_holder.post_update_vo.id) {
                    this.registered_dependencies[j][i] = vo_update_holder.post_update_vo;
                    return true;
                }
            }
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public set_role_policy(object: RolePolicyVO) {
        if (!object) {
            return;
        }

        if (!this.registered_roles_policies[object.role_id]) {
            this.registered_roles_policies[object.role_id] = {};
        }
        this.registered_roles_policies[object.role_id][object.accpol_id] = object;
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public update_role_policy(vo_update_holder: DAOUpdateVOHolder<RolePolicyVO>) {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return;
        }

        if (this.registered_roles_policies[vo_update_holder.post_update_vo.role_id] && this.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id] &&
            (this.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id].id == vo_update_holder.post_update_vo.id)) {
            this.registered_roles_policies[vo_update_holder.post_update_vo.role_id][vo_update_holder.post_update_vo.accpol_id] = vo_update_holder.post_update_vo;
            return;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (let j in this.registered_roles_policies) {
            for (let i in this.registered_roles_policies[j]) {
                if (this.registered_roles_policies[j][i].id == vo_update_holder.post_update_vo.id) {
                    this.registered_roles_policies[j][i] = vo_update_holder.post_update_vo;
                    return;
                }
            }
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public update_role(vo_update_holder: DAOUpdateVOHolder<RoleVO>) {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return;
        }

        if ((!this.registered_roles_by_ids[vo_update_holder.post_update_vo.id]) || (!this.get_registered_role(this.registered_roles_by_ids[vo_update_holder.post_update_vo.id].translatable_name))) {
            return;
        }

        if (this.registered_roles_by_ids[vo_update_holder.post_update_vo.id].translatable_name != vo_update_holder.post_update_vo.translatable_name) {
            this.delete_registered_role(this.registered_roles_by_ids[vo_update_holder.post_update_vo.id]);
        }
        this.set_registered_role(vo_update_holder.post_update_vo);
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public update_user_role(vo_update_holder: DAOUpdateVOHolder<UserRoleVO>) {
        if ((!vo_update_holder) || (!vo_update_holder.post_update_vo)) {
            return;
        }

        let role: RoleVO = this.registered_roles_by_ids[vo_update_holder.post_update_vo.role_id];

        for (let i in this.registered_users_roles[vo_update_holder.post_update_vo.user_id]) {
            if (this.registered_users_roles[vo_update_holder.post_update_vo.user_id][i].id == role.id) {
                this.registered_users_roles[vo_update_holder.post_update_vo.user_id][i] = role;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (let j in this.registered_users_roles) {
            for (let i in this.registered_users_roles[j]) {
                if (this.registered_users_roles[j][i].id == role.id) {
                    this.registered_users_roles[j][i] = role;
                    return true;
                }
            }
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_role(role: RoleVO) {
        if (!role) {
            return;
        }
        delete this.registered_roles[role.translatable_name.toLowerCase()];
        delete this.registered_roles_by_ids[role.id];
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_user_role(vo: UserRoleVO) {
        if (!vo) {
            return;
        }

        let role: RoleVO = this.registered_roles_by_ids[vo.role_id];

        for (let i in this.registered_users_roles[vo.user_id]) {
            if (this.registered_users_roles[vo.user_id][i].id == role.id) {
                this.registered_users_roles[vo.user_id].splice(parseInt(i), 1);
                return;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (let j in this.registered_users_roles) {
            for (let i in this.registered_users_roles[j]) {
                if (this.registered_users_roles[j][i].id == role.id) {
                    this.registered_users_roles[j].splice(parseInt(i), 1);
                    return;
                }
            }
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_policy_group(name: string) {
        if (!name) {
            return;
        }
        delete this.registered_policy_groups[name.toLowerCase()];
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_policy(object: AccessPolicyVO) {
        if (!object) {
            return;
        }
        delete this.registered_policies[object.translatable_name.toLowerCase()];
        delete this.registered_policies_by_ids[object.id];
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_policy_dependency(object: PolicyDependencyVO) {

        for (let i in this.registered_dependencies[object.src_pol_id]) {
            if (this.registered_dependencies[object.src_pol_id][i].id == object.id) {
                this.registered_dependencies[object.src_pol_id].splice(parseInt(i), 1);
                return;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (let j in this.registered_dependencies) {
            for (let i in this.registered_dependencies[j]) {
                if (this.registered_dependencies[j][i].id == object.id) {
                    this.registered_dependencies[j].splice(parseInt(i), 1);
                    return;
                }
            }
        }
    }

    /**
     * WARN : After application initialisation (and first load of these cached datas), no update should stay in one thread, and has to be brocasted
     */
    public delete_registered_role_policy(object: RolePolicyVO) {

        if (this.registered_roles_policies[object.role_id] && this.registered_roles_policies[object.role_id][object.accpol_id] &&
            (this.registered_roles_policies[object.role_id][object.accpol_id].id == object.id)) {
            delete this.registered_roles_policies[object.role_id][object.accpol_id];
            return;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (let j in this.registered_roles_policies) {
            for (let i in this.registered_roles_policies[j]) {
                if (this.registered_roles_policies[j][i].id == object.id) {
                    delete this.registered_roles_policies[j][i];
                    return;
                }
            }
        }
    }

    /**
     * @param role Le rôle à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerRole(role: RoleVO, default_translation: DefaultTranslation): Promise<RoleVO> {
        if ((!role) || (!role.translatable_name)) {
            return null;
        }

        let translatable_name: string = role.translatable_name.toLowerCase();

        if (!this.registered_roles) {
            this.registered_roles = {};
        }
        if (!this.registered_roles_by_ids) {
            this.registered_roles_by_ids = {};
        }

        if (this.registered_roles[translatable_name]) {
            return this.registered_roles[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = role.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        // Un nouveau rôle a forcément un parent :
        //  - si c'est le rôle 'identifié', son parent est le rôle 'anonyme'
        //  - si c'est le rôle 'anonyme', il n'a pas de parent (c'est le seul)
        //  - si c'est le rôle 'admin', son parent est 'identifié'
        //  - pour tout autre rôle, son parent est soit 'identifié' soit un autre rôle ajouté (ne peut dépendre de 'anonyme' ou de 'admin')

        if (role.translatable_name == this.role_anonymous.translatable_name) {
            role.parent_role_id = null;
        } else if (role.translatable_name == this.role_logged.translatable_name) {
            role.parent_role_id = this.role_anonymous.id;
        } else if (role.translatable_name == this.role_admin.translatable_name) {
            role.parent_role_id = this.role_logged.id;
        } else {
            if ((!role.parent_role_id) || (role.parent_role_id == this.role_anonymous.id) || (role.parent_role_id == this.role_admin.id)) {
                role.parent_role_id = this.role_logged.id;
            }
        }

        let roleFromBDD: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, "where translatable_name = $1", [role.translatable_name]);
        if (roleFromBDD) {
            this.registered_roles[translatable_name] = roleFromBDD;
            this.registered_roles_by_ids[roleFromBDD.id] = roleFromBDD;
            return roleFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(role);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error('Ajout de role échoué:' + role.translatable_name + ':');
            return null;
        }

        role.id = insertOrDeleteQueryResult.id;
        this.registered_roles[role.translatable_name] = role;
        this.registered_roles_by_ids[role.id] = role;
        ConsoleHandler.getInstance().error('Ajout du role OK:' + role.translatable_name + ':');
        return role;
    }

    /**
     * @param group Le group à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicyGroup(group: AccessPolicyGroupVO, default_translation: DefaultTranslation): Promise<AccessPolicyGroupVO> {
        if ((!group) || (!group.translatable_name)) {
            return null;
        }

        let translatable_name: string = group.translatable_name.toLowerCase();

        if (!this.registered_policy_groups) {
            this.registered_policy_groups = {};
        }

        if (this.registered_policy_groups[translatable_name]) {
            return this.registered_policy_groups[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = group.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        let groupFromBDD: AccessPolicyGroupVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyGroupVO>(AccessPolicyGroupVO.API_TYPE_ID, "where translatable_name = $1", [group.translatable_name]);
        if (groupFromBDD) {
            this.registered_policy_groups[translatable_name] = groupFromBDD;
            return groupFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(group);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error('Ajout de groupe échoué :' + group.translatable_name + ':');
            return null;
        }

        group.id = insertOrDeleteQueryResult.id;
        this.registered_policy_groups[translatable_name] = group;
        ConsoleHandler.getInstance().error('Ajout du groupe OK :' + group.translatable_name + ':');
        return group;
    }

    /**
     * @param policy La policy à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicy(policy: AccessPolicyVO, default_translation: DefaultTranslation, moduleVO: ModuleVO): Promise<AccessPolicyVO> {
        if ((!policy) || (!policy.translatable_name)) {
            return null;
        }

        let moduleVoID = moduleVO ? moduleVO.id : null;
        policy.module_id = moduleVoID;
        let translatable_name: string = policy.translatable_name.toLowerCase();

        if (!this.registered_policies) {
            this.registered_policies = {};
        }

        if (!this.registered_policies_by_ids) {
            this.registered_policies_by_ids = {};
        }

        if (this.registered_policies[translatable_name]) {
            return this.registered_policies[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = policy.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        let policyFromBDD: AccessPolicyVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID, "where translatable_name = $1", [policy.translatable_name]);
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
                let insertOrDeleteQueryResult_modif: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(policyFromBDD);
                if ((!insertOrDeleteQueryResult_modif) || (!insertOrDeleteQueryResult_modif.id)) {
                    ConsoleHandler.getInstance().error('Modification de droit échoué :' + policyFromBDD.translatable_name + ':');
                    return null;
                }
                ConsoleHandler.getInstance().error('Modification du droit :' + policyFromBDD.translatable_name + ': OK');
            }

            this.registered_policies[translatable_name] = policyFromBDD;
            this.registered_policies_by_ids[policyFromBDD.id] = policyFromBDD;
            return policyFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(policy);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error('Ajout de droit échoué :' + policy.translatable_name + ':');
            return null;
        }

        policy.id = insertOrDeleteQueryResult.id;
        this.registered_policies[translatable_name] = policy;
        this.registered_policies_by_ids[policy.id] = policy;
        ConsoleHandler.getInstance().error('Ajout du droit OK :' + policy.translatable_name + ':');
        return policy;
    }

    public async registerPolicyDependency(dependency: PolicyDependencyVO): Promise<PolicyDependencyVO> {

        if (!this.registered_dependencies) {
            this.registered_dependencies = {};
        }

        if (this.registered_dependencies[dependency.src_pol_id]) {

            for (let i in this.registered_dependencies[dependency.src_pol_id]) {
                if (this.registered_dependencies[dependency.src_pol_id][i].depends_on_pol_id == dependency.depends_on_pol_id) {
                    return this.registered_dependencies[dependency.src_pol_id][i];
                }
            }
        }

        if (!this.registered_dependencies[dependency.src_pol_id]) {
            this.registered_dependencies[dependency.src_pol_id] = [];
        }

        let dependencyFromBDD: PolicyDependencyVO = await ModuleDAOServer.getInstance().selectOne<PolicyDependencyVO>(PolicyDependencyVO.API_TYPE_ID, "where src_pol_id = $1 and depends_on_pol_id = $2", [dependency.src_pol_id, dependency.depends_on_pol_id]);
        if (dependencyFromBDD) {
            this.registered_dependencies[dependency.src_pol_id].push(dependencyFromBDD);
            return dependencyFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(dependency);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error('Ajout de dépendance échouée :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
            return null;
        }

        dependency.id = insertOrDeleteQueryResult.id;
        this.registered_dependencies[dependency.src_pol_id].push(dependency);
        ConsoleHandler.getInstance().error('Ajout de dépendance OK :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
        return dependency;
    }

    public get_registered_user_roles_by_uid(uid: number): RoleVO[] {
        return this.registered_users_roles[uid];
    }

    /**
     * Public pour faire des tests unitaires principalement.
     * @param bdd_user_roles Les roles tels qu'extraits de la bdd (donc potentiellement sans les héritages de rôles)
     * @param all_roles Tous les rôles possibles
     */
    public getUsersRoles(
        logged_in: boolean,
        uid: number,
        bdd_user_roles: RoleVO[] = this.registered_users_roles[uid],
        all_roles: { [role_id: number]: RoleVO } = this.registered_roles_by_ids): { [role_id: number]: RoleVO } {
        let res: { [role_id: number]: RoleVO } = {};

        if ((!logged_in) || (!all_roles)) {
            return {
                [this.role_anonymous.id]: this.role_anonymous
            };
        }

        // On ajoute le role connecté par défaut dans ce cas au cas où il serait pas en param
        let user_roles: RoleVO[] = [];

        for (let i in bdd_user_roles) {
            if (bdd_user_roles[i]) {
                user_roles.push(bdd_user_roles[i]);
            }
        }
        user_roles.push(this.role_logged);

        for (let i in user_roles) {
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

    public async getAccessMatrix(ignore_role: boolean = false): Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> {
        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return null;
        }

        let res: { [policy_id: number]: { [role_id: number]: boolean } } = {};

        // Pour toutes les policies et tous les rôles, on fait un checkaccess. C'est bourrin mais pas mieux en stock pour être sûr d'avoir le bon résultat
        for (let i in this.registered_policies) {
            let policy: AccessPolicyVO = this.registered_policies[i];

            if (!res[policy.id]) {
                res[policy.id] = {};
            }

            for (let j in this.registered_roles) {
                let role: RoleVO = this.registered_roles[j];

                // On ignore l'admin qui a accès à tout
                if (role.id == this.role_admin.id) {
                    continue;
                }

                res[policy.id][role.id] = this.checkAccessTo(
                    policy,
                    { [role.id]: role },
                    this.registered_roles_by_ids,
                    this.registered_roles_policies,
                    this.registered_policies_by_ids,
                    this.registered_dependencies,
                    ignore_role ? role : null,
                    true);
            }
        }

        return res;
    }

    /**
     * Public pour faire des tests unitaires principalement.
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
    public checkAccessTo(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO } = this.registered_roles_by_ids,
        role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = this.registered_roles_policies,
        policies: { [policy_id: number]: AccessPolicyVO } = this.registered_policies_by_ids,
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = this.registered_dependencies,
        ignore_role_policy: RoleVO = null,
        is_recur_test_call: boolean = false): boolean {

        if ((!target_policy) || (!user_roles) || (!all_roles)) {
            if (!is_recur_test_call) {
                ConsoleHandler.getInstance().warn('checkAccessTo:!target_policy');
            }
            return false;
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
        let user_roles_and_inherited: { [role_id: number]: RoleVO } = {};
        for (let i in user_roles) {
            let role: RoleVO = user_roles[i];

            while (!!role) {
                if (!user_roles_and_inherited[role.id]) {
                    user_roles_and_inherited[role.id] = role;
                }

                role = (role.parent_role_id && all_roles[role.parent_role_id]) ? all_roles[role.parent_role_id] : null;
            }
        }

        for (let i in user_roles_and_inherited) {
            let user_role: RoleVO = user_roles_and_inherited[i];


            let is_ignored_role: boolean = false;
            if (ignore_role_policy && (ignore_role_policy.id == user_role.id)) {
                is_ignored_role = true;
            }

            // Cas 0
            if (user_role.id == this.role_admin.id) {
                return true;
            }

            if (!this.hasCleanDependencies(
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
                        if (user_role.id != this.role_anonymous.id) {
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

                for (let j in policies_dependencies[target_policy.id]) {
                    let dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

                    if (dependency.default_behaviour != PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED) {
                        continue;
                    }

                    if (this.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies, null, true)) {
                        return true;
                    }
                }
            }
        }

        if (!is_recur_test_call) {
            ConsoleHandler.getInstance().warn('checkAccessTo:refused:' +
                'target_policy:' + (target_policy ? target_policy.translatable_name : 'N/A') + ':' +
                'uid:' + StackContext.getInstance().get('UID') + ':' +
                'user_roles:' + (user_roles ? Object.values(user_roles).map(function (role) { return role.translatable_name; }).join(',') : 'N/A') + ':' +
                'all_roles:' + (all_roles ? 'LOADED' : 'N/A') + ':' +
                'role_policies:' + (role_policies ? 'LOADED' : 'N/A') + ':' +
                'policies:' + (policies ? 'LOADED' : 'N/A') + ':' +
                'policies_dependencies:' + (policies_dependencies ? 'LOADED' : 'N/A') + ':' +
                'ignore_role_policy:' + JSON.stringify(ignore_role_policy) + ':'
            );

            // On ajoute la session au bgthread d'invalidation si on a un sid
            let session: IServerUserSession = StackContext.getInstance().get('SESSION');
            if (session && session.sid) {
                ForkedTasksController.getInstance().exec_self_on_bgthread(
                    AccessPolicyDeleteSessionBGThread.getInstance().name,
                    AccessPolicyDeleteSessionBGThread.TASK_NAME_set_session_to_delete_by_sids,
                    session
                ).then().catch((error) => ConsoleHandler.getInstance().error(error));
            }
        }
        return false;
    }

    private hasCleanDependencies(
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

        for (let j in policies_dependencies[target_policy.id]) {
            let dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

            if ((dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED) && (!this.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies, null, is_recur_test_call))) {
                return false;
            }
        }

        return true;
    }
}
import ModuleServerBase from '../ModuleServerBase';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import GetAPIDefinition from '../../../shared/modules/API/vos/GetAPIDefinition';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import UserRolesVO from '../../../shared/modules/AccessPolicy/vos/UserRolesVO';
import RolePoliciesVO from '../../../shared/modules/AccessPolicy/vos/RolePoliciesVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import CheckAccessParamVO from '../../../shared/modules/AccessPolicy/vos/apis/CheckAccessParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import AddDefaultRolePolicyIfNotExistsParamVO from '../../../shared/modules/AccessPolicy/vos/apis/AddDefaultRolePolicyIfNotExistsParamVO';
import AddRoleToUserParamVO from '../../../shared/modules/AccessPolicy/vos/apis/AddRoleToUserParamVO';
import PostAPIDefinition from '../../../shared/modules/API/vos/PostAPIDefinition';
import AccessPolicyCronWorkersHandler from './AccessPolicyCronWorkersHandler';
import PasswordRecovery from './PasswordRecovery/PasswordRecovery';
import ResetPwdParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ResetPwdParamVO';
import PasswordReset from './PasswordReset/PasswordReset';
import ServerBase from '../../ServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import RegisterModuleAccessPolicyParamVO from '../../../shared/modules/AccessPolicy/vos/apis/RegisterModuleAccessPolicyParamVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAccessPolicyServer.instance) {
            ModuleAccessPolicyServer.instance = new ModuleAccessPolicyServer();
        }
        return ModuleAccessPolicyServer.instance;
    }

    private static instance: ModuleAccessPolicyServer = null;

    public role_anonymous: RoleVO = null;
    public role_logged: RoleVO = null;
    public role_admin: RoleVO = null;

    // TODO maj de ces datas avec triggers sur les données concernées
    public registered_roles: { [role_name: string]: RoleVO };
    public registered_policy_groups: { [group_name: string]: AccessPolicyGroupVO };
    public registered_policies: { [policy_name: string]: AccessPolicyVO };
    public registered_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] };

    // TODO maj de ces datas avec triggers sur les données concernées
    public registered_roles_by_ids: { [role_id: number]: RoleVO };
    public registered_users_roles: { [uid: number]: RoleVO[] };
    public registered_roles_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } };
    public registered_policies_by_ids: { [policy_id: number]: AccessPolicyVO };

    private debug_check_access: boolean = false;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    /**
     * Call @ server startup to preload all access right configuration
     */
    public async preload_access_rights() {
        // On preload ce qui l'a pas été et on complète les listes avec les données en base qui peuvent
        //  avoir été ajoutée en parralèle des déclarations dans le source
        await this.preload_registered_roles();
        await this.preload_registered_policies();
        await this.preload_registered_policy_groups();
        await this.preload_registered_dependencies();

        await this.preload_registered_users_roles();
        await this.preload_registered_roles_policies();
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAccessPolicy.POLICY_GROUP;
        await this.registerPolicyGroup(group);

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAccessPolicy.POLICY_BO_ACCESS;
        await this.registerPolicy(bo_access);

        let rights_managment_tool_access: AccessPolicyVO = new AccessPolicyVO();
        rights_managment_tool_access.group_id = group.id;
        rights_managment_tool_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        rights_managment_tool_access.translatable_name = ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_TOOL_ACCESS;
        await this.registerPolicy(rights_managment_tool_access);
        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = rights_managment_tool_access.id;
        dependency.depends_on_pol_id = bo_access.id;
        await this.registerPolicyDependency(dependency);
    }

    /**
     * On définit les 3 rôles principaux et fondamentaux dans tous les projets : Anonyme, connecté et admin
     * Les héritages sont gérés directement dans la fonction register_role pour ces rôles de base
     */
    public async registerAccessRoles(): Promise<void> {
        this.role_anonymous = new RoleVO();
        this.role_anonymous.translatable_name = ModuleAccessPolicy.ROLE_ANONYMOUS;
        await this.registerRole(this.role_anonymous);

        this.role_logged = new RoleVO();
        this.role_logged.translatable_name = ModuleAccessPolicy.ROLE_LOGGED;
        await this.registerRole(this.role_logged);

        this.role_admin = new RoleVO();
        this.role_admin.translatable_name = ModuleAccessPolicy.ROLE_ADMIN;
        await this.registerRole(this.role_admin);
    }

    public registerCrons(): void {
        AccessPolicyCronWorkersHandler.getInstance();
    }

    public async configure() {

        // On ajoute un trigger pour la création du compte
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOCreate.bind(this));

        // On ajoute un trigger pour la modification du mot de passe
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOUpdate.bind(this));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_CHECK_ACCESS, this.checkAccess.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ADMIN, this.isAdmin.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ROLE, this.isRole.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_MY_ROLES, this.getMyRoles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER, this.addRoleToUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, this.beginRecover.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWD, this.resetPwd.bind(this));
    }

    public async registerRole(role: RoleVO) {
        if ((!role) || (!role.translatable_name)) {
            return;
        }

        if (!this.registered_roles) {
            this.registered_roles = {};
        }

        if (this.registered_roles[role.translatable_name]) {
            return;
        }

        // Un nouveau rôle a forcément un parent :
        //  - si c'est le rôle 'identifié', son parent est le rôle 'anonyme'
        //  - si c'est le rôle 'anonyme', il n'a pas de parent (c'est le seul)
        //  - si c'est le rôle 'admin', son parent est 'identifié'
        //  - pour tout autre rôle, son parent est soit 'identifié' soit un autre rôle ajouté (ne peut dépendre de 'anonyme' ou de 'admin')

        if (role == this.role_anonymous) {
            role.parent_role_id = null;
        } else if (role == this.role_logged) {
            role.parent_role_id = this.role_anonymous.id;
        } else if (role == this.role_admin) {
            role.parent_role_id = this.role_logged.id;
        } else {
            if ((!role.parent_role_id) || (role.parent_role_id == this.role_anonymous.id) || (role.parent_role_id == this.role_admin.id)) {
                role.parent_role_id = this.role_logged.id;
            }
        }

        let roleFromBDD: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, "where translatable_name = $1", [role.translatable_name]);
        if (roleFromBDD) {
            this.registered_roles[role.translatable_name] = roleFromBDD;
            this.registered_roles_by_ids[roleFromBDD.id] = roleFromBDD;
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(role);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de role échoué:' + role.translatable_name + ':');
            return;
        }

        role.id = parseInt(insertOrDeleteQueryResult.id);
        this.registered_roles[role.translatable_name] = role;
        this.registered_roles_by_ids[role.id] = role;
        console.error('Ajout du role OK:' + role.translatable_name + ':');
    }

    public async registerPolicyGroup(group: AccessPolicyGroupVO) {
        if ((!group) || (!group.translatable_name)) {
            return;
        }

        if (!this.registered_policy_groups) {
            this.registered_policy_groups = {};
        }

        if (this.registered_policy_groups[group.translatable_name]) {
            return;
        }

        let groupFromBDD: AccessPolicyGroupVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyGroupVO>(AccessPolicyGroupVO.API_TYPE_ID, "where translatable_name = $1", [group.translatable_name]);
        if (groupFromBDD) {
            this.registered_policy_groups[group.translatable_name] = groupFromBDD;
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(group);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de role échoué:' + group.translatable_name + ':');
            return;
        }

        group.id = parseInt(insertOrDeleteQueryResult.id);
        this.registered_policy_groups[group.translatable_name] = group;
        console.error('Ajout du group OK:' + group.translatable_name + ':');
    }

    public async registerPolicy(policy: AccessPolicyVO) {
        if ((!policy) || (!policy.translatable_name)) {
            return;
        }

        if (!this.registered_policies) {
            this.registered_policies = {};
        }

        if (this.registered_policies[policy.translatable_name]) {
            return;
        }

        let policyFromBDD: AccessPolicyVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID, "where translatable_name = $1", [policy.translatable_name]);
        if (policyFromBDD) {
            this.registered_policies[policy.translatable_name] = policyFromBDD;
            this.registered_policies_by_ids[policyFromBDD.id] = policyFromBDD;
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(policy);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de droit échoué:' + policy.translatable_name + ':');
            return;
        }

        policy.id = parseInt(insertOrDeleteQueryResult.id);
        this.registered_policies[policy.translatable_name] = policy;
        this.registered_policies_by_ids[policy.id] = policy;
        console.error('Ajout du droit OK:' + policy.translatable_name + ':');
    }

    public async registerPolicyDependency(dependency: PolicyDependencyVO) {
        if ((!dependency) || (!dependency.src_pol_id) || (!dependency.depends_on_pol_id)) {
            return;
        }

        if (!this.registered_dependencies) {
            this.registered_dependencies = {};
        }

        if (this.registered_dependencies[dependency.src_pol_id]) {

            for (let i in this.registered_dependencies[dependency.src_pol_id]) {
                if (this.registered_dependencies[dependency.src_pol_id][i].depends_on_pol_id == dependency.depends_on_pol_id) {
                    return;
                }
            }
        }

        if (!this.registered_dependencies[dependency.src_pol_id]) {
            this.registered_dependencies[dependency.src_pol_id] = [];
        }

        let dependencyFromBDD: PolicyDependencyVO = await ModuleDAOServer.getInstance().selectOne<PolicyDependencyVO>(PolicyDependencyVO.API_TYPE_ID, "where src_pol_id = $1 and depends_on_pol_id = $2", [dependency.src_pol_id, dependency.depends_on_pol_id]);
        if (dependencyFromBDD) {
            this.registered_dependencies[dependency.src_pol_id].push(dependencyFromBDD);
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(dependency);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de droit échoué:' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
            return;
        }

        dependency.id = parseInt(insertOrDeleteQueryResult.id);
        this.registered_dependencies[dependency.src_pol_id].push(dependency);
        console.error('Ajout du droit OK:' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
    }

    /**
     * Public pour faire des tests unitaires principalement.
     * @param bdd_user_roles Les roles tels qu'extraits de la bdd (donc potentiellement sans les héritages de rôles)
     * @param all_roles Tous les rôles possibles
     */
    public getUsersRoles(
        logged_in: boolean,
        bdd_user_roles: RoleVO[],
        all_roles: { [role_id: number]: RoleVO }): { [role_id: number]: RoleVO } {
        let res: { [role_id: number]: RoleVO } = {};

        if (!logged_in) {
            return {
                [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
            };
        }

        // On ajoute le role connecté par défaut dans ce cas au cas où il serait pas en param
        bdd_user_roles.push(ModuleAccessPolicyServer.getInstance().role_logged);

        for (let i in bdd_user_roles) {
            let role: RoleVO = bdd_user_roles[i];

            while (role && role.translatable_name) {

                if (!res[role.id]) {
                    res[role.id] = role;
                }
                role = role.parent_role_id ? all_roles[role.parent_role_id] : null;
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
     */
    public checkAccessTo(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO },
        role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } },
        policies: { [policy_id: number]: AccessPolicyVO },
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] }): boolean {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!target_policy) || (!user_roles)) {
            return false;
        }

        /**
         * Les règles de résolution d'un accès :
         *  - Si un de mes rôle me donne accès, j'ai accès
         *  - On doit éliminer les rôles un par un en cherchant à autoriser l'accès. Par défaut on refusera l'accès
         *  - Pour chaque rôle, et chaque rôle hérité :
         *      - Cas 1 : Si j'ai explicitement un paramétrage pour ce droit sur ce rôle :
         *          - Si accès granted : return true;
         *          - Si accès denied : on ne peut pas avoir accès avec ce rôle, on passe au suivant.
         *      - Cas 2 : Sinon : Je peux vérifier que le droit lui-même me donne pas accès par défaut, suivant son comportement et le rôle que je suis entrain de tester.
         *      - Cas 3 : Sinon : Je peux tester une dépendance de droit sur ce droit, qui serait par défaut en Access granted
         *          - Si cette dépendance existe, je peux retester sur le droit dépendant (et donc si checkAccess de ce droit, alors return true)
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

            // Cas 1
            if (role_policies[user_role.id] && role_policies[user_role.id][target_policy.id]) {
                if (role_policies[user_role.id][target_policy.id].granted) {
                    return true;
                }
                continue;
            }

            // Cas 2
            if (policies[target_policy.id]) {
                switch (policies[target_policy.id].default_behaviour) {
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE:
                        return true;
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS:
                        if (user_role.id != this.role_anonymous.id) {
                            return true;
                        }
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN:
                        if (user_role.id == this.role_admin.id) {
                            return true;
                        }
                    default:
                }
            }

            // Cas 3
            if (policies_dependencies[target_policy.id] && policies_dependencies[target_policy.id].length) {

                for (let j in policies_dependencies[target_policy.id]) {
                    let dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

                    if (dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED) {
                        if (this.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    private async getMyRoles(): Promise<RoleVO[]> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return null;
        }

        return await ModuleDAOServer.getInstance().selectAll<RoleVO>(
            RoleVO.API_TYPE_ID,
            " join " + VOsTypesManager.getInstance().moduleTables_by_voType[UserRolesVO.API_TYPE_ID].full_name + " ur on ur.role_id = t.id " +
            " where ur.user_id = $1",
            [uid],
            [UserRolesVO.API_TYPE_ID, UserVO.API_TYPE_ID]);
    }

    /**
     * @deprecated Why use this function, seems like a bad idea, just checkAccess directly there shall be no need for this one. Delete ASAP
     */
    private async isRole(param: StringParamVO): Promise<boolean> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return false;
        }

        let userRoles: UserRolesVO = await ModuleDAOServer.getInstance().selectOne<UserRolesVO>(
            UserRolesVO.API_TYPE_ID,
            " join " + VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID].full_name + " r on r.id = t.role_id " +
            " where t.user_id = $1 and r.translatable_name = $2",
            [uid, param.text],
            [UserVO.API_TYPE_ID, RoleVO.API_TYPE_ID]);

        if (userRoles) {
            return true;
        }

        return false;
    }

    private async isAdmin(): Promise<boolean> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return false;
        }

        let userRoles: UserRolesVO = await ModuleDAOServer.getInstance().selectOne<UserRolesVO>(
            UserRolesVO.API_TYPE_ID,
            " join " + VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID].full_name + " r on r.id = t.role_id " +
            " where t.user_id = $1 and r.translatable_name = $2",
            [uid, ModuleAccessPolicy.ROLE_ADMIN],
            [UserVO.API_TYPE_ID, RoleVO.API_TYPE_ID]);

        if (userRoles) {
            return true;
        }

        return false;
    }

    private consoledebug(msg: string) {
        if (this.debug_check_access) {
            console.log(msg);
        }
    }

    private async checkAccess(checkAccessParam: StringParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!checkAccessParam) || (!checkAccessParam.text)) {
            return false;
        }

        let policy_name: string = checkAccessParam.text;

        // this.consoledebug("CHECKACCESS:" + policy_name + ":");

        // Un admin a accès à tout dans tous les cas
        if (await this.isAdmin()) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":TRUE:IS_ADMIN");
            return true;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":TRUE:IS_SERVER");
            return true;
        }

        let target_policy: AccessPolicyVO = this.registered_policies[policy_name];
        if (!target_policy) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":FALSE:policy_name:Introuvable");
            return false;
        }

        let uid: number = httpContext.get('UID');
        if (!uid) {
            // profil anonyme
            return this.checkAccessTo(
                target_policy,
                this.getUsersRoles(false, null, this.registered_roles_by_ids),
                this.registered_roles_by_ids,
                this.registered_roles_policies,
                this.registered_policies_by_ids,
                this.registered_dependencies);
        }

        return this.checkAccessTo(
            target_policy,
            this.getUsersRoles(true, this.registered_users_roles[uid], this.registered_roles_by_ids),
            this.registered_roles_by_ids,
            this.registered_roles_policies,
            this.registered_policies_by_ids,
            this.registered_dependencies);
    }

    private async addRoleToUser(params: AddRoleToUserParamVO): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params) || (!params.user_id) || (!params.role_id)) {
            return;
        }

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_TOOL_ACCESS)) {
            return;
        }

        let userRole: UserRolesVO = await ModuleDAOServer.getInstance().selectOne<UserRolesVO>(UserRolesVO.API_TYPE_ID, " WHERE t.user_id = $1 and t.role_id = $2", [params.user_id, params.role_id]);

        if (!userRole) {
            userRole = new UserRolesVO();
            userRole.role_id = params.role_id;
            userRole.user_id = params.user_id;
            await ModuleDAO.getInstance().insertOrUpdateVO(userRole);
        }
    }

    private async beginRecover(param: StringParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!param.text)) {
            return false;
        }

        return PasswordRecovery.getInstance().beginRecovery(param.text);
    }

    private async resetPwd(params: ResetPwdParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwd(params.email, params.challenge, params.new_pwd1);
    }

    private async handleTriggerUserVOUpdate(vo: UserVO): Promise<boolean> {


        if ((!vo) || (!vo.password) || (!vo.id)) {
            return true;
        }

        let user: UserVO = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, vo.id);

        if ((!user) || (user.password == vo.password)) {
            return true;
        }

        await ModuleAccessPolicy.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo, vo.password);

        return true;
    }

    private async handleTriggerUserVOCreate(vo: UserVO): Promise<boolean> {


        if ((!vo) || (!vo.password)) {
            return true;
        }

        await ModuleAccessPolicy.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo, vo.password);

        return true;
    }

    private async preload_registered_roles_policies() {
        this.registered_roles_policies = {};

        let rolesPolicies: RolePoliciesVO[] = await ModuleDAO.getInstance().getVos<RolePoliciesVO>(RolePoliciesVO.API_TYPE_ID);
        for (let i in rolesPolicies) {
            let rolePolicy: RolePoliciesVO = rolesPolicies[i];

            if (!this.registered_roles_policies[rolePolicy.role_id]) {
                this.registered_roles_policies[rolePolicy.role_id] = [];
            }

            this.registered_roles_policies[rolePolicy.role_id][rolePolicy.accpol_id] = rolePolicy;
        }
    }

    private async preload_registered_users_roles() {
        this.registered_users_roles = {};

        let usersRoles: UserRolesVO[] = await ModuleDAO.getInstance().getVos<UserRolesVO>(UserRolesVO.API_TYPE_ID);
        for (let i in usersRoles) {
            let userRole: UserRolesVO = usersRoles[i];

            if (!this.registered_users_roles[userRole.user_id]) {
                this.registered_users_roles[userRole.user_id] = [];
            }

            this.registered_users_roles[userRole.user_id].push(this.registered_roles[userRole.role_id]);
        }
    }

    private async preload_registered_roles() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.registered_roles = {};
        this.registered_roles_by_ids = {};

        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);
        this.registered_roles_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(roles);
        for (let i in roles) {
            let role: RoleVO = roles[i];

            this.registered_roles[role.translatable_name] = role;
        }
    }

    private async preload_registered_policies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.registered_policies = {};
        this.registered_policies_by_ids = {};

        let policies: AccessPolicyVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID);
        this.registered_policies_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(policies);
        for (let i in policies) {
            let policy: AccessPolicyVO = policies[i];

            this.registered_policies[policy.translatable_name] = policy;
        }
    }

    private async preload_registered_policy_groups() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        this.registered_policy_groups = {};

        let policy_groups: AccessPolicyGroupVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyGroupVO>(AccessPolicyGroupVO.API_TYPE_ID);
        for (let i in policy_groups) {
            let policy_group: AccessPolicyGroupVO = policy_groups[i];

            this.registered_policy_groups[policy_group.translatable_name] = policy_group;
        }
    }

    private async preload_registered_dependencies() {
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
}
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import AddRoleToUserParamVO from '../../../shared/modules/AccessPolicy/vos/apis/AddRoleToUserParamVO';
import ResetPwdParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ResetPwdParamVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ServerBase from '../../ServerBase';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import AccessPolicyCronWorkersHandler from './AccessPolicyCronWorkersHandler';
import PasswordRecovery from './PasswordRecovery/PasswordRecovery';
import PasswordReset from './PasswordReset/PasswordReset';
import ToggleAccessParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ToggleAccessParamVO';
import BooleanParamVO from '../../../shared/modules/API/vos/apis/BooleanParamVO';
import AccessPolicyServerController from './AccessPolicyServerController';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAccessPolicyServer.instance) {
            ModuleAccessPolicyServer.instance = new ModuleAccessPolicyServer();
        }
        return ModuleAccessPolicyServer.instance;
    }

    private static instance: ModuleAccessPolicyServer = null;

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
        group = await this.registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Droits d\'administration principaux'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAccessPolicy.POLICY_BO_ACCESS;
        bo_access = await this.registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Accès à l\'administration'
        }));

        let modules_managment_access: AccessPolicyVO = new AccessPolicyVO();
        modules_managment_access.group_id = group.id;
        modules_managment_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        modules_managment_access.translatable_name = ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;
        modules_managment_access = await this.registerPolicy(modules_managment_access, new DefaultTranslation({
            fr: 'Gestion des modules'
        }));
        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = modules_managment_access.id;
        dependency.depends_on_pol_id = bo_access.id;
        dependency = await this.registerPolicyDependency(dependency);

        let rights_managment_access: AccessPolicyVO = new AccessPolicyVO();
        rights_managment_access.group_id = group.id;
        rights_managment_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        rights_managment_access.translatable_name = ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS;
        rights_managment_access = await this.registerPolicy(rights_managment_access, new DefaultTranslation({
            fr: 'Gestion des droits'
        }));
        dependency = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = rights_managment_access.id;
        dependency.depends_on_pol_id = bo_access.id;
        dependency = await this.registerPolicyDependency(dependency);

        let users_list_access: AccessPolicyVO = new AccessPolicyVO();
        users_list_access.group_id = group.id;
        users_list_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        users_list_access.translatable_name = ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS;
        users_list_access = await this.registerPolicy(users_list_access, new DefaultTranslation({
            fr: 'Liste des utilisateurs'
        }));
        dependency = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = users_list_access.id;
        dependency.depends_on_pol_id = bo_access.id;
        dependency = await this.registerPolicyDependency(dependency);

        let users_managment_access: AccessPolicyVO = new AccessPolicyVO();
        users_managment_access.group_id = group.id;
        users_managment_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        users_managment_access.translatable_name = ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS;
        users_managment_access = await this.registerPolicy(users_managment_access, new DefaultTranslation({
            fr: 'Gestion des utilisateurs'
        }));
        dependency = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = users_managment_access.id;
        dependency.depends_on_pol_id = bo_access.id;
        dependency = await this.registerPolicyDependency(dependency);
        dependency = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = users_managment_access.id;
        dependency.depends_on_pol_id = users_list_access.id;
        dependency = await this.registerPolicyDependency(dependency);
    }

    /**
     * On définit les 3 rôles principaux et fondamentaux dans tous les projets : Anonyme, connecté et admin
     * Les héritages sont gérés directement dans la fonction register_role pour ces rôles de base
     */
    public async registerAccessRoles(): Promise<void> {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = ModuleAccessPolicy.ROLE_ANONYMOUS;
        AccessPolicyServerController.getInstance().role_anonymous = await this.registerRole(AccessPolicyServerController.getInstance().role_anonymous, new DefaultTranslation({
            fr: 'Utilisateur anonyme'
        }));

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.translatable_name = ModuleAccessPolicy.ROLE_LOGGED;
        AccessPolicyServerController.getInstance().role_logged = await this.registerRole(AccessPolicyServerController.getInstance().role_logged, new DefaultTranslation({
            fr: 'Utilisateur connecté'
        }));

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.translatable_name = ModuleAccessPolicy.ROLE_ADMIN;
        AccessPolicyServerController.getInstance().role_admin = await this.registerRole(AccessPolicyServerController.getInstance().role_admin, new DefaultTranslation({
            fr: 'Administrateur'
        }));
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

        // On veut aussi des triggers pour tenir à jour les datas pre loadés des droits, comme ça si une mise à jour,
        //  ajout ou suppression on en prend compte immédiatement
        let postCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let preDeleteTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onCreateAccessPolicyVO.bind(this));
        postCreateTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onCreatePolicyDependencyVO.bind(this));
        postCreateTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onCreateRolePolicyVO.bind(this));
        postCreateTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onCreateRoleVO.bind(this));
        postCreateTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onCreateUserRoleVO.bind(this));

        postUpdateTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onUpdateAccessPolicyVO.bind(this));
        postUpdateTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onUpdatePolicyDependencyVO.bind(this));
        postUpdateTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onUpdateRolePolicyVO.bind(this));
        postUpdateTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onUpdateRoleVO.bind(this));
        postUpdateTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onUpdateUserRoleVO.bind(this));

        preDeleteTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onDeleteAccessPolicyVO.bind(this));
        preDeleteTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onDeletePolicyDependencyVO.bind(this));
        preDeleteTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onDeleteRolePolicyVO.bind(this));
        preDeleteTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onDeleteRoleVO.bind(this));
        preDeleteTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onDeleteUserRoleVO.bind(this));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_CHECK_ACCESS, this.checkAccess.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ADMIN, this.isAdmin.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ROLE, this.isRole.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_MY_ROLES, this.getMyRoles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER, this.addRoleToUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, this.beginRecover.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWD, this.resetPwd.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX, this.getAccessMatrix.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_TOGGLE_ACCESS, this.togglePolicy.bind(this));
    }

    /**
     * @param role Le rôle à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerRole(role: RoleVO, default_translation: DefaultTranslation): Promise<RoleVO> {
        if ((!role) || (!role.translatable_name) || (!default_translation)) {
            return null;
        }

        if (!AccessPolicyServerController.getInstance().registered_roles) {
            AccessPolicyServerController.getInstance().registered_roles = {};
        }
        if (!AccessPolicyServerController.getInstance().registered_roles_by_ids) {
            AccessPolicyServerController.getInstance().registered_roles_by_ids = {};
        }

        if (AccessPolicyServerController.getInstance().registered_roles[role.translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_roles[role.translatable_name];
        }

        default_translation.code_text = role.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);

        // Un nouveau rôle a forcément un parent :
        //  - si c'est le rôle 'identifié', son parent est le rôle 'anonyme'
        //  - si c'est le rôle 'anonyme', il n'a pas de parent (c'est le seul)
        //  - si c'est le rôle 'admin', son parent est 'identifié'
        //  - pour tout autre rôle, son parent est soit 'identifié' soit un autre rôle ajouté (ne peut dépendre de 'anonyme' ou de 'admin')

        if (role.translatable_name == AccessPolicyServerController.getInstance().role_anonymous.translatable_name) {
            role.parent_role_id = null;
        } else if (role.translatable_name == AccessPolicyServerController.getInstance().role_logged.translatable_name) {
            role.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        } else if (role.translatable_name == AccessPolicyServerController.getInstance().role_admin.translatable_name) {
            role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        } else {
            if ((!role.parent_role_id) || (role.parent_role_id == AccessPolicyServerController.getInstance().role_anonymous.id) || (role.parent_role_id == AccessPolicyServerController.getInstance().role_admin.id)) {
                role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
            }
        }

        let roleFromBDD: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, "where translatable_name = $1", [role.translatable_name]);
        if (roleFromBDD) {
            AccessPolicyServerController.getInstance().registered_roles[role.translatable_name] = roleFromBDD;
            AccessPolicyServerController.getInstance().registered_roles_by_ids[roleFromBDD.id] = roleFromBDD;
            return roleFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(role);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de role échoué:' + role.translatable_name + ':');
            return null;
        }

        role.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_roles[role.translatable_name] = role;
        AccessPolicyServerController.getInstance().registered_roles_by_ids[role.id] = role;
        console.error('Ajout du role OK:' + role.translatable_name + ':');
        return role;
    }

    /**
     * @param group Le group à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicyGroup(group: AccessPolicyGroupVO, default_translation: DefaultTranslation): Promise<AccessPolicyGroupVO> {
        if ((!group) || (!group.translatable_name) || (!default_translation)) {
            return null;
        }

        if (!AccessPolicyServerController.getInstance().registered_policy_groups) {
            AccessPolicyServerController.getInstance().registered_policy_groups = {};
        }

        if (AccessPolicyServerController.getInstance().registered_policy_groups[group.translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_policy_groups[group.translatable_name];
        }

        default_translation.code_text = group.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);

        let groupFromBDD: AccessPolicyGroupVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyGroupVO>(AccessPolicyGroupVO.API_TYPE_ID, "where translatable_name = $1", [group.translatable_name]);
        if (groupFromBDD) {
            AccessPolicyServerController.getInstance().registered_policy_groups[group.translatable_name] = groupFromBDD;
            return groupFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(group);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de groupe échoué :' + group.translatable_name + ':');
            return null;
        }

        group.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_policy_groups[group.translatable_name] = group;
        console.error('Ajout du groupe OK :' + group.translatable_name + ':');
        return group;
    }

    /**
     * @param policy La policy à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicy(policy: AccessPolicyVO, default_translation: DefaultTranslation): Promise<AccessPolicyVO> {
        if ((!policy) || (!policy.translatable_name) || (!default_translation)) {
            return null;
        }

        if (!AccessPolicyServerController.getInstance().registered_policies) {
            AccessPolicyServerController.getInstance().registered_policies = {};
        }

        if (!AccessPolicyServerController.getInstance().registered_policies_by_ids) {
            AccessPolicyServerController.getInstance().registered_policies_by_ids = {};
        }

        if (AccessPolicyServerController.getInstance().registered_policies[policy.translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_policies[policy.translatable_name];
        }

        default_translation.code_text = policy.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);

        let policyFromBDD: AccessPolicyVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID, "where translatable_name = $1", [policy.translatable_name]);
        if (policyFromBDD) {
            AccessPolicyServerController.getInstance().registered_policies[policy.translatable_name] = policyFromBDD;
            AccessPolicyServerController.getInstance().registered_policies_by_ids[policyFromBDD.id] = policyFromBDD;
            return policyFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(policy);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de droit échoué :' + policy.translatable_name + ':');
            return null;
        }

        policy.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_policies[policy.translatable_name] = policy;
        AccessPolicyServerController.getInstance().registered_policies_by_ids[policy.id] = policy;
        console.error('Ajout du droit OK :' + policy.translatable_name + ':');
        return policy;
    }


    public async registerPolicyDependency(dependency: PolicyDependencyVO): Promise<PolicyDependencyVO> {
        if ((!dependency) || (!dependency.src_pol_id) || (!dependency.depends_on_pol_id)) {
            return null;
        }

        if (!AccessPolicyServerController.getInstance().registered_dependencies) {
            AccessPolicyServerController.getInstance().registered_dependencies = {};
        }

        if (AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id]) {

            for (let i in AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id]) {
                if (AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id][i].depends_on_pol_id == dependency.depends_on_pol_id) {
                    return AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id][i];
                }
            }
        }

        if (!AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id]) {
            AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id] = [];
        }

        let dependencyFromBDD: PolicyDependencyVO = await ModuleDAOServer.getInstance().selectOne<PolicyDependencyVO>(PolicyDependencyVO.API_TYPE_ID, "where src_pol_id = $1 and depends_on_pol_id = $2", [dependency.src_pol_id, dependency.depends_on_pol_id]);
        if (dependencyFromBDD) {
            AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id].push(dependencyFromBDD);
            return dependencyFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(dependency);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de dépendance échouée :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
            return null;
        }

        dependency.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id].push(dependency);
        console.error('Ajout de dépendance OK :' + dependency.src_pol_id + ':' + dependency.depends_on_pol_id + ":");
        return dependency;
    }

    private async togglePolicy(params: ToggleAccessParamVO): Promise<boolean> {
        if ((!params.policy_id) || (!params.role_id)) {
            return false;
        }

        if (!ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return false;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().registered_policies_by_ids[params.policy_id];
        let role: RoleVO = AccessPolicyServerController.getInstance().registered_roles_by_ids[params.role_id];
        if (AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            { [role.id]: role },
            AccessPolicyServerController.getInstance().registered_roles_by_ids,
            AccessPolicyServerController.getInstance().registered_roles_policies,
            AccessPolicyServerController.getInstance().registered_policies_by_ids,
            AccessPolicyServerController.getInstance().registered_dependencies,
            role)) {
            // On devrait pas pouvoir arriver là avec un héritage true
            return false;
        }

        // Il faut qu'on sache si il existe une policy explicit à cet endroit
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult;
        let role_policy: RolePolicyVO = AccessPolicyServerController.getInstance().registered_roles_policies[role.id] ? AccessPolicyServerController.getInstance().registered_roles_policies[role.id][target_policy.id] : null;
        if (role_policy) {

            // Si oui on la supprime
            let insertOrDeleteQueryResults: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([role_policy]);
            if ((!insertOrDeleteQueryResults) || (!insertOrDeleteQueryResults.length)) {
                return false;
            }

            return true;
        }
        role_policy = new RolePolicyVO();
        role_policy.accpol_id = target_policy.id;
        role_policy.granted = true;
        role_policy.role_id = role.id;

        insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(role_policy);
        if ((!insertOrDeleteQueryResult) || (!parseInt(insertOrDeleteQueryResult.id))) {
            return false;
        }

        return true;
    }

    private async getAccessMatrix(param: BooleanParamVO): Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> {
        if (!ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return null;
        }

        let res: { [policy_id: number]: { [role_id: number]: boolean } } = {};

        // Pour toutes les policies et tous les rôles, on fait un checkaccess. C'est bourrin mais pas mieux en stock pour être sûr d'avoir le bon résultat
        for (let i in AccessPolicyServerController.getInstance().registered_policies) {
            let policy: AccessPolicyVO = AccessPolicyServerController.getInstance().registered_policies[i];

            if (!res[policy.id]) {
                res[policy.id] = {};
            }

            for (let j in AccessPolicyServerController.getInstance().registered_roles) {
                let role: RoleVO = AccessPolicyServerController.getInstance().registered_roles[j];

                // On ignore l'admin qui a accès à tout
                if (role.id == AccessPolicyServerController.getInstance().role_admin.id) {
                    continue;
                }

                res[policy.id][role.id] = AccessPolicyServerController.getInstance().checkAccessTo(
                    policy,
                    { [role.id]: role },
                    AccessPolicyServerController.getInstance().registered_roles_by_ids,
                    AccessPolicyServerController.getInstance().registered_roles_policies,
                    AccessPolicyServerController.getInstance().registered_policies_by_ids,
                    AccessPolicyServerController.getInstance().registered_dependencies,
                    param.value ? role : null);
            }
        }

        return res;
    }

    private async getMyRoles(): Promise<RoleVO[]> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return null;
        }

        return await ModuleDAOServer.getInstance().selectAll<RoleVO>(
            RoleVO.API_TYPE_ID,
            " join " + VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID].full_name + " ur on ur.role_id = t.id " +
            " where ur.user_id = $1",
            [uid],
            [UserRoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]);
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

        let userRoles: UserRoleVO = await ModuleDAOServer.getInstance().selectOne<UserRoleVO>(
            UserRoleVO.API_TYPE_ID,
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

        let userRoles: UserRoleVO = await ModuleDAOServer.getInstance().selectOne<UserRoleVO>(
            UserRoleVO.API_TYPE_ID,
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

        // // Un admin a accès à tout dans tous les cas
        // if (await this.isAdmin()) {
        //     // this.consoledebug("CHECKACCESS:" + policy_name + ":TRUE:IS_ADMIN");
        //     return true;
        // }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":TRUE:IS_SERVER");
            return true;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().registered_policies[policy_name];
        if (!target_policy) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":FALSE:policy_name:Introuvable");
            return false;
        }

        let uid: number = httpContext.get('UID');
        if (!uid) {
            // profil anonyme
            return AccessPolicyServerController.getInstance().checkAccessTo(
                target_policy,
                AccessPolicyServerController.getInstance().getUsersRoles(false, null, AccessPolicyServerController.getInstance().registered_roles_by_ids),
                AccessPolicyServerController.getInstance().registered_roles_by_ids,
                AccessPolicyServerController.getInstance().registered_roles_policies,
                AccessPolicyServerController.getInstance().registered_policies_by_ids,
                AccessPolicyServerController.getInstance().registered_dependencies);
        }

        return AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            AccessPolicyServerController.getInstance().getUsersRoles(true, AccessPolicyServerController.getInstance().registered_users_roles[uid], AccessPolicyServerController.getInstance().registered_roles_by_ids),
            AccessPolicyServerController.getInstance().registered_roles_by_ids,
            AccessPolicyServerController.getInstance().registered_roles_policies,
            AccessPolicyServerController.getInstance().registered_policies_by_ids,
            AccessPolicyServerController.getInstance().registered_dependencies);
    }

    private async addRoleToUser(params: AddRoleToUserParamVO): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params) || (!params.user_id) || (!params.role_id)) {
            return;
        }

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return;
        }

        let userRole: UserRoleVO = await ModuleDAOServer.getInstance().selectOne<UserRoleVO>(UserRoleVO.API_TYPE_ID, " WHERE t.user_id = $1 and t.role_id = $2", [params.user_id, params.role_id]);

        if (!userRole) {
            userRole = new UserRoleVO();
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
        AccessPolicyServerController.getInstance().registered_roles_policies = {};

        let rolesPolicies: RolePolicyVO[] = await ModuleDAO.getInstance().getVos<RolePolicyVO>(RolePolicyVO.API_TYPE_ID);
        for (let i in rolesPolicies) {
            let rolePolicy: RolePolicyVO = rolesPolicies[i];

            if (!AccessPolicyServerController.getInstance().registered_roles_policies[rolePolicy.role_id]) {
                AccessPolicyServerController.getInstance().registered_roles_policies[rolePolicy.role_id] = {};
            }

            AccessPolicyServerController.getInstance().registered_roles_policies[rolePolicy.role_id][rolePolicy.accpol_id] = rolePolicy;
        }
    }

    private async preload_registered_users_roles() {
        AccessPolicyServerController.getInstance().registered_users_roles = {};

        let usersRoles: UserRoleVO[] = await ModuleDAO.getInstance().getVos<UserRoleVO>(UserRoleVO.API_TYPE_ID);
        for (let i in usersRoles) {
            let userRole: UserRoleVO = usersRoles[i];

            if (!AccessPolicyServerController.getInstance().registered_users_roles[userRole.user_id]) {
                AccessPolicyServerController.getInstance().registered_users_roles[userRole.user_id] = [];
            }

            AccessPolicyServerController.getInstance().registered_users_roles[userRole.user_id].push(AccessPolicyServerController.getInstance().registered_roles_by_ids[userRole.role_id]);
        }
    }

    private async preload_registered_roles() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.getInstance().registered_roles = {};
        AccessPolicyServerController.getInstance().registered_roles_by_ids = {};

        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);
        AccessPolicyServerController.getInstance().registered_roles_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(roles);
        for (let i in roles) {
            let role: RoleVO = roles[i];

            AccessPolicyServerController.getInstance().registered_roles[role.translatable_name] = role;

            if (role.translatable_name == AccessPolicyServerController.getInstance().role_admin.translatable_name) {
                AccessPolicyServerController.getInstance().role_admin = role;
            }
            if (role.translatable_name == AccessPolicyServerController.getInstance().role_anonymous.translatable_name) {
                AccessPolicyServerController.getInstance().role_anonymous = role;
            }
            if (role.translatable_name == AccessPolicyServerController.getInstance().role_logged.translatable_name) {
                AccessPolicyServerController.getInstance().role_logged = role;
            }
        }
    }

    private async preload_registered_policies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.getInstance().registered_policies = {};
        AccessPolicyServerController.getInstance().registered_policies_by_ids = {};

        let policies: AccessPolicyVO[] = await ModuleDAO.getInstance().getVos<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID);
        AccessPolicyServerController.getInstance().registered_policies_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(policies);
        for (let i in policies) {
            let policy: AccessPolicyVO = policies[i];

            AccessPolicyServerController.getInstance().registered_policies[policy.translatable_name] = policy;
        }
    }

    private async preload_registered_dependencies() {
        // Normalement à ce stade toutes les déclarations sont en BDD, on clear et on reload bêtement
        AccessPolicyServerController.getInstance().registered_dependencies = {};

        let dependencies: PolicyDependencyVO[] = await ModuleDAO.getInstance().getVos<PolicyDependencyVO>(PolicyDependencyVO.API_TYPE_ID);
        for (let i in dependencies) {
            let dependency: PolicyDependencyVO = dependencies[i];

            if (!AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id]) {
                AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id] = [];
            }
            AccessPolicyServerController.getInstance().registered_dependencies[dependency.src_pol_id].push(dependency);
        }
    }


    /**
     * Faut généraliser ce concept c'est ridicule
     */
    private async onCreateAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        AccessPolicyServerController.getInstance().registered_policies[vo.translatable_name] = vo;
        AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id] = vo;

        return true;
    }

    private async onCreatePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if (!AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id]) {
            AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id] = [];
        }
        AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id].push(vo);
        return true;
    }

    private async onCreateRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if (!AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id]) {
            AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id] = {};
        }
        AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id] = vo;
        return true;
    }

    private async onCreateRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        AccessPolicyServerController.getInstance().registered_roles[vo.translatable_name] = vo;
        AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id] = vo;
        return true;
    }

    private async onCreateUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if (!AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id]) {
            AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id] = [];
        }
        AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id].push(AccessPolicyServerController.getInstance().registered_roles[vo.role_id]);
        return true;
    }

    private async onUpdateAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if ((!AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id]) || (!AccessPolicyServerController.getInstance().registered_policies[AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id].translatable_name])) {
            return true;
        }

        if (AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id].translatable_name != vo.translatable_name) {
            delete AccessPolicyServerController.getInstance().registered_policies[AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id].translatable_name];
        }
        AccessPolicyServerController.getInstance().registered_policies[vo.translatable_name] = vo;
        AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id] = vo;
        return true;
    }

    private async onUpdatePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        for (let i in AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id]) {
            if (AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id][i].id == vo.id) {
                AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id][i] = vo;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (let j in AccessPolicyServerController.getInstance().registered_dependencies) {
            for (let i in AccessPolicyServerController.getInstance().registered_dependencies[j]) {
                if (AccessPolicyServerController.getInstance().registered_dependencies[j][i].id == vo.id) {
                    AccessPolicyServerController.getInstance().registered_dependencies[j][i] = vo;
                    return true;
                }
            }
        }
        return true;
    }

    private async onUpdateRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if (AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id] && AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id] &&
            (AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id].id == vo.id)) {
            AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id] = vo;
            return true;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (let j in AccessPolicyServerController.getInstance().registered_roles_policies) {
            for (let i in AccessPolicyServerController.getInstance().registered_roles_policies[j]) {
                if (AccessPolicyServerController.getInstance().registered_roles_policies[j][i].id == vo.id) {
                    AccessPolicyServerController.getInstance().registered_roles_policies[j][i] = vo;
                    return true;
                }
            }
        }
        return true;
    }

    private async onUpdateRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if ((!AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id]) || (!AccessPolicyServerController.getInstance().registered_roles[AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id].translatable_name])) {
            return true;
        }

        if (AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id].translatable_name != vo.translatable_name) {
            delete AccessPolicyServerController.getInstance().registered_roles[AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id].translatable_name];
        }
        AccessPolicyServerController.getInstance().registered_roles[vo.translatable_name] = vo;
        AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id] = vo;
        return true;
    }

    private async onUpdateUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        let role: RoleVO = AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.role_id];

        for (let i in AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id]) {
            if (AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id][i].id == role.id) {
                AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id][i] = role;
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (let j in AccessPolicyServerController.getInstance().registered_users_roles) {
            for (let i in AccessPolicyServerController.getInstance().registered_users_roles[j]) {
                if (AccessPolicyServerController.getInstance().registered_users_roles[j][i].id == role.id) {
                    AccessPolicyServerController.getInstance().registered_users_roles[j][i] = role;
                    return true;
                }
            }
        }
        return true;
    }

    private async onDeleteAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if ((!AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id]) || (!AccessPolicyServerController.getInstance().registered_policies[AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id].translatable_name])) {
            return true;
        }

        delete AccessPolicyServerController.getInstance().registered_policies[AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id].translatable_name];
        delete AccessPolicyServerController.getInstance().registered_policies_by_ids[vo.id];
        return true;
    }

    private async onDeletePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        for (let i in AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id]) {
            if (AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id][i].id == vo.id) {
                AccessPolicyServerController.getInstance().registered_dependencies[vo.src_pol_id].splice(parseInt(i), 1);
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de src_pol_id, on lance une recherche plus large
        for (let j in AccessPolicyServerController.getInstance().registered_dependencies) {
            for (let i in AccessPolicyServerController.getInstance().registered_dependencies[j]) {
                if (AccessPolicyServerController.getInstance().registered_dependencies[j][i].id == vo.id) {
                    AccessPolicyServerController.getInstance().registered_dependencies[j].splice(parseInt(i), 1);
                    return true;
                }
            }
        }
        return true;
    }

    private async onDeleteRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if (AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id] && AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id] &&
            (AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id].id == vo.id)) {
            delete AccessPolicyServerController.getInstance().registered_roles_policies[vo.role_id][vo.accpol_id];
            return true;
        }

        // Sinon il y a eu un changement dans les ids, on fait une recherche intégrale
        for (let j in AccessPolicyServerController.getInstance().registered_roles_policies) {
            for (let i in AccessPolicyServerController.getInstance().registered_roles_policies[j]) {
                if (AccessPolicyServerController.getInstance().registered_roles_policies[j][i].id == vo.id) {
                    delete AccessPolicyServerController.getInstance().registered_roles_policies[j][i];
                    return true;
                }
            }
        }
        return true;
    }

    private async onDeleteRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        if ((!AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id]) || (!AccessPolicyServerController.getInstance().registered_roles[AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id].translatable_name])) {
            return true;
        }

        delete AccessPolicyServerController.getInstance().registered_roles[AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id].translatable_name];
        delete AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.id];
        return true;
    }

    private async onDeleteUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        let role: RoleVO = AccessPolicyServerController.getInstance().registered_roles_by_ids[vo.role_id];

        for (let i in AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id]) {
            if (AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id][i].id == role.id) {
                AccessPolicyServerController.getInstance().registered_users_roles[vo.user_id].splice(parseInt(i), 1);
                return true;
            }
        }

        // Si on le trouve pas c'est probablement un changement de user_id, on lance une recherche plus large
        for (let j in AccessPolicyServerController.getInstance().registered_users_roles) {
            for (let i in AccessPolicyServerController.getInstance().registered_users_roles[j]) {
                if (AccessPolicyServerController.getInstance().registered_users_roles[j][i].id == role.id) {
                    AccessPolicyServerController.getInstance().registered_users_roles[j].splice(parseInt(i), 1);
                    return true;
                }
            }
        }
        return true;
    }
}
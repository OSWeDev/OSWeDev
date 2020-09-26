import * as moment from 'moment';
import AccessPolicyController from '../../../shared/modules/AccessPolicy/AccessPolicyController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import AddRoleToUserParamVO from '../../../shared/modules/AccessPolicy/vos/apis/AddRoleToUserParamVO';
import LoginParamVO from '../../../shared/modules/AccessPolicy/vos/apis/LoginParamVO';
import ResetPwdParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ResetPwdParamVO';
import ResetPwdUIDParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ResetPwdUIDParamVO';
import ToggleAccessParamVO from '../../../shared/modules/AccessPolicy/vos/apis/ToggleAccessParamVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import BooleanParamVO from '../../../shared/modules/API/vos/apis/BooleanParamVO';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleVO from '../../../shared/modules/ModuleVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TextHandler from '../../../shared/tools/TextHandler';
import IServerUserSession from '../../IServerUserSession';
import ServerBase from '../../ServerBase';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import AccessPolicyCronWorkersHandler from './AccessPolicyCronWorkersHandler';
import AccessPolicyServerController from './AccessPolicyServerController';
import PasswordInitialisation from './PasswordInitialisation/PasswordInitialisation';
import PasswordRecovery from './PasswordRecovery/PasswordRecovery';
import PasswordReset from './PasswordReset/PasswordReset';

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static TASK_NAME_onBlockOrInvalidateUserDeleteSessions = 'ModuleAccessPolicyServer.onBlockOrInvalidateUserDeleteSessions';

    public static getInstance() {
        if (!ModuleAccessPolicyServer.instance) {
            ModuleAccessPolicyServer.instance = new ModuleAccessPolicyServer();
        }
        return ModuleAccessPolicyServer.instance;
    }

    private static instance: ModuleAccessPolicyServer = null;

    private debug_check_access: boolean = false;
    private rights_have_been_preloaded: boolean = false;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    /**
     * Call @ server startup to preload all access right configuration
     */
    public async preload_access_rights() {
        if (this.rights_have_been_preloaded) {
            return;
        }

        this.rights_have_been_preloaded = true;
        // On preload ce qui l'a pas été et on complète les listes avec les données en base qui peuvent
        //  avoir été ajoutée en parralèle des déclarations dans le source
        await AccessPolicyServerController.getInstance().preload_registered_roles();
        await AccessPolicyServerController.getInstance().preload_registered_policies();
        await AccessPolicyServerController.getInstance().preload_registered_dependencies();

        await AccessPolicyServerController.getInstance().preload_registered_users_roles();
        await AccessPolicyServerController.getInstance().preload_registered_roles_policies();
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

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAccessPolicy.POLICY_FO_ACCESS;
        fo_access = await this.registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Accès au front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_IMPERSONATE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_IMPERSONATE.group_id = group.id;
        POLICY_IMPERSONATE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_IMPERSONATE.translatable_name = ModuleAccessPolicy.POLICY_IMPERSONATE;
        POLICY_IMPERSONATE = await this.registerPolicy(POLICY_IMPERSONATE, new DefaultTranslation({
            fr: 'Impersonate'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_SENDINITPWD: AccessPolicyVO = new AccessPolicyVO();
        POLICY_SENDINITPWD.group_id = group.id;
        POLICY_SENDINITPWD.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_SENDINITPWD.translatable_name = ModuleAccessPolicy.POLICY_SENDINITPWD;
        POLICY_SENDINITPWD = await this.registerPolicy(POLICY_SENDINITPWD, new DefaultTranslation({
            fr: 'Envoi Mail init PWD'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAccessPolicy.POLICY_BO_ACCESS;
        bo_access = await this.registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Accès à l\'administration'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let modules_managment_access: AccessPolicyVO = new AccessPolicyVO();
        modules_managment_access.group_id = group.id;
        modules_managment_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        modules_managment_access.translatable_name = ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;
        modules_managment_access = await this.registerPolicy(modules_managment_access, new DefaultTranslation({
            fr: 'Gestion des modules'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
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
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
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
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
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
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
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

    public async registerSimplePolicy(group_id: number, default_behaviour: number, translatable_name: string, default_translations: { [code_lang: string]: string }, moduleVO: ModuleVO): Promise<AccessPolicyVO> {
        let access: AccessPolicyVO = new AccessPolicyVO();
        access.group_id = group_id;
        access.default_behaviour = default_behaviour;
        access.translatable_name = translatable_name;
        return await this.registerPolicy(access, new DefaultTranslation(default_translations), moduleVO);
    }

    public async addDependency(src_pol: AccessPolicyVO, default_behaviour: number, depends_on_pol_id: AccessPolicyVO): Promise<PolicyDependencyVO> {
        let dep: PolicyDependencyVO = new PolicyDependencyVO();
        dep.default_behaviour = default_behaviour;
        dep.src_pol_id = src_pol.id;
        dep.depends_on_pol_id = depends_on_pol_id.id;
        return await this.registerPolicyDependency(dep);
    }

    public registerCrons(): void {
        AccessPolicyCronWorkersHandler.getInstance();
    }


    public registerAccessHooks(): void {

        ModuleDAOServer.getInstance().registerAccessHook(AccessPolicyVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_READ, this.filterPolicyByActivModules.bind(this));
    }

    public async configure() {

        // On ajoute un trigger pour la création du compte
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOCreate.bind(this));
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.checkBlockingOrInvalidatingUser.bind(this));

        // On ajoute un trigger pour la modification du mot de passe
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOUpdate.bind(this));
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.checkBlockingOrInvalidatingUser.bind(this));

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



        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Gestion des droits'
        }, 'access_policy.admin.filters.filters-title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Caché'
        }, 'access_policy.admin.filters.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Visible'
        }, 'access_policy.admin.filters.visible.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mise à jour des droits : OK'
        }, 'access_policy.admin.set_policy.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mise à jour des droits : En cours...'
        }, 'access_policy.admin.set_policy.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Refusé'
        }, 'access_policy.admin.table.denied.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accordé'
        }, 'access_policy.admin.table.granted.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'access_policy.admin.table.headers.first_header.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accès admin uniquement'
        }, 'accpol.default_behaviour.access_denied_to_all_but_admin'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accès utilisateur connecté'
        }, 'accpol.default_behaviour.access_denied_to_anonymous'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accès pour tous'
        }, 'accpol.default_behaviour.access_granted_to_anyone'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Utilisateurs'
        }, 'menu.menuelements.AccessPolicyAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Gestion des droits'
        }, 'menu.menuelements.AccessPolicyComponent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Gourpe d\'accès'
        }, 'menu.menuelements.AccessPolicyGroupVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accès'
        }, 'menu.menuelements.AccessPolicyVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Droit'
        }, 'fields.labels.ref.module_access_policy_accpol.___LABEL____group_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Admin'
        }, 'access.roles.names.admin.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non connecté'
        }, 'access.roles.names.anonymous.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connecté'
        }, 'access.roles.names.logged.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion'
        }, 'login.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'login.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Saisissez vos identifiants'
        }, 'login.msg.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Login'
        }, 'login.password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mot de passe'
        }, 'login.email_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion'
        }, 'login.signIn.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mot de passe oublié'
        }, 'login.recoverlink.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion...'
        }, 'login.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec de la connexion'
        }, 'login.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Récupération du mot de passe'
        }, 'login.recover.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'login.recover.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Merci de renseigner votre adresse email.'
        }, 'login.recover.desc.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Login'
        }, 'login.email_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Envoyer le mail'
        }, 'login.recover.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Envoyer le SMS'
        }, 'login.recover.sms.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vous devriez recevoir un SMS d\'ici quelques minutes (si celui-ci est bien configuré dans votre compte) pour réinitialiser votre compte. Si vous n\'avez reçu aucun SMS, vérifiez que le mail saisi est bien celui du compte et réessayez. Vous pouvez également tenter la récupération par Mail.'
        }, 'login.recover.answersms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Récupération...'
        }, 'recover.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Récupération échouée'
        }, 'recover.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Consultez vos mails'
        }, 'recover.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vous devriez recevoir un mail d\'ici quelques minutes pour réinitialiser votre compte. Si vous n\'avez reçu aucun mail, vérifiez vos spams, et que le mail saisi est bien celui du compte et réessayez. Vous pouvez également tenter la récupération par SMS.'
        }, 'login.recover.answer.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Réinitialisation de votre mot de passe'
        }, 'login.reset.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'login.reset.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Merci de renseigner votre adresse email, le code reçu par mail sur cette même adresse, ainsi que votre nouveau mot de passe. Celui-ci doit contenir au moins 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.desc.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Merci de renseigner votre nouveau mot de passe. Celui-ci doit contenir au moins 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.desc_simplified.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Login'
        }, 'login.email_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Code de sécurité'
        }, 'login.code_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Nouveau mot de passe'
        }, 'login.password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valider'
        }, 'login.reset.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Me connecter'
        }, 'login.reset.reco.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification...'
        }, 'reset.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification échouée'
        }, 'reset.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le mot de passe a été réinitialisé. Vous pouvez vous connecter avec votre nouveau mot de passe.'
        }, 'login.reset.answer_ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification réussie'
        }, 'reset.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'La saisie est invalide. Vérifiez l\'adresse mail, le code envoyé sur cette même adresse et le mot passe. Celui-ci doit contenir au minimum 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.answer_ko.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'La saisie est invalide. Vérifiez le mot passe. Celui-ci doit contenir au minimum 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.answer_ko_simplified.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Se connecter'
        }, 'login.reset.lien_connect.___LABEL___'));



        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accéder au site'
        }, 'mails.pwd.initpwd.submit'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Initialisation du mot de passe'
        }, 'mails.pwd.initpwd.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cliquez sur le lien ci-dessous pour initialiser votre mot de passe.'
        }, 'mails.pwd.initpwd.html'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accéder au site'
        }, 'mails.pwd.recovery.submit'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Récupération du mot de passe'
        }, 'mails.pwd.recovery.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '%%ENV%%APP_TITLE%%: Pour réinitialiser votre compte: %%ENV%%BASE_URL%%%%ENV%%URL_RECOVERY_CHALLENGE%%/%%VAR%%UID%%/%%VAR%%CODE_CHALLENGE%%'
        }, 'mails.pwd.recovery.sms'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cliquez sur le lien ci-dessous pour modifier votre mot de passe.'
        }, 'mails.pwd.recovery.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe a expiré'
        }, 'mails.pwd.invalidation.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe a été invalidé. Vous pouvez utiliser la page de récupération du mot de passe accessible en cliquant sur le lien ci-dessous.'
        }, 'mails.pwd.invalidation.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe a expiré'
        }, 'mails.pwd.invalidation.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder1.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder2.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder1.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe expire dans 20 jours. Vous pouvez le modifier dans l\'administration, ou vous pouvez utiliser la procédure de réinitialisation du mot de passe, accessible en cliquant sur le lien ci- dessous.'
        }, 'mails.pwd.reminder1.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder2.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre mot de passe expire dans 3 jours. Vous pouvez le modifier dans l\'administration, ou vous pouvez utiliser la procédure de réinitialisation du mot de passe, accessible en cliquant sur le lien ci- dessous.'
        }, 'mails.pwd.reminder2.html'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Connexion impossible. Vérifiez le mot de passe. Si votre mot de passe a été invalidé, vous devriez recevoir un mail vous invitant à le renouveler. Vous pouvez également utiliser la procédure d\'oubli du mot de passe en cliquant sur "Mot de passe oublié".'
        }, 'login.failed.message.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'LogAs'
        }, 'fields.labels.ref.user.__component__impersonate.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mise à jour de la langue et rechargement...'
        }, 'lang_selector.encours.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'lang_selector.lang_prefix.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: ''
        }, 'lang_selector.lang_suffix.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Consultez vos SMS'
        }, 'recover.oksms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Langue'
        }, 'lang_selector.label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Droits'
        }, 'fields.labels.ref.module_access_policy_accpol.___LABEL____module_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mail d\'initialisation du mot de passe envoyé'
        }, 'sendinitpwd.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mail init mdp'
        }, 'fields.labels.ref.user.__component__sendinitpwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Renvoyer le mail'
        }, 'login.reset.send_init_pwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Pour des raisons de sécurité, le mail d\'initialisation du mot de passe a expiré. Vous devez faire une nouvelle procédure de récupération du mot de passe en cliquant sur "Renvoyer le mail" ou en utilisant la procédure d\'oubli de mot de passe sur la page de connexion.'
        }, 'login.reset.code_invalid.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dans la page de connexion, cliquez sur "oubli du mot de passe"'
        }, 'reset.code_invalid.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mail renvoyé, merci de consulter votre messagerie'
        }, 'reset.sent_init_pwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Un utilisateur avec cette adresse mail existe déjà' }, 'accesspolicy.user-create.mail.exists' + DefaultTranslation.DEFAULT_LABEL_EXTENSION));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_CHECK_ACCESS, this.checkAccess.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ADMIN, this.isAdmin.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ROLE, this.isRole.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_MY_ROLES, this.getMyRoles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER, this.addRoleToUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, this.beginRecover.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS, this.beginRecoverSMS.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWD, this.resetPwd.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWDUID, this.resetPwdUID.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_checkCode, this.checkCode.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_checkCodeUID, this.checkCodeUID.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX, this.getAccessMatrix.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_TOGGLE_ACCESS, this.togglePolicy.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT, this.loginAndRedirect.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_ID, this.getLoggedUserId.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_NAME, this.getLoggedUserName.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_impersonateLogin, this.impersonateLogin.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_change_lang, this.change_lang.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_getMyLang, this.getMyLang.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_begininitpwd, this.begininitpwd.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_begininitpwd_uid, this.begininitpwd_uid.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_getSelfUser, this.getSelfUser.bind(this));
    }

    public async begininitpwd(param: StringParamVO): Promise<void> {
        if ((!param) || (!param.text)) {
            return;
        }

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_SENDINITPWD)) {
            return;
        }

        await PasswordInitialisation.getInstance().begininitpwd(param.text);
    }

    public async begininitpwd_uid(param: NumberParamVO): Promise<void> {
        if ((!param) || (!param.num)) {
            return;
        }

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_SENDINITPWD)) {
            return;
        }

        await PasswordInitialisation.getInstance().begininitpwd_uid(param.num);
    }

    public async activate_policies_for_roles(policy_names: string[], role_names: string[]) {

        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        let access_matrix: {
            [policy_id: number]: {
                [role_id: number]: boolean;
            };
        } = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        let roles_ids_by_name: { [role_name: string]: number } = await this.get_roles_ids_by_name();
        let policies_ids_by_name: { [policy_name: string]: number } = await this.get_policies_ids_by_name();

        for (let i in policy_names) {
            let policy_name = policy_names[i];

            for (let j in role_names) {
                let role_name = role_names[j];

                await this.activate_policy(policies_ids_by_name[policy_name], roles_ids_by_name[role_name], access_matrix);
            }
        }
    }

    public async getSelfUser(): Promise<UserVO> {
        /**
         * on doit pouvoir charger son propre user
         */
        let user_id: number = this.getLoggedUserId();
        if (!user_id) {
            return null;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let IS_CLIENT = httpContext.get('IS_CLIENT');
        httpContext.set('IS_CLIENT', false);

        let user: UserVO = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, user_id);

        httpContext.set('IS_CLIENT', IS_CLIENT);

        return user;
    }

    public async getMyLang(): Promise<LangVO> {

        let user: UserVO = await this.getSelfUser();
        return await ModuleDAO.getInstance().getVoById<LangVO>(LangVO.API_TYPE_ID, user.lang_id);
    }

    public async generate_challenge(user: UserVO) {

        // on génère un code qu'on stocke dans le user en base (en datant) et qu'on envoie par mail
        let challenge: string = TextHandler.getInstance().generateChallenge();
        user.recovery_challenge = challenge;
        console.debug("challenge:" + user.email + ':' + challenge + ':');
        user.recovery_expiration = moment().utc(true).add(await ModuleParams.getInstance().getParamValueAsFloat(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS), 'hours');
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
    }

    public async change_lang(param: NumberParamVO): Promise<void> {
        if ((!param) || (!param.num)) {
            return;
        }

        let user_id: number = this.getLoggedUserId();
        if (!user_id) {
            return;
        }

        await ModuleDAOServer.getInstance().query('update ' + VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].full_name + ' set ' +
            "lang_id=$1 where id=$2",
            [param.num, user_id]);
    }

    /**
     * @param role Le rôle à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerRole(role: RoleVO, default_translation: DefaultTranslation): Promise<RoleVO> {
        return await AccessPolicyServerController.getInstance().registerRole(role, default_translation);
    }

    /**
     * @param group Le group à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicyGroup(group: AccessPolicyGroupVO, default_translation: DefaultTranslation): Promise<AccessPolicyGroupVO> {
        return await AccessPolicyServerController.getInstance().registerPolicyGroup(group, default_translation);
    }

    /**
     * @param policy La policy à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicy(policy: AccessPolicyVO, default_translation: DefaultTranslation, moduleVO: ModuleVO): Promise<AccessPolicyVO> {
        return await AccessPolicyServerController.getInstance().registerPolicy(policy, default_translation, moduleVO);
    }


    public async registerPolicyDependency(dependency: PolicyDependencyVO): Promise<PolicyDependencyVO> {
        if ((!dependency) || (!dependency.src_pol_id) || (!dependency.depends_on_pol_id)) {
            return null;
        }

        return await AccessPolicyServerController.getInstance().registerPolicyDependency(dependency);
    }

    /**
     * @returns true si le compte est valide, false si il est expiré ou blocké
     */
    public async checkUserStatus(uid: number): Promise<boolean> {

        try {

            let res = await ModuleDAOServer.getInstance().query('select invalidated or blocked as invalidated from ' + VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].full_name + ' where id=$1', [uid]);
            let invalidated = (res && (res.length == 1) && (typeof res[0]['invalidated'] != 'undefined') && (res[0]['invalidated'] !== null)) ? res[0]['invalidated'] : true;
            return !invalidated;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return false;
    }

    /**
     * Fonction qui détruit les sessions de l'utilisateur que l'on est en train de bloquer - exécutée sur le main process
     * @param uid
     */
    public async onBlockOrInvalidateUserDeleteSessions(uid: number) {

        ForkedTasksController.getInstance().register_task(ModuleAccessPolicyServer.TASK_NAME_onBlockOrInvalidateUserDeleteSessions, this.onBlockOrInvalidateUserDeleteSessions.bind(this));

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleAccessPolicyServer.TASK_NAME_onBlockOrInvalidateUserDeleteSessions, uid)) {
            return;
        }

        try {

            let sessions: { [sessId: string]: IServerUserSession } = PushDataServerController.getInstance().getUserSessions(uid);
            for (let i in sessions) {
                let session: IServerUserSession = sessions[i];

                if (!session) {
                    continue;
                }

                try {
                    session.destroy(() => {
                        PushDataServerController.getInstance().unregisterSession(session);
                    });
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                }
                break;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return;
    }

    public getLoggedUserId(): number {

        try {

            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            if (session && session.uid) {
                return session.uid;
            }
            return null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public async getLoggedUserName(): Promise<string> {

        let user: UserVO = await this.getSelfUser();
        return user ? user.name : null;
    }

    public isLogedAs(): boolean {

        try {

            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            if (session && !!session.impersonated_from) {
                return true;
            }
            return false;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return false;
        }
    }

    /**
     * Renvoie le UID de l'admin qui utilise la fonction logAs
     */
    public getAdminLogedUserId(): number {

        try {

            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            let impersonated_from_session = (session && session.impersonated_from) ? session.impersonated_from : null;

            if (impersonated_from_session && !!impersonated_from_session.uid) {
                return impersonated_from_session.uid;
            }
            return null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    /**
     * Renvoie la session de l'admin qui utilise la fonction logAs
     */
    public getAdminLogedUserSession(): IServerUserSession {

        try {

            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            return (session && session.impersonated_from) ? session.impersonated_from as IServerUserSession : null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public getUserSession(): IServerUserSession {

        try {

            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            return httpContext ? httpContext.get('SESSION') as IServerUserSession : null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public checkAccessByRoleIds(role_ids: number[]): boolean {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!role_ids) || (!role_ids.length)) {
            return false;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            return true;
        }

        let uid: number = httpContext.get('UID');
        if (!uid) {
            return role_ids.indexOf(AccessPolicyServerController.getInstance().role_anonymous.id) >= 0;
        }

        let user_roles: { [role_id: number]: RoleVO } = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);

        for (let i in user_roles) {
            if (role_ids.indexOf(user_roles[i].id) >= 0) {
                return true;
            }
        }
        return false;
    }

    private async togglePolicy(params: ToggleAccessParamVO): Promise<boolean> {
        if ((!params.policy_id) || (!params.role_id)) {
            return false;
        }

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return false;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy_by_id(params.policy_id);
        let role: RoleVO = AccessPolicyServerController.getInstance().get_registered_role_by_id(params.role_id);
        if (AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            { [role.id]: role }, undefined, undefined, undefined, undefined, role)) {
            // On devrait pas pouvoir arriver là avec un héritage true
            return false;
        }

        // Il faut qu'on sache si il existe une policy explicit à cet endroit
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult;
        let role_policy: RolePolicyVO = AccessPolicyServerController.getInstance().get_role_policy_by_ids(role.id, target_policy.id);
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
        return await AccessPolicyServerController.getInstance().getAccessMatrix(param ? param.value : false);
    }

    private async getMyRoles(): Promise<RoleVO[]> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;

        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            return null;
        }

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
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            return false;
        }

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
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            return false;
        }

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
            ConsoleHandler.getInstance().log(msg);
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

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(policy_name);
        if (!target_policy) {
            // this.consoledebug("CHECKACCESS:" + policy_name + ":FALSE:policy_name:Introuvable");
            return false;
        }

        let uid: number = httpContext.get('UID');
        if (!uid) {
            // profil anonyme
            return AccessPolicyServerController.getInstance().checkAccessTo(
                target_policy,
                AccessPolicyServerController.getInstance().getUsersRoles(false, null));
        }

        if (!AccessPolicyServerController.getInstance().get_registered_user_roles_by_uid(uid)) {
            return false;
        }

        return AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            AccessPolicyServerController.getInstance().getUsersRoles(true, uid));
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

    private async beginRecoverSMS(param: StringParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!param.text)) {
            return false;
        }

        return PasswordRecovery.getInstance().beginRecoverySMS(param.text);
    }

    private async checkCode(params: ResetPwdParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().checkCode(params.email, params.challenge);
    }

    private async checkCodeUID(params: ResetPwdUIDParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().checkCodeUID(params.uid, params.challenge);
    }

    private async resetPwd(params: ResetPwdParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwd(params.email, params.challenge, params.new_pwd1);
    }

    private async resetPwdUID(params: ResetPwdUIDParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwdUID(params.uid, params.challenge, params.new_pwd1);
    }

    private async handleTriggerUserVOUpdate(vo: UserVO): Promise<boolean> {


        if ((!vo) || (!vo.password) || (!vo.id)) {
            return true;
        }

        let user_id: number = this.getLoggedUserId();
        let user: UserVO = null;
        if (user_id == vo.id) {
            user = await this.getSelfUser();
        } else {
            user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, vo.id);
        }

        if ((!user) || (user.password == vo.password)) {
            return true;
        }

        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo, vo.password);

        return true;
    }

    private async handleTriggerUserVOCreate(vo: UserVO): Promise<boolean> {


        if ((!vo) || (!vo.password)) {
            return true;
        }
        let user: UserVO = await ModuleDAOServer.getInstance().selectOne<UserVO>(UserVO.API_TYPE_ID, " where email=$1", [vo.email]);
        if (!!user) {
            this.sendErrorMsg('accesspolicy.user-create.mail.exists' + DefaultTranslation.DEFAULT_LABEL_EXTENSION);
            return false;
        }
        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo, vo.password);

        return true;
    }

    private async onCreateAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_policy, vo);
        return true;
    }

    private async onCreatePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_policy_dependency, vo);
        return true;
    }

    private async onCreateRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_role_policy, vo);
        return true;
    }

    private async onCreateRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_role, vo);
        return true;
    }

    private async onCreateUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_user_role, vo);
        return true;
    }

    private async onUpdateAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_registered_policy, vo);
        return true;
    }

    private async onUpdatePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_policy_dependency, vo);
        return true;
    }

    private async onUpdateRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_role_policy, vo);
        return true;
    }

    private async onUpdateRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_role, vo);
        return true;
    }

    private async onUpdateUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_user_role, vo);
        return true;
    }

    private async onDeleteAccessPolicyVO(vo: AccessPolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_delete_registered_policy, vo);
        return true;
    }

    private async onDeletePolicyDependencyVO(vo: PolicyDependencyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_delete_registered_policy_dependency, vo);
        return true;
    }

    private async onDeleteRolePolicyVO(vo: RolePolicyVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_delete_registered_role_policy, vo);
        return true;
    }

    private async onDeleteRoleVO(vo: RoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_delete_registered_role, vo);
        return true;
    }

    private async onDeleteUserRoleVO(vo: UserRoleVO): Promise<boolean> {
        if ((!vo) || (!vo.id)) {
            return true;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_delete_registered_user_role, vo);
        return true;
    }

    private async loginAndRedirect(param: LoginParamVO): Promise<number> {

        try {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            if (session && session.uid) {
                return session.uid;
            }

            session.uid = null;

            if ((!param) || (!param.email) || (!param.password)) {
                return null;
            }

            let user: UserVO = await ModuleDAOServer.getInstance().selectOneUser(param.email, param.password);

            if (!user) {
                return null;
            }

            if (user.blocked) {
                return null;
            }

            if (user.invalidated) {

                // Si le mot de passe est invalidé on refuse la connexion mais on envoie aussi un mail pour récupérer le mot de passe si on l'a pas déjà envoyé
                if (user.recovery_expiration.isSameOrBefore(moment().utc(true))) {
                    await PasswordRecovery.getInstance().beginRecovery(user.email);
                }
                return null;
            }

            session.uid = user.id;

            PushDataServerController.getInstance().registerSession(session);

            // On stocke le log de connexion en base
            let user_log = new UserLogVO();
            user_log.user_id = user.id;
            user_log.log_time = moment().utc(true);
            user_log.impersonated = false;
            user_log.referer = httpContext.get('REFERER');
            user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;

            // On await pas ici on se fiche du résultat
            ModuleDAO.getInstance().insertOrUpdateVO(user_log);

            // this.redirectUserPostLogin(param.redirect_to, res);

            return user.id;
        } catch (error) {
            ConsoleHandler.getInstance().error("login:" + param.email + ":" + error);
        }
        // res.redirect('/login');

        return null;
    }

    private async impersonateLogin(param: LoginParamVO): Promise<number> {

        try {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let session = httpContext ? httpContext.get('SESSION') : null;

            if ((!session) || (!session.uid)) {
                return null;
            }

            if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_IMPERSONATE)) {
                return null;
            }

            if ((!param) || (!param.email)) {
                return null;
            }

            let user: UserVO = await ModuleDAOServer.getInstance().selectOne<UserVO>(UserVO.API_TYPE_ID, " where email=$1", [param.email]);

            if (!user) {
                return null;
            }

            if (user.blocked || user.invalidated) {
                ConsoleHandler.getInstance().error("impersonate login:" + param.email + ":blocked or invalidated");
                await PushDataServerController.getInstance().notifySimpleERROR(session.uid, 'Impossible de se connecter avec un compte bloqué ou invalidé', true);
                return null;
            }

            session.impersonated_from = Object.assign({}, session);
            session.uid = user.id;

            PushDataServerController.getInstance().registerSession(session);

            // On stocke le log de connexion en base
            let user_log = new UserLogVO();
            user_log.user_id = user.id;
            user_log.log_time = moment().utc(true);
            user_log.impersonated = true;
            user_log.referer = httpContext.get('REFERER');
            user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;
            user_log.comment = 'Impersonated from user_id [' + session.impersonated_from.uid + ']';

            // On await pas ici on se fiche du résultat
            ModuleDAO.getInstance().insertOrUpdateVO(user_log);

            return user.id;
        } catch (error) {
            ConsoleHandler.getInstance().error("impersonate login:" + param.email + ":" + error);
        }

        return null;
    }

    // private redirectUserPostLogin(redirect_to: string, res: Response) {
    //     if (redirect_to && (redirect_to != "")) {
    //         res.redirect(redirect_to);
    //     } else {
    //         // Par défaut on redirige vers la page d'accueil
    //         res.redirect("/");
    //     }
    // }

    private async filterPolicyByActivModules(datatable: ModuleTable<AccessPolicyVO>, vos: AccessPolicyVO[], uid: number, user_data: IUserData): Promise<AccessPolicyVO[]> {
        let res: AccessPolicyVO[] = [];

        for (let i in vos) {
            let vo: AccessPolicyVO = vos[i];
            let moduleVO: ModuleVO = vo.module_id ? await ModulesManagerServer.getInstance().getModuleVOById(vo.module_id) : null;

            if ((!vo.module_id) || (moduleVO && moduleVO.actif)) {
                res.push(vo);
            }
        }
        return res;
    }

    private async sendErrorMsg(msg_translatable_code: string) {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        PushDataServerController.getInstance().notifySimpleERROR(uid, msg_translatable_code);
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

    private async checkBlockingOrInvalidatingUser(user: UserVO) {
        let old_user: UserVO = null;
        if (!!user.id) {
            old_user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, user.id);
        }

        if (user.blocked && !old_user) {
            // On a pas de sessions à supprimer en cas de création
        } else if (user.blocked && !old_user.blocked) {
            await this.onBlockOrInvalidateUserDeleteSessions(user.id);
            return true;
        }

        if (user.invalidated && !old_user) {
            // On a pas de sessions à supprimer en cas de création
        } else if (user.invalidated && !old_user.invalidated) {
            await this.onBlockOrInvalidateUserDeleteSessions(user.id);
            return true;
        }

        return true;
    }
}
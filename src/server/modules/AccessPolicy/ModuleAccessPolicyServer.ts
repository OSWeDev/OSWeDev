import { Response } from 'express';

import AccessPolicyController from '../../../shared/modules/AccessPolicy/AccessPolicyController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleVO from '../../../shared/modules/ModuleVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueSmsFormatVO from '../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TextHandler from '../../../shared/tools/TextHandler';
import IServerUserSession from '../../IServerUserSession';
import StackContext from '../../StackContext';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';
import SendInBlueSmsServerController from '../SendInBlue/sms/SendInBlueSmsServerController';
import AccessPolicyCronWorkersHandler from './AccessPolicyCronWorkersHandler';
import AccessPolicyServerController from './AccessPolicyServerController';
import AccessPolicyDeleteSessionBGThread from './bgthreads/AccessPolicyDeleteSessionBGThread';
import PasswordInitialisation from './PasswordInitialisation/PasswordInitialisation';
import PasswordRecovery from './PasswordRecovery/PasswordRecovery';
import PasswordReset from './PasswordReset/PasswordReset';
import UserRecapture from './UserRecapture/UserRecapture';

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static TASK_NAME_onBlockOrInvalidateUserDeleteSessions = 'ModuleAccessPolicyServer.onBlockOrInvalidateUserDeleteSessions';
    public static TASK_NAME_delete_sessions_from_other_thread = 'ModuleAccessPolicyServer.delete_sessions_from_other_thread';

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

        ForkedTasksController.getInstance().register_task(ModuleAccessPolicyServer.TASK_NAME_delete_sessions_from_other_thread, this.delete_sessions_from_other_thread.bind(this));
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
            'fr-fr': 'Droits d\'administration principaux'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAccessPolicy.POLICY_FO_ACCESS;
        fo_access = await this.registerPolicy(fo_access, new DefaultTranslation({
            'fr-fr': 'Accès au front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));


        let signin_access: AccessPolicyVO = new AccessPolicyVO();
        signin_access.group_id = group.id;
        signin_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        signin_access.translatable_name = ModuleAccessPolicy.POLICY_FO_SIGNIN_ACCESS;
        signin_access = await this.registerPolicy(signin_access, new DefaultTranslation({
            'fr-fr': 'Droit à l\'inscription'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let sessionshare_access: AccessPolicyVO = new AccessPolicyVO();
        sessionshare_access.group_id = group.id;
        sessionshare_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        sessionshare_access.translatable_name = ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS;
        sessionshare_access = await this.registerPolicy(sessionshare_access, new DefaultTranslation({
            'fr-fr': 'Accès au SessionShare'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_IMPERSONATE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_IMPERSONATE.group_id = group.id;
        POLICY_IMPERSONATE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_IMPERSONATE.translatable_name = ModuleAccessPolicy.POLICY_IMPERSONATE;
        POLICY_IMPERSONATE = await this.registerPolicy(POLICY_IMPERSONATE, new DefaultTranslation({
            'fr-fr': 'Impersonate'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_SENDINITPWD: AccessPolicyVO = new AccessPolicyVO();
        POLICY_SENDINITPWD.group_id = group.id;
        POLICY_SENDINITPWD.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_SENDINITPWD.translatable_name = ModuleAccessPolicy.POLICY_SENDINITPWD;
        POLICY_SENDINITPWD = await this.registerPolicy(POLICY_SENDINITPWD, new DefaultTranslation({
            'fr-fr': 'Envoi Mail init PWD'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_SENDRECAPTURE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_SENDRECAPTURE.group_id = group.id;
        POLICY_SENDRECAPTURE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_SENDRECAPTURE.translatable_name = ModuleAccessPolicy.POLICY_SENDRECAPTURE;
        POLICY_SENDRECAPTURE = await this.registerPolicy(POLICY_SENDRECAPTURE, new DefaultTranslation({
            'fr-fr': 'Envoi Mail relance'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAccessPolicy.POLICY_BO_ACCESS;
        bo_access = await this.registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Accès à l\'administration'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let modules_managment_access: AccessPolicyVO = new AccessPolicyVO();
        modules_managment_access.group_id = group.id;
        modules_managment_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        modules_managment_access.translatable_name = ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;
        modules_managment_access = await this.registerPolicy(modules_managment_access, new DefaultTranslation({
            'fr-fr': 'Gestion des modules'
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
            'fr-fr': 'Gestion des droits'
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
            'fr-fr': 'Liste des utilisateurs'
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
            'fr-fr': 'Gestion des utilisateurs'
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
            'fr-fr': 'Utilisateur anonyme'
        }));

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.translatable_name = ModuleAccessPolicy.ROLE_LOGGED;
        AccessPolicyServerController.getInstance().role_logged = await this.registerRole(AccessPolicyServerController.getInstance().role_logged, new DefaultTranslation({
            'fr-fr': 'Utilisateur connecté'
        }));

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.translatable_name = ModuleAccessPolicy.ROLE_ADMIN;
        AccessPolicyServerController.getInstance().role_admin = await this.registerRole(AccessPolicyServerController.getInstance().role_admin, new DefaultTranslation({
            'fr-fr': 'Administrateur'
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
        ModuleBGThreadServer.getInstance().registerBGThread(AccessPolicyDeleteSessionBGThread.getInstance());

        // On ajoute un trigger pour la création du compte
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOCreate);
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.checkBlockingOrInvalidatingUser);
        preCreateTrigger.registerHandler(UserVO.API_TYPE_ID, this.trimAndCheckUnicityUser);

        // On ajoute un trigger pour la modification du mot de passe
        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.handleTriggerUserVOUpdate);
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.checkBlockingOrInvalidatingUserUpdate);
        preUpdateTrigger.registerHandler(UserVO.API_TYPE_ID, this.trimAndCheckUnicityUserUpdate);

        // On veut aussi des triggers pour tenir à jour les datas pre loadés des droits, comme ça si une mise à jour,
        //  ajout ou suppression on en prend compte immédiatement
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onCreateAccessPolicyVO);
        postCreateTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onCreatePolicyDependencyVO);
        postCreateTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onCreateRolePolicyVO);
        postCreateTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onCreateRoleVO);
        postCreateTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onCreateUserRoleVO);

        postUpdateTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onUpdateAccessPolicyVO);
        postUpdateTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onUpdatePolicyDependencyVO);
        postUpdateTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onUpdateRolePolicyVO);
        postUpdateTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onUpdateRoleVO);
        postUpdateTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onUpdateUserRoleVO);

        preDeleteTrigger.registerHandler(AccessPolicyVO.API_TYPE_ID, this.onDeleteAccessPolicyVO);
        preDeleteTrigger.registerHandler(PolicyDependencyVO.API_TYPE_ID, this.onDeletePolicyDependencyVO);
        preDeleteTrigger.registerHandler(RolePolicyVO.API_TYPE_ID, this.onDeleteRolePolicyVO);
        preDeleteTrigger.registerHandler(RoleVO.API_TYPE_ID, this.onDeleteRoleVO);
        preDeleteTrigger.registerHandler(UserRoleVO.API_TYPE_ID, this.onDeleteUserRoleVO);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Partager la connexion'
        }, 'session_share.navigator_share_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Partager votre connexion à l\'outil Wedev'
        }, 'session_share.navigator_share_content.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Partager la connexion'
        }, 'session_share.navigator_share.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copier l\'url de partage'
        }, 'session_share.copy_url.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion partagée !'
        }, 'session_share.navigator_share_success.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec du partage.'
        }, 'session_share.navigator_share_error.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec',
            'en-us': 'Failed'
        }, 'error.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Gestion des droits'
        }, 'access_policy.admin.filters.filters-title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Caché'
        }, 'access_policy.admin.filters.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Visible'
        }, 'access_policy.admin.filters.visible.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mise à jour des droits : OK'
        }, 'access_policy.admin.set_policy.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mise à jour des droits : En cours...'
        }, 'access_policy.admin.set_policy.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Refusé'
        }, 'access_policy.admin.table.denied.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accordé'
        }, 'access_policy.admin.table.granted.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'access_policy.admin.table.headers.first_header.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accès admin uniquement'
        }, 'accpol.default_behaviour.access_denied_to_all_but_admin'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accès utilisateur connecté'
        }, 'accpol.default_behaviour.access_denied_to_anonymous'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accès pour tous'
        }, 'accpol.default_behaviour.access_granted_to_anyone'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utilisateurs'
        }, 'menu.menuelements.admin.AccessPolicyAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Gestion des droits'
        }, 'menu.menuelements.admin.AccessPolicyComponent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Groupe d\'accès'
        }, 'menu.menuelements.admin.AccessPolicyGroupVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accès'
        }, 'menu.menuelements.admin.AccessPolicyVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Droit'
        }, 'fields.labels.ref.module_access_policy_accpol.___LABEL____group_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Admin'
        }, 'access.roles.names.admin.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non connecté'
        }, 'access.roles.names.anonymous.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connecté'
        }, 'access.roles.names.logged.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mon compte'
        }, 'client.my_account.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion'
        }, 'login.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'login.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Saisissez vos identifiants'
        }, 'login.msg.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Login'
        }, 'login.password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion'
        }, 'login.signIn.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mot de passe oublié'
        }, 'login.recoverlink.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion...'
        }, 'login.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de la connexion'
        }, 'login.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion validée'
        }, 'login.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Récupération du mot de passe'
        }, 'login.recover.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'login.recover.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Merci de renseigner votre adresse email.'
        }, 'login.recover.desc.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Login/email/n° de téléphone'
        }, 'login.email_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Envoyer le mail'
        }, 'login.recover.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Envoyer le SMS'
        }, 'login.recover.sms.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Vous devriez recevoir un SMS d\'ici quelques minutes (si celui-ci est bien configuré dans votre compte) pour réinitialiser votre compte. Si vous n\'avez reçu aucun SMS, vérifiez que le mail saisi est bien celui du compte et réessayez. Vous pouvez également tenter la récupération par Mail.'
        }, 'login.recover.answersms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Inscription'
        }, 'signin.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ' '
        }, 'signin.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Saisissez les informations demandées'
        }, 'signin.msg.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Identifiant'
        }, 'signin.nom_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Email'
        }, 'signin.email_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mot de passe'
        }, 'signin.password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer le mot de passe'
        }, 'signin.confirm_password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'S\'inscrire'
        }, 'signin.signin.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Les informations que vous avez saisi ne sont pas correctes'
        }, 'signin.failed.message.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le service est en cours de maintenance. Merci de votre patience.'
        }, 'error.global_update_blocker.activated.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Récupération...'
        }, 'recover.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Récupération échouée'
        }, 'recover.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Consultez vos mails'
        }, 'recover.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Vous devriez recevoir un mail d\'ici quelques minutes pour réinitialiser votre compte. Si vous n\'avez reçu aucun mail, vérifiez vos spams, et que le mail saisi est bien celui du compte et réessayez. Vous pouvez également tenter la récupération par SMS.'
        }, 'login.recover.answercansms.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Vous devriez recevoir un mail d\'ici quelques minutes pour réinitialiser votre compte. Si vous n\'avez reçu aucun mail, vérifiez vos spams, et que le mail saisi est bien celui du compte et réessayez.'
        }, 'login.recover.answer.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Réinitialisation de votre mot de passe'
        }, 'login.reset.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'login.reset.sub_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Merci de renseigner votre adresse email, le code reçu par mail sur cette même adresse, ainsi que votre nouveau mot de passe. Celui-ci doit contenir au moins 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.desc.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Merci de renseigner votre nouveau mot de passe. Celui-ci doit contenir au moins 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.desc_simplified.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Code de sécurité'
        }, 'login.code_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nouveau mot de passe'
        }, 'login.password_placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valider'
        }, 'login.reset.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Me connecter'
        }, 'login.reset.reco.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification...'
        }, 'reset.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification échouée'
        }, 'reset.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le mot de passe a été réinitialisé. Vous pouvez vous connecter avec votre nouveau mot de passe.'
        }, 'login.reset.answer_ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification réussie'
        }, 'reset.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'La saisie est invalide. Vérifiez l\'adresse mail, le code envoyé sur cette même adresse et le mot passe. Celui-ci doit contenir au minimum 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.answer_ko.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'La saisie est invalide. Vérifiez le mot passe. Celui-ci doit contenir au minimum 8 caractères, dont 1 chiffre, 1 minuscule et 1 majuscule.'
        }, 'login.reset.answer_ko_simplified.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Se connecter'
        }, 'login.reset.lien_connect.___LABEL___'));



        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accéder au site'
        }, 'mails.pwd.initpwd.submit'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Initialisation du mot de passe'
        }, 'mails.pwd.initpwd.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour initialiser votre mot de passe.'
        }, 'mails.pwd.initpwd.html'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Accéder au site'
        }, 'mails.pwd.recovery.submit'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Récupération du mot de passe'
        }, 'mails.pwd.recovery.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '%%ENV%%APP_TITLE%%: Pour réinitialiser votre compte: %%ENV%%BASE_URL%%login§§IFVAR_SESSION_SHARE_SID§§?sessionid=%%VAR%%SESSION_SHARE_SID%%§§§§#/reset/%%VAR%%UID%%/%%VAR%%CODE_CHALLENGE%%'
        }, 'mails.pwd.recovery.sms'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '%%ENV%%APP_TITLE%%: Pour initialiser votre compte: %%ENV%%BASE_URL%%%%ENV%%URL_RECOVERY_CHALLENGE%%/%%VAR%%UID%%/%%VAR%%CODE_CHALLENGE%%'
        }, 'sms.pwd.initpwd'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '%%ENV%%APP_TITLE%%: Pour réactiver votre compte Crescendo+, c\'est ici : %%ENV%%BASE_URL%%%%ENV%%URL_RECOVERY_CHALLENGE%%/%%VAR%%UID%%/%%VAR%%CODE_CHALLENGE%%'
        }, 'sms.pwd.recapture'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour modifier votre mot de passe.'
        }, 'mails.pwd.recovery.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe a expiré'
        }, 'mails.pwd.invalidation.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe a été invalidé. Vous pouvez utiliser la page de récupération du mot de passe accessible en cliquant sur le lien ci-dessous.'
        }, 'mails.pwd.invalidation.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe a expiré'
        }, 'mails.pwd.invalidation.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder1.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder2.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder1.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe expire dans 20 jours. Vous pouvez le modifier dans l\'administration, ou vous pouvez utiliser la procédure de réinitialisation du mot de passe, accessible en cliquant sur le lien ci- dessous.'
        }, 'mails.pwd.reminder1.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe arrive à expiration'
        }, 'mails.pwd.reminder2.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre mot de passe expire dans 3 jours. Vous pouvez le modifier dans l\'administration, ou vous pouvez utiliser la procédure de réinitialisation du mot de passe, accessible en cliquant sur le lien ci- dessous.'
        }, 'mails.pwd.reminder2.html'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion impossible. Vérifiez le mot de passe. Si votre mot de passe a été invalidé, vous devriez recevoir un mail vous invitant à le renouveler. Vous pouvez également utiliser la procédure d\'oubli du mot de passe en cliquant sur "Mot de passe oublié".'
        }, 'login.failed.message.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'LogAs'
        }, 'fields.labels.ref.user.__component__impersonate.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mise à jour de la langue et rechargement...'
        }, 'lang_selector.encours.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'lang_selector.lang_prefix.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'lang_selector.lang_suffix.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Consultez vos SMS'
        }, 'recover.oksms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Langue'
        }, 'lang_selector.label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Droits'
        }, 'fields.labels.ref.module_access_policy_accpol.___LABEL____module_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail d\'initialisation du mot de passe envoyé'
        }, 'sendinitpwd.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SMS d\'initialisation du mot de passe envoyé'
        }, 'sendinitpwd.oksms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail de relance'
        }, 'fields.labels.ref.user.__component__sendrecapture.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Relance compte inactif'
        }, 'MAILCATEGORY.UserRecapture.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail de relance envoyé'
        }, 'sendrecapture.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SMS de relance envoyé'
        }, 'sendrecapture.oksms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail init mdp'
        }, 'fields.labels.ref.user.__component__sendinitpwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Renvoyer le mail'
        }, 'login.reset.send_init_pwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Renvoyer le SMS'
        }, 'login.reset.send_init_pwd_sms.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pour des raisons de sécurité, le mail d\'initialisation du mot de passe a expiré. Vous devez faire une nouvelle procédure de récupération du mot de passe en cliquant sur "Renvoyer le mail" ou en utilisant la procédure d\'oubli de mot de passe sur la page de connexion.'
        }, 'login.reset.code_invalid.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dans la page de connexion, cliquez sur "oubli du mot de passe"'
        }, 'reset.code_invalid.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail renvoyé, merci de consulter votre messagerie'
        }, 'reset.sent_init_pwd.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'envoi du mail'
        }, 'session_share.mail_not_sent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mail envoyé'
        }, 'session_share.mail_sent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'envoi du SMS'
        }, 'session_share.sms_not_sent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lien de session partagée : '
        }, 'session_share.sms_preurl.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SMS envoyé'
        }, 'session_share.sms_sent.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Envoyer à cet email'
        }, 'session_share.email.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Envoyer par SMS à ce numéro'
        }, 'session_share.phone.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Partager la session'
        }, 'session_share.open_show.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer la session'
        }, 'session_share.delete_session.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Session supprimée'
        }, 'session_share.delete_session.success.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Informations"
        }, 'signin.informations.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Conditions d'utilisation"
        }, 'signin.cgu.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Un utilisateur avec cette adresse mail existe déjà'
        }, 'accesspolicy.user-create.mail.exists' + DefaultTranslation.DEFAULT_LABEL_EXTENSION));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Sessions des utilisateurs"
        }, 'menu.menuelements.admin.UserSessionVO.___LABEL___'));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_TEST_ACCESS, this.testAccess.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_CHECK_ACCESS, this.checkAccess.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ADMIN, this.isAdmin.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ROLE, this.isRole.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_MY_ROLES, this.getMyRoles.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, this.beginRecover.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS, this.beginRecoverSMS.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWD, this.resetPwd.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWDUID, this.resetPwdUID.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_checkCode, this.checkCode.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_checkCodeUID, this.checkCodeUID.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX, this.getAccessMatrix.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_TOGGLE_ACCESS, this.togglePolicy.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT, this.loginAndRedirect.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_SIGNIN_AND_REDIRECT, this.signinAndRedirect.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_ID, this.getLoggedUserId.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_NAME, this.getLoggedUserName.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_impersonateLogin, this.impersonateLogin.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_change_lang, this.change_lang.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_getMyLang, this.getMyLang.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_sendrecapture, this.sendrecapture.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_begininitpwd, this.begininitpwd.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_begininitpwdsms, this.begininitpwdsms.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_begininitpwd_uid, this.begininitpwd_uid.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_getSelfUser, this.getSelfUser.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_logout, this.logout.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_delete_session, this.delete_session.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_get_my_sid, this.get_my_sid.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_send_session_share_email, this.send_session_share_email.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_send_session_share_sms, this.send_session_share_sms.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_UID, this.BEGIN_RECOVER_UID.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS_UID, this.BEGIN_RECOVER_SMS_UID.bind(this));
    }

    /**
     * Privilégier cette fonction synchrone pour vérifier les droits côté serveur
     * @param policy_name
     */
    public checkAccessSync(policy_name: string, can_fail: boolean = false): boolean {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!policy_name)) {
            ConsoleHandler.getInstance().error('checkAccessSync:!policy_name');
            return false;
        }

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(policy_name);
        if (!target_policy) {
            ConsoleHandler.getInstance().error('checkAccessSync:!target_policy:' + policy_name + ':');
            return false;
        }

        let uid: number = StackContext.getInstance().get('UID');
        if (!uid) {
            // profil anonyme
            return AccessPolicyServerController.getInstance().checkAccessTo(
                target_policy,
                AccessPolicyServerController.getInstance().getUsersRoles(false, null),
                undefined, undefined, undefined, undefined, undefined, can_fail);
        }

        if (!AccessPolicyServerController.getInstance().get_registered_user_roles_by_uid(uid)) {
            ConsoleHandler.getInstance().warn('checkAccessSync:!get_registered_user_roles_by_uid:uid:' + uid + ':policy_name:' + policy_name + ':');
            return false;
        }

        return AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            AccessPolicyServerController.getInstance().getUsersRoles(true, uid),
            undefined, undefined, undefined, undefined, undefined, can_fail);
    }

    public async logout() {

        return new Promise(async (accept, reject) => {

            let user_log = null;
            let session = StackContext.getInstance().get('SESSION');

            if (session && session.uid) {
                let uid: number = session.uid;

                // On stocke le log de connexion en base
                user_log = new UserLogVO();
                user_log.user_id = uid;
                user_log.impersonated = (session && !!session.impersonated_from);
                user_log.log_time = Dates.now();
                user_log.referer = null;
                user_log.log_type = UserLogVO.LOG_TYPE_LOGOUT;
                if (session && !!session.impersonated_from) {
                    user_log.comment = 'Impersonated from user_id [' + uid + ']';
                }

                await StackContext.getInstance().runPromise(
                    { IS_CLIENT: false },
                    async () => {
                        await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                    });
            }

            /**
             * Gestion du impersonate => on restaure la session précédente
             */
            if (session && !!session.impersonated_from) {

                await ConsoleHandler.getInstance().log('unregisterSession:logout:impersonated_from');
                await PushDataServerController.getInstance().unregisterSession(session);

                session = Object.assign(session, session.impersonated_from);
                delete session.impersonated_from;

                session.save((err) => {
                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    }
                    accept(err);
                });
            } else {

                await ConsoleHandler.getInstance().log('unregisterSession:logout:uid:' + session.uid);
                await PushDataServerController.getInstance().unregisterSession(session);

                session.uid = null;
                session.save((err) => {
                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    }
                    accept(err);
                });
            }
        });
    }

    public async sendrecapture(text: string): Promise<void> {
        if (!text) {
            return;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_SENDRECAPTURE)) {
            return;
        }

        await UserRecapture.getInstance().beginrecapture(text);
    }

    public async begininitpwd(text: string): Promise<void> {
        if (!text) {
            return;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_SENDINITPWD)) {
            return;
        }

        await PasswordInitialisation.getInstance().begininitpwd(text);
    }

    public async begininitpwdsms(text: string): Promise<void> {
        if (!text) {
            return;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_SENDINITPWD)) {
            return;
        }

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        await PasswordInitialisation.getInstance().beginRecoverySMS(text);
    }

    public async BEGIN_RECOVER_UID(num: number): Promise<boolean> {
        if ((!ModuleAccessPolicy.getInstance().actif) || (!num)) {
            return false;
        }

        return PasswordRecovery.getInstance().beginRecovery_uid(num);
    }

    public async BEGIN_RECOVER_SMS_UID(num: number): Promise<boolean> {
        if ((!ModuleAccessPolicy.getInstance().actif) || (!num)) {
            return false;
        }

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        return PasswordRecovery.getInstance().beginRecoverySMS_uid(num);
    }

    public async begininitpwd_uid(num: number): Promise<void> {
        if (!num) {
            return;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_SENDINITPWD)) {
            return;
        }

        await PasswordInitialisation.getInstance().begininitpwd_uid(num);
    }

    public async addRoleToUser(user_id: number, role_id: number): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!user_id) || (!role_id)) {
            return;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return;
        }

        let userRole: UserRoleVO = await ModuleDAOServer.getInstance().selectOne<UserRoleVO>(UserRoleVO.API_TYPE_ID, " WHERE t.user_id = $1 and t.role_id = $2", [user_id, role_id]);

        if (!userRole) {
            userRole = new UserRoleVO();
            userRole.role_id = role_id;
            userRole.user_id = user_id;
            await ModuleDAO.getInstance().insertOrUpdateVO(userRole);
        }
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

        let user: UserVO = await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => await ModuleDAO.getInstance().getVoById(UserVO.API_TYPE_ID, user_id)) as UserVO;

        return user;
    }

    public async getMyLang(): Promise<LangVO> {

        let user: UserVO = await this.getSelfUser();
        if (!user) {
            return null;
        }
        return await ModuleDAO.getInstance().getVoById<LangVO>(LangVO.API_TYPE_ID, user.lang_id);
    }

    public async generate_challenge(user: UserVO) {

        // on génère un code qu'on stocke dans le user en base (en datant) et qu'on envoie par mail
        // Si un code existe déjà et n'a pas encore expiré, on le prolonge et on le renvoie pour pas invalider un mail qui serait très récent
        if (user.recovery_challenge && user.recovery_expiration && (user.recovery_expiration >= Dates.now())) {
            console.debug("challenge - pushing expiration:" + user.email + ':' + user.recovery_challenge + ':');
            user.recovery_expiration = Dates.add(Dates.now(), await ModuleParams.getInstance().getParamValueAsFloat(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS), TimeSegment.TYPE_HOUR);
            await ModuleDAO.getInstance().insertOrUpdateVO(user);
            return;
        }

        let challenge: string = TextHandler.getInstance().generateChallenge();
        user.recovery_challenge = challenge;
        console.debug("challenge:" + user.email + ':' + challenge + ':');
        user.recovery_expiration = Dates.add(Dates.now(), await ModuleParams.getInstance().getParamValueAsFloat(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS), TimeSegment.TYPE_HOUR);
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
    }

    public async change_lang(num: number): Promise<void> {
        if (!num) {
            return;
        }

        let user_id: number = this.getLoggedUserId();
        if (!user_id) {
            return;
        }

        await ModuleDAOServer.getInstance().query('update ' + VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].full_name + ' set ' +
            "lang_id=$1 where id=$2",
            [num, user_id]);
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

            if (!uid) {
                return true;
            }

            let res = await ModuleDAOServer.getInstance().query('select invalidated or blocked as invalidated from ' + VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].full_name + ' where id=$1', [uid]);
            let invalidated = (res && (res.length == 1) && (typeof res[0]['invalidated'] != 'undefined') && (res[0]['invalidated'] !== null)) ? res[0]['invalidated'] : false;
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

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(ModuleAccessPolicyServer.TASK_NAME_onBlockOrInvalidateUserDeleteSessions, uid)) {
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
                    await ConsoleHandler.getInstance().log('unregisterSession:onBlockOrInvalidateUserDeleteSessions:uid:' + session.uid);
                    await PushDataServerController.getInstance().unregisterSession(session);
                    session.destroy(() => {
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

    /**
     * A n'utiliser que dans des contextes attentifs à la sécu. pas de vérif de mdp ici.
     * @param uid
     * @returns
     */
    public async login(uid: number): Promise<boolean> {

        try {
            let session = StackContext.getInstance().get('SESSION');

            if (ModuleDAOServer.getInstance().global_update_blocker) {
                // On est en readonly partout, donc on informe sur impossibilité de se connecter
                await PushDataServerController.getInstance().notifySession(
                    'error.global_update_blocker.activated.___LABEL___',
                    NotificationVO.SIMPLE_ERROR
                );
                return false;
            }

            if (!uid) {
                return false;
            }

            let user: UserVO = null;

            await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {
                user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, uid);
            });

            if (!user) {
                return false;
            }

            if (user.blocked) {
                return false;
            }

            if (!user.logged_once) {
                user.logged_once = true;
                await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user);
                });
            }

            session.uid = user.id;

            PushDataServerController.getInstance().registerSession(session);

            // On stocke le log de connexion en base
            let user_log = new UserLogVO();
            user_log.user_id = user.id;
            user_log.log_time = Dates.now();
            user_log.impersonated = false;
            user_log.referer = StackContext.getInstance().get('REFERER');
            user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;

            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                });

            await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();

            return true;
        } catch (error) {
            ConsoleHandler.getInstance().error("login uid:" + uid + ":" + error);
        }

        return false;
    }

    public getLoggedUserId(): number {

        try {

            let session = StackContext.getInstance().get('SESSION');

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

            let session = StackContext.getInstance().get('SESSION');

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

            let session = StackContext.getInstance().get('SESSION');

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

            let session = StackContext.getInstance().get('SESSION');

            return (session && session.impersonated_from) ? session.impersonated_from as IServerUserSession : null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public getUserSession(): IServerUserSession {

        try {

            return StackContext.getInstance().get('SESSION') as IServerUserSession;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public checkAccessByRoleIds(role_ids: number[]): boolean {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!role_ids) || (!role_ids.length)) {
            return false;
        }

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
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

    public async delete_sessions_from_other_thread(session_to_delete_by_sids: { [sid: string]: IServerUserSession }) {
        if (!session_to_delete_by_sids) {
            return;
        }

        for (let sid in session_to_delete_by_sids) {
            await StackContext.getInstance().runPromise(
                { SESSION: session_to_delete_by_sids[sid] },
                async () => {
                    await this.delete_session();
                }
            );
        }
    }

    private async togglePolicy(policy_id: number, role_id: number): Promise<boolean> {
        if ((!policy_id) || (!role_id)) {
            return false;
        }

        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return false;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy_by_id(policy_id);
        let role: RoleVO = AccessPolicyServerController.getInstance().get_registered_role_by_id(role_id);
        /**
         * Le but est d'avoir false, donc on esquive le log et la déco avec le dernier param
         */
        if (AccessPolicyServerController.getInstance().checkAccessTo(
            target_policy,
            { [role.id]: role }, undefined, undefined, undefined, undefined, role, true)) {
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
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return false;
        }

        return true;
    }

    private async getAccessMatrix(bool: boolean): Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> {
        return await AccessPolicyServerController.getInstance().getAccessMatrix(bool);
    }

    private async getMyRoles(): Promise<RoleVO[]> {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return null;
        }

        let uid: number = StackContext.getInstance().get('UID');

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
    private async isRole(text: string): Promise<boolean> {
        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return false;
        }

        let uid: number = StackContext.getInstance().get('UID');

        if (!uid) {
            return false;
        }

        let userRoles: UserRoleVO = await ModuleDAOServer.getInstance().selectOne<UserRoleVO>(
            UserRoleVO.API_TYPE_ID,
            " join " + VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID].full_name + " r on r.id = t.role_id " +
            " where t.user_id = $1 and r.translatable_name = $2",
            [uid, text],
            [UserVO.API_TYPE_ID, RoleVO.API_TYPE_ID]);

        if (userRoles) {
            return true;
        }

        return false;
    }

    private async isAdmin(): Promise<boolean> {
        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return false;
        }

        let uid: number = StackContext.getInstance().get('UID');

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

    private async testAccess(policy_name: string): Promise<boolean> {

        return this.checkAccessSync(policy_name, true);
    }

    private async checkAccess(policy_name: string): Promise<boolean> {

        return this.checkAccessSync(policy_name);
    }

    private async beginRecover(text: string): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!text)) {
            return false;
        }

        return PasswordRecovery.getInstance().beginRecovery(text);
    }

    private async beginRecoverSMS(text: string): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!text)) {
            return false;
        }

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        return PasswordRecovery.getInstance().beginRecoverySMS(text);
    }

    private async checkCode(email: string, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return false;
        }

        return await PasswordReset.getInstance().checkCode(email, challenge);
    }

    private async checkCodeUID(uid: number, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return false;
        }

        return await PasswordReset.getInstance().checkCodeUID(uid, challenge);
    }

    private async resetPwd(email: string, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwd(email, challenge, new_pwd1);
    }

    private async resetPwdUID(uid: number, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwdUID(uid, challenge, new_pwd1);
    }

    private async handleTriggerUserVOUpdate(vo_update_holder: DAOUpdateVOHolder<UserVO>): Promise<boolean> {

        if ((!vo_update_holder.post_update_vo) || (!vo_update_holder.post_update_vo.password) || (!vo_update_holder.post_update_vo.id)) {
            return true;
        }

        if ((!vo_update_holder.pre_update_vo) || (vo_update_holder.pre_update_vo.password == vo_update_holder.post_update_vo.password)) {
            return true;
        }

        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo_update_holder.post_update_vo, vo_update_holder.post_update_vo.password);

        return true;
    }

    private async handleTriggerUserVOCreate(vo: UserVO): Promise<boolean> {
        if ((!vo) || (!vo.password)) {
            return true;
        }
        let user: UserVO = await ModuleDAOServer.getInstance().selectOne<UserVO>(UserVO.API_TYPE_ID, " where email=$1", [vo.email]);
        if (!!user) {
            await ModuleAccessPolicyServer.getInstance().sendErrorMsg('accesspolicy.user-create.mail.exists' + DefaultTranslation.DEFAULT_LABEL_EXTENSION);
            return false;
        }
        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(vo, vo.password);

        // On ajoute la date de création
        if (!vo.creation_date) {
            vo.creation_date = Dates.now();
        }

        return true;
    }

    private async onCreateAccessPolicyVO(vo: AccessPolicyVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_policy, vo);
        return;
    }

    private async onCreatePolicyDependencyVO(vo: PolicyDependencyVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_policy_dependency, vo);
        return;
    }

    private async onCreateRolePolicyVO(vo: RolePolicyVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_role_policy, vo);
        return;
    }

    private async onCreateRoleVO(vo: RoleVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_role, vo);
        return;
    }

    private async onCreateUserRoleVO(vo: UserRoleVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_set_registered_user_role, vo);
        return;
    }

    private async onUpdateAccessPolicyVO(vo_update_holder: DAOUpdateVOHolder<AccessPolicyVO>): Promise<void> {
        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_registered_policy, vo_update_holder);
    }

    private async onUpdatePolicyDependencyVO(vo_update_holder: DAOUpdateVOHolder<PolicyDependencyVO>): Promise<void> {
        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_policy_dependency, vo_update_holder);
    }

    private async onUpdateRolePolicyVO(vo_update_holder: DAOUpdateVOHolder<RolePolicyVO>): Promise<void> {
        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_role_policy, vo_update_holder);
    }

    private async onUpdateRoleVO(vo_update_holder: DAOUpdateVOHolder<RoleVO>): Promise<void> {
        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_role, vo_update_holder);
    }

    private async onUpdateUserRoleVO(vo_update_holder: DAOUpdateVOHolder<UserRoleVO>): Promise<void> {
        await ForkedTasksController.getInstance().broadexec(AccessPolicyServerController.TASK_NAME_update_user_role, vo_update_holder);
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

    private async signinAndRedirect(nom: string, email: string, password: string, redirect_to: string): Promise<number> {

        try {
            let session = StackContext.getInstance().get('SESSION');

            if (ModuleDAOServer.getInstance().global_update_blocker) {
                // On est en readonly partout, donc on informe sur impossibilité de se connecter
                await PushDataServerController.getInstance().notifySession(
                    'error.global_update_blocker.activated.___LABEL___',
                    NotificationVO.SIMPLE_ERROR
                );
                return null;
            }

            if (session && session.uid) {
                await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();
                return session.uid;
            }

            session.uid = null;

            if ((!email) || (!password) || (!nom)) {
                return null;
            }

            return await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {
                let user: UserVO = await ModuleDAOServer.getInstance().selectOneUser(email, password);

                if (!!user) {

                    if (user.invalidated) {

                        await PasswordRecovery.getInstance().beginRecovery(user.email);

                    }
                    return null;
                } else {
                    user = new UserVO();
                }


                user.logged_once = true;
                user.name = nom;
                user.password = password;
                user.email = email;
                user.blocked = false;
                user.reminded_pwd_1 = false;
                user.reminded_pwd_2 = false;
                user.invalidated = false;
                user.recovery_challenge = "";
                user.phone = "";
                user.recovery_expiration = 0;
                user.password_change_date = Dates.now();
                user.creation_date = Dates.now();


                // Pour la création d'un User, on utilise la première Lang qui est en BDD et si ca doit changer ca se fera dans un trigger dans le projet
                let langs: LangVO[] = await ModuleDAO.getInstance().getVos(LangVO.API_TYPE_ID);
                user.lang_id = langs[0].id;
                // let res: InsertOrDeleteQueryResult = await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () =>
                //     await ModuleDAO.getInstance().insertOrUpdateVO(user)) as InsertOrDeleteQueryResult;


                let insertOrDeleteQueryResult = null;

                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(user);

                if (!res || !res.id) {
                    throw new Error();
                }
                session.uid = res.id;
                PushDataServerController.getInstance().registerSession(session);

                // On stocke le log de connexion en base
                let user_log = new UserLogVO();
                user_log.user_id = res.id;
                user_log.log_time = Dates.now();
                user_log.impersonated = false;
                user_log.referer = StackContext.getInstance().get('REFERER');
                user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;

                // On await pas ici on se fiche du résultat
                await StackContext.getInstance().runPromise(
                    { IS_CLIENT: false },
                    async () => {
                        await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                    });

                await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();

                return res.id;

            });
        } catch (error) {
            ConsoleHandler.getInstance().error("login:" + email + ":" + error);
        }

        return null;
    }

    private async loginAndRedirect(email: string, password: string, redirect_to: string): Promise<number> {

        try {
            let session = StackContext.getInstance().get('SESSION');

            if (ModuleDAOServer.getInstance().global_update_blocker) {
                // On est en readonly partout, donc on informe sur impossibilité de se connecter
                await PushDataServerController.getInstance().notifySession(
                    'error.global_update_blocker.activated.___LABEL___',
                    NotificationVO.SIMPLE_ERROR
                );
                return null;
            }

            if (session && session.uid) {
                await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();
                return session.uid;
            }

            session.uid = null;

            if ((!email) || (!password)) {
                return null;
            }

            let user: UserVO = null;

            if (AccessPolicyServerController.getInstance().hook_user_login) {
                user = await AccessPolicyServerController.getInstance().hook_user_login(email, password);
            } else {
                user = await ModuleDAOServer.getInstance().selectOneUser(email, password);
            }

            if (!user) {
                return null;
            }

            if (user.blocked) {
                return null;
            }

            if (user.invalidated) {

                // Si le mot de passe est invalidé on refuse la connexion mais on envoie aussi un mail pour récupérer le mot de passe si on l'a pas déjà envoyé
                // if ((!user.recovery_expiration) || (user.recovery_expiration<=Dates.now())) {
                await PasswordRecovery.getInstance().beginRecovery(user.email);
                // }
                return null;
            }

            if (!user.logged_once) {
                user.logged_once = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(user);
            }

            session.uid = user.id;

            PushDataServerController.getInstance().registerSession(session);

            // On stocke le log de connexion en base
            let user_log = new UserLogVO();
            user_log.user_id = user.id;
            user_log.log_time = Dates.now();
            user_log.impersonated = false;
            user_log.referer = StackContext.getInstance().get('REFERER');
            user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;

            // On await pas ici on se fiche du résultat
            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                });

            await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();

            return user.id;
        } catch (error) {
            ConsoleHandler.getInstance().error("login:" + email + ":" + error);
        }

        return null;
    }

    private async impersonateLogin(email: string, password: string, redirect_to: string): Promise<number> {

        try {
            let session = StackContext.getInstance().get('SESSION');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

            if (ModuleDAOServer.getInstance().global_update_blocker) {
                // On est en readonly partout, donc on informe sur impossibilité de se connecter
                await PushDataServerController.getInstance().notifySimpleERROR(
                    StackContext.getInstance().get('UID'),
                    StackContext.getInstance().get('CLIENT_TAB_ID'),
                    'error.global_update_blocker.activated.___LABEL___'
                );
                return null;
            }

            if ((!session) || (!session.uid)) {
                return null;
            }

            if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_IMPERSONATE)) {
                return null;
            }

            if (!email) {
                return null;
            }

            let user: UserVO = await ModuleDAOServer.getInstance().selectOne<UserVO>(UserVO.API_TYPE_ID, " where email=$1", [email]);

            if (!user) {
                return null;
            }

            if (user.blocked || user.invalidated) {
                ConsoleHandler.getInstance().error("impersonate login:" + email + ":blocked or invalidated");
                await PushDataServerController.getInstance().notifySimpleERROR(session.uid, CLIENT_TAB_ID, 'Impossible de se connecter avec un compte bloqué ou invalidé', true);
                return null;
            }

            session.impersonated_from = Object.assign({}, session);
            session.uid = user.id;

            PushDataServerController.getInstance().registerSession(session);

            // On stocke le log de connexion en base
            let user_log = new UserLogVO();
            user_log.user_id = user.id;
            user_log.log_time = Dates.now();
            user_log.impersonated = true;
            user_log.referer = StackContext.getInstance().get('REFERER');
            user_log.log_type = UserLogVO.LOG_TYPE_LOGIN;
            user_log.comment = 'Impersonated from user_id [' + session.impersonated_from.uid + ']';

            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                });

            await PushDataServerController.getInstance().notifyUserLoggedAndRedirectHome();

            return user.id;
        } catch (error) {
            ConsoleHandler.getInstance().error("impersonate login:" + email + ":" + error);
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
        let uid: number = StackContext.getInstance().get('UID');
        let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

        await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, msg_translatable_code);
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

    private async trimAndCheckUnicityUserUpdate(vo_update_holder: DAOUpdateVOHolder<UserVO>) {
        return ModuleAccessPolicyServer.getInstance().trimAndCheckUnicityUser(vo_update_holder.post_update_vo);
    }

    private async trimAndCheckUnicityUser(user: UserVO) {

        try {
            user.name = user.name.trim();
            user.email = user.email.trim();
            user.phone = user.phone ? user.phone.trim() : null;

            return await ModuleDAOServer.getInstance().selectUsersForCheckUnicity(user.name, user.email, user.phone, user.id);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return false;
    }


    private async checkBlockingOrInvalidatingUserUpdate(vo_update_holder: DAOUpdateVOHolder<UserVO>) {
        return ModuleAccessPolicyServer.getInstance().checkBlockingOrInvalidatingUser_(vo_update_holder.post_update_vo, vo_update_holder.pre_update_vo);

    }

    private async checkBlockingOrInvalidatingUser(user: UserVO) {
        let old_user: UserVO = null;
        if (!!user.id) {
            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    old_user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, user.id);
                });
        }

        return ModuleAccessPolicyServer.getInstance().checkBlockingOrInvalidatingUser_(user, old_user);
    }

    private async checkBlockingOrInvalidatingUser_(user: UserVO, bdd_user: UserVO) {

        if (user.blocked && !bdd_user) {
            // On a pas de sessions à supprimer en cas de création
        } else if (user.blocked && !bdd_user.blocked) {
            await ModuleAccessPolicyServer.getInstance().onBlockOrInvalidateUserDeleteSessions(user.id);
            return true;
        }

        if (user.invalidated && !bdd_user) {
            // On a pas de sessions à supprimer en cas de création
        } else if (user.invalidated && !bdd_user.invalidated) {
            await ModuleAccessPolicyServer.getInstance().onBlockOrInvalidateUserDeleteSessions(user.id);
            return true;
        }

        return true;
    }

    private async send_session_share_email(mail_category: string, url: string, email: string) {
        let SEND_IN_BLUE_TEMPLATE_ID = await ModuleParams.getInstance().getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_SESSION_SHARE_SEND_IN_BLUE_MAIL_ID);
        await SendInBlueMailServerController.getInstance().sendWithTemplate(
            mail_category,
            SendInBlueMailVO.createNew(email, email),
            SEND_IN_BLUE_TEMPLATE_ID,
            ['session_share'],
            {
                SESSION_SHARE_URL: url,
                SESSION_SHARE_URL_LINK: url.substr(url.indexOf('://') + 3, url.length)
            });
    }

    private async send_session_share_sms(text: string, phone: string) {
        await SendInBlueSmsServerController.getInstance().send(
            SendInBlueSmsFormatVO.createNew(phone),
            text,
            'session_share');
    }

    private get_my_sid(res: Response) {
        // let session = StackContext.getInstance().get('SESSION');
        // if (!session) {
        //     return null;
        // }
        // return session.id;
        return res.req.cookies['sid'];
    }

    private async delete_session() {

        /**
         * On veut supprimer la session et déconnecter tout le monde
         */
        let user_log = null;
        let session = StackContext.getInstance().get('SESSION');

        if (session && session.uid) {
            let uid: number = session.uid;

            // On stocke le log de connexion en base
            user_log = new UserLogVO();
            user_log.user_id = uid;
            user_log.impersonated = (session && !!session.impersonated_from);
            user_log.log_time = Dates.now();
            user_log.referer = null;
            user_log.log_type = UserLogVO.LOG_TYPE_LOGOUT;
            if (session && !!session.impersonated_from) {
                user_log.comment = 'Impersonated from user_id [' + uid + ']';
            }

            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                });
        }

        /**
         * Gestion du impersonate => dans le cas présent on logout aussi le compte principal
         */
        if (session && !!session.impersonated_from) {

            await ConsoleHandler.getInstance().log('unregisterSession:delete_session:impersonated_from:uid:' + session.uid);
            await PushDataServerController.getInstance().unregisterSession(session, false);

            session = Object.assign(session, session.impersonated_from);
            delete session.impersonated_from;

            let uid: number = session.uid;

            // On stocke le log de connexion en base
            user_log = new UserLogVO();
            user_log.user_id = uid;
            user_log.impersonated = false;
            user_log.log_time = Dates.now();
            user_log.referer = null;
            user_log.log_type = UserLogVO.LOG_TYPE_LOGOUT;

            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                });

            await ConsoleHandler.getInstance().log('unregisterSession:delete_session:uid:' + session.uid);
            await PushDataServerController.getInstance().unregisterSession(session, true);
            session.destroy((err) => {
                if (err) {
                    ConsoleHandler.getInstance().log(err);
                }
            });
        } else {

            await ConsoleHandler.getInstance().log('unregisterSession:delete_session:uid:' + session.uid);
            await PushDataServerController.getInstance().unregisterSession(session, true);

            session.uid = null;
            session.destroy((err) => {
                if (err) {
                    ConsoleHandler.getInstance().log(err);
                }
            });
        }
    }
}
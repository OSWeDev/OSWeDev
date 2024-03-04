/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import BooleanParamVO, { BooleanParamVOStatic } from '../API/vos/apis/BooleanParamVO';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleVO from '../ModuleVO';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import LangVO from '../Translation/vos/LangVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import AccessPolicyGroupVO from './vos/AccessPolicyGroupVO';
import AccessPolicyVO from './vos/AccessPolicyVO';
import PolicyDependencyVO from './vos/PolicyDependencyVO';
import RolePolicyVO from './vos/RolePolicyVO';
import RoleVO from './vos/RoleVO';
import UserAPIVO from './vos/UserAPIVO';
import UserLogVO from './vos/UserLogVO';
import UserRoleVO from './vos/UserRoleVO';
import UserSessionVO from './vos/UserSessionVO';
import UserVO from './vos/UserVO';
import LoginParamVO, { LoginParamVOStatic } from './vos/apis/LoginParamVO';
import ResetPwdParamVO, { ResetPwdParamVOStatic } from './vos/apis/ResetPwdParamVO';
import ResetPwdUIDParamVO, { ResetPwdUIDParamVOStatic } from './vos/apis/ResetPwdUIDParamVO';
import SigninParamVO, { SigninParamVOStatic } from './vos/apis/SigninParamVO';
import ToggleAccessParamVO, { ToggleAccessParamVOStatic } from './vos/apis/ToggleAccessParamVO';

export default class ModuleAccessPolicy extends Module {

    public static MODULE_NAME: string = "AccessPolicy";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".FO_ACCESS";

    public static POLICY_SESSIONSHARE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".SESSIONSHARE_ACCESS";

    public static POLICY_IMPERSONATE: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".IMPERSONATE";
    public static POLICY_SENDINITPWD: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".SENDINITPWD";
    public static POLICY_SENDRECAPTURE: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".SENDRECAPTURE";

    public static POLICY_FO_SIGNIN_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".FO_SIGNIN_ACCESS";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_BO_MODULES_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_MODULES_MANAGMENT_ACCESS";
    public static POLICY_BO_RIGHTS_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_RIGHTS_MANAGMENT_ACCESS";
    public static POLICY_BO_USERS_LIST_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_USERS_LIST_ACCESS";
    public static POLICY_BO_USERS_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_USERS_MANAGMENT_ACCESS";

    public static ROLE_ADMIN: string = AccessPolicyTools.ROLE_UID_PREFIX + 'admin';
    public static ROLE_LOGGED: string = AccessPolicyTools.ROLE_UID_PREFIX + 'logged';
    public static ROLE_ANONYMOUS: string = AccessPolicyTools.ROLE_UID_PREFIX + 'anonymous';

    public static APINAME_impersonateLogin = "impersonateLogin";
    public static APINAME_impersonate = "impersonate";
    public static APINAME_change_lang = "change_lang";
    public static APINAME_CHECK_ACCESS = "ACCESS_CHECK_ACCESS";
    public static APINAME_TEST_ACCESS = "ACCESS_TEST_ACCESS";
    public static APINAME_IS_ADMIN = "IS_ADMIN";
    public static APINAME_IS_ROLE = "IS_ROLE";
    public static APINAME_GET_USER_ROLES = "GET_USER_ROLES";
    public static APINAME_GET_MY_ROLES = "GET_MY_ROLES";
    public static APINAME_ADD_ROLE_TO_USER = "ADD_ROLE_TO_USER";
    public static APINAME_BEGIN_RECOVER = "BEGIN_RECOVER";
    public static APINAME_BEGIN_RECOVER_SMS = "BEGIN_RECOVER_SMS";
    public static APINAME_RESET_PWD = "RESET_PWD";
    public static APINAME_BEGIN_RECOVER_UID = "BEGIN_RECOVER_UID";
    public static APINAME_BEGIN_RECOVER_SMS_UID = "BEGIN_RECOVER_SMS_UID";
    public static APINAME_TOGGLE_ACCESS = "TOGGLE_ACCESS";
    public static APINAME_GET_ACCESS_MATRIX = "GET_ACCESS_MATRIX";
    public static APINAME_LOGIN_AND_REDIRECT = "LOGIN_AND_REDIRECT";
    public static APINAME_SIGNIN_AND_REDIRECT = "SIGNIN_AND_REDIRECT";
    public static APINAME_GET_LOGGED_USER_ID = "GET_LOGGED_USER_ID";
    public static APINAME_GET_LOGGED_USER_NAME = "GET_LOGGED_USER_NAME";
    public static APINAME_RESET_PWDUID = "RESET_PWDUID";
    public static APINAME_getMyLang = "getMyLang";
    public static APINAME_begininitpwd = "begininitpwd";
    public static APINAME_begininitpwdsms = "begininitpwdsms";
    public static APINAME_begininitpwd_uid = "begininitpwd_uid";
    public static APINAME_getSelfUser = "getSelfUser";
    public static APINAME_checkCode = "checkCode";
    public static APINAME_checkCodeUID = "checkCodeUID";
    public static APINAME_logout = "logout";
    public static APINAME_delete_session = "delete_session";
    public static APINAME_get_my_sid = "get_my_sid";
    public static APINAME_sendrecapture = "sendrecapture";

    public static APINAME_GET_AVATAR_URL = ModuleAccessPolicy.MODULE_NAME + ".get_avatar_url";
    public static APINAME_GET_AVATAR_NAME = ModuleAccessPolicy.MODULE_NAME + ".get_avatar_name";

    public static APINAME_send_session_share_email = "send_session_share_email";
    public static APINAME_send_session_share_sms = "send_session_share_sms";

    public static PARAM_NAME_REMINDER_PWD1_DAYS = 'reminder_pwd1_days';
    public static PARAM_NAME_REMINDER_PWD2_DAYS = 'reminder_pwd2_days';
    public static PARAM_NAME_PWD_INVALIDATION_DAYS = 'pwd_invalidation_days';
    public static PARAM_NAME_RECOVERY_HOURS = 'recovery_hours';
    public static PARAM_NAME_CAN_RECOVER_PWD_BY_SMS = 'ModuleAccessPolicy.CAN_RECOVER_PWD_BY_SMS';
    public static PARAM_NAME_SESSION_SHARE_SEND_IN_BLUE_MAIL_ID = 'ModuleAccessPolicy.SESSION_SHARE_SEND_IN_BLUE_MAIL_ID';

    public static PARAM_NAME_LOGIN_INFOS = 'ModuleAccessPolicy.LOGIN_INFOS';
    public static PARAM_NAME_LOGIN_CGU = 'ModuleAccessPolicy.LOGIN_CGU';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAccessPolicy {
        if (!ModuleAccessPolicy.instance) {
            ModuleAccessPolicy.instance = new ModuleAccessPolicy();
        }
        return ModuleAccessPolicy.instance;
    }

    private static instance: ModuleAccessPolicy = null;

    public sendrecapture: (email: string) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_sendrecapture);
    public begininitpwd: (email: string) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_begininitpwd);
    public begininitpwdsms: (email: string) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_begininitpwdsms);
    public begininitpwd_uid: (uid: number) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_begininitpwd_uid);
    public getSelfUser: () => Promise<UserVO> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_getSelfUser);
    public getMyLang: () => Promise<LangVO> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_getMyLang);
    public logout: () => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_logout);
    public delete_session: () => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_delete_session);
    public get_my_sid: () => Promise<string> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_get_my_sid);
    public send_session_share_email: (url: string, email: string) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_send_session_share_email);
    public send_session_share_sms: (text: string, phone: string) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_send_session_share_sms);
    public change_lang: (lang_id: number) => Promise<void> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_change_lang);
    public getLoggedUserId: () => Promise<number> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_ID);
    public getLoggedUserName: () => Promise<string> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_LOGGED_USER_NAME);
    public impersonateLogin: (email: string) => Promise<number> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_impersonateLogin);
    public impersonate: (uid: number) => Promise<number> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_impersonate);
    public loginAndRedirect: (email: string, password: string, redirect_to: string) => Promise<number> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT);
    public signinAndRedirect: (nom: string, email: string, password: string, redirect_to: string) => Promise<number> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_SIGNIN_AND_REDIRECT);
    public getAccessMatrix: (inherited_only: boolean) => Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX);
    public togglePolicy: (policy_id: number, role_id: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_TOGGLE_ACCESS);
    /**
     * WARN : Uniquement à usage côté client, côté serveur pour les performances préférer l'appel directement à checkAccessSync sur le module server
     * @param policy_name Le titre de la policy, qui doit être unique sur tous les groupes de toutes façons
     */
    public checkAccess: (policy_name: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_CHECK_ACCESS);
    /**
     * WARN : Uniquement à usage côté client, côté serveur pour les performances préférer l'appel directement à checkAccessSync sur le module server
     * Permet de tester un accès sans générer de log d'erreur en cas de refus
     * @param policy_name Le titre de la policy, qui doit être unique sur tous les groupes de toutes façons
     */
    public testAccess: (policy_name: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_TEST_ACCESS);
    public beginRecover: (email: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_BEGIN_RECOVER);
    public beginRecoverSMS: (email: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS);
    public beginRecoverUID: (uid: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_UID);
    public beginRecoverSMSUID: (uid: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS_UID);
    public resetPwd: (email: string, challenge: string, new_pwd1: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_RESET_PWD);
    public resetPwdUID: (uid: number, challenge: string, new_pwd1: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_RESET_PWDUID);
    public checkCode: (email: string, challenge: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_checkCode);
    public checkCodeUID: (uid: number, challenge: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_checkCodeUID);
    public isAdmin: () => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_IS_ADMIN);
    public isRole: (role_translatable_name: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_IS_ROLE);
    public getMyRoles: () => Promise<RoleVO[]> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_MY_ROLES);
    public get_user_roles: (uid: number) => Promise<RoleVO[]> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_USER_ROLES);
    public get_avatar_url: (uid: number) => Promise<string> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_AVATAR_URL);
    public get_avatar_name: (uid: number) => Promise<string> = APIControllerWrapper.sah(ModuleAccessPolicy.APINAME_GET_AVATAR_NAME);

    private constructor() {

        super("access_policy", ModuleAccessPolicy.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_CHECK_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_TEST_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<void, string>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_get_my_sid,
            []
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_logout,
            [UserLogVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_delete_session,
            [UserLogVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, boolean>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_send_session_share_email,
            [],
            String2ParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, boolean>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_send_session_share_sms,
            [],
            String2ParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_IS_ADMIN,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, UserVO>(
            null,
            ModuleAccessPolicy.APINAME_getSelfUser,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_IS_ROLE,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<BooleanParamVO, { [policy_id: number]: { [role_id: number]: boolean } }>(
            ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
            ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX,
            [AccessPolicyVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, PolicyDependencyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID],
            BooleanParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, RoleVO[]>(
            null,
            ModuleAccessPolicy.APINAME_GET_USER_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, string>(
            null,
            ModuleAccessPolicy.APINAME_GET_AVATAR_NAME,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, string>(
            null,
            ModuleAccessPolicy.APINAME_GET_AVATAR_URL,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, RoleVO[]>(
            null,
            ModuleAccessPolicy.APINAME_GET_MY_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, number>(
            null,
            ModuleAccessPolicy.APINAME_GET_LOGGED_USER_ID,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, string>(
            null,
            ModuleAccessPolicy.APINAME_GET_LOGGED_USER_NAME,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, LangVO>(
            null,
            ModuleAccessPolicy.APINAME_getMyLang,
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwdsms,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_sendrecapture,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwd,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwd_uid,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_UID,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS_UID,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_RESET_PWD,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ResetPwdUIDParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_RESET_PWDUID,
            [UserVO.API_TYPE_ID],
            ResetPwdUIDParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_checkCode,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ResetPwdUIDParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_checkCodeUID,
            [UserVO.API_TYPE_ID],
            ResetPwdUIDParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ToggleAccessParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_TOGGLE_ACCESS,
            [RolePolicyVO.API_TYPE_ID],
            ToggleAccessParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<LoginParamVO, number>(
            null,
            ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT,
            [UserVO.API_TYPE_ID],
            LoginParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<SigninParamVO, number>(
            null,
            ModuleAccessPolicy.APINAME_SIGNIN_AND_REDIRECT,
            [UserVO.API_TYPE_ID],
            SigninParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<LoginParamVO, number>(
            ModuleAccessPolicy.POLICY_IMPERSONATE,
            ModuleAccessPolicy.APINAME_impersonateLogin,
            [UserVO.API_TYPE_ID],
            LoginParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, number>(
            ModuleAccessPolicy.POLICY_IMPERSONATE,
            ModuleAccessPolicy.APINAME_impersonate,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, UserVO>(
            null,
            ModuleAccessPolicy.APINAME_change_lang,
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

    }

    public initialize() {
        this.initializeUser();
        // Pour le moment on initialize pas car conflit entre la génération de la table et le module pgsession
        this.initializeUserSession();
        this.initializeRole();
        this.initializeUserRoles();
        this.initializeModuleAccessPolicyGroup();
        this.initializeModuleAccessPolicy();
        this.initializeModulePolicyDependency();
        this.initializeRolesPolicies();
        this.initializeUserLogVO();
        this.initializeUserAPIVO();
    }

    private initializeUserAPIVO() {
        let label = new ModuleTableField(field_names<UserAPIVO>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let field_user_id = new ModuleTableField(field_names<UserAPIVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let datatable_fields = [
            label,
            field_user_id,
            new ModuleTableField(field_names<UserAPIVO>().api_key, ModuleTableField.FIELD_TYPE_string, 'API Key', true).unique()
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserAPIVO.API_TYPE_ID, () => new UserAPIVO(), datatable_fields, label, new DefaultTranslation({ 'fr-fr': "Clefs d'API des utilisateurs" }));

        field_user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeUser() {
        const field_lang_id = ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': 'Langue' }), true, true, 1);
        const label_field = (ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Login' }), true)).unique();
        const datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().firstname, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Prénom' }), false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().lastname, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), false),
            (ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().email, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': 'E-mail' }), true)).unique(),
            (ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().phone, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Téléphone' }))).unique(),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().blocked, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Compte bloqué' }), true, true, false).set_boolean_default_icons("fa-lock", "fa-unlock").set_boolean_invert_colors(),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().password, ModuleTableFieldVO.FIELD_TYPE_password, DefaultTranslationVO.create_new({ 'fr-fr': 'Mot de passe' }), true),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().password_change_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Date de changement du mot de passe' }), false).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().reminded_pwd_1, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Premier rappel envoyé' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().reminded_pwd_2, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Second rappel envoyé' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().invalidated, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Mot de passe expiré' }), true, true, false),
            field_lang_id,
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().recovery_challenge, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Challenge de récupération' }), false, true, ""),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().recovery_expiration, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Expiration du challenge' }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().logged_once, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Connecté au moins 1 fois' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Date de création' })).set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, UserVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateurs" }));
        field_lang_id.set_many_to_one_target_moduletable_name(LangVO.API_TYPE_ID);
        datatable.set_bdd_ref('ref', 'user');

        datatable.set_is_archived();

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID]);
    }

    private initializeUserSession() {
        const label_field = ModuleTableFieldController.create_new(UserSessionVO.API_TYPE_ID, field_names<UserSessionVO>().sid, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'SID' })).unique();

        const datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(UserSessionVO.API_TYPE_ID, field_names<UserSessionVO>().sess, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Information session' })),
            ModuleTableFieldController.create_new(UserSessionVO.API_TYPE_ID, field_names<UserSessionVO>().expire, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Expiration' })).set_format_localized_time(true).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, UserSessionVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Sessions des utilisateurs" }));
        datatable.set_bdd_ref('ref', UserSessionVO.API_TYPE_ID);
    }

    private initializeRole() {
        const label_field = ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true);
        const parent_role_id = ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().parent_role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle parent');

        const datatable_fields = [
            label_field,
            parent_role_id,
            ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, RoleVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Rôles" }));
        parent_role_id.donotCascadeOnDelete();
        parent_role_id.set_many_to_one_target_moduletable_name(datatable.vo_type);
    }

    private initializeUserRoles() {
        const field_user_id = ModuleTableFieldController.create_new(UserRoleVO.API_TYPE_ID, field_names<UserRoleVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true, true, 0);
        const field_role_id = ModuleTableFieldController.create_new(UserRoleVO.API_TYPE_ID, field_names<UserRoleVO>().role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        const datatable_fields = [
            field_user_id,
            field_role_id,
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, UserRoleVO, null, DefaultTranslationVO.create_new({ 'fr-fr': "Rôles des utilisateurs" }));

        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        field_role_id.set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);

    }

    private initializeModuleAccessPolicyGroup() {

        const label_field = ModuleTableFieldController.create_new(AccessPolicyGroupVO.API_TYPE_ID, field_names<AccessPolicyGroupVO>().translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true);
        const datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(AccessPolicyGroupVO.API_TYPE_ID, field_names<AccessPolicyGroupVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, AccessPolicyGroupVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Groupe de droits" }));

    }

    private initializeModuleAccessPolicy() {
        const label_field = ModuleTableFieldController.create_new(AccessPolicyVO.API_TYPE_ID, field_names<AccessPolicyVO>().translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true);
        const field_accpolgroup_id = ModuleTableFieldController.create_new(AccessPolicyVO.API_TYPE_ID, field_names<AccessPolicyVO>().group_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Group', false);
        const field_module_id = ModuleTableFieldController.create_new(AccessPolicyVO.API_TYPE_ID, field_names<AccessPolicyVO>().module_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Module', false);
        const datatable_fields = [
            label_field,
            field_accpolgroup_id,
            field_module_id,
            ModuleTableFieldController.create_new(AccessPolicyVO.API_TYPE_ID, field_names<AccessPolicyVO>().default_behaviour, ModuleTableFieldVO.FIELD_TYPE_enum, 'Comportement par défaut', true, true, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN).setEnumValues({
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN],
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS],
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE]
            }),
            ModuleTableFieldController.create_new(AccessPolicyVO.API_TYPE_ID, field_names<AccessPolicyVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, AccessPolicyVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Droit" }));

        field_accpolgroup_id.set_many_to_one_target_moduletable_name(AccessPolicyGroupVO.API_TYPE_ID);
        field_module_id.set_many_to_one_target_moduletable_name(ModuleVO.API_TYPE_ID);

    }

    private initializeModulePolicyDependency() {
        const src_pol_id = ModuleTableFieldController.create_new(PolicyDependencyVO.API_TYPE_ID, field_names<PolicyDependencyVO>().src_pol_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Droit source', true);
        const depends_on_pol_id = ModuleTableFieldController.create_new(PolicyDependencyVO.API_TYPE_ID, field_names<PolicyDependencyVO>().depends_on_pol_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Droit cible', false);
        const datatable_fields = [
            src_pol_id,
            depends_on_pol_id,
            ModuleTableFieldController.create_new(PolicyDependencyVO.API_TYPE_ID, field_names<PolicyDependencyVO>().default_behaviour, ModuleTableFieldVO.FIELD_TYPE_enum, 'Comportement par défaut', true, true, PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED).setEnumValues({
                [PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED]: PolicyDependencyVO.DEFAULT_BEHAVIOUR_LABELS[PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED],
                [PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED]: PolicyDependencyVO.DEFAULT_BEHAVIOUR_LABELS[PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED]
            })
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, PolicyDependencyVO, null, DefaultTranslationVO.create_new({ 'fr-fr': "Dépendances entre droits" }));

        src_pol_id.set_many_to_one_target_moduletable_name(AccessPolicyVO.API_TYPE_ID);
        depends_on_pol_id.set_many_to_one_target_moduletable_name(AccessPolicyVO.API_TYPE_ID);

    }



    private initializeUserLogVO() {

        const field_user_id = ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true);

        const datatable_fields = [
            field_user_id,
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().log_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, UserLogVO.LOG_TYPE_LOGIN).setEnumValues(UserLogVO.LOG_TYPE_LABELS),
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().log_time, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().impersonated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Via fonction LogAs', true, true, false),
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().referer, ModuleTableFieldVO.FIELD_TYPE_string, 'URL référente', false),
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().comment, ModuleTableFieldVO.FIELD_TYPE_textarea, 'Commentaire', false),
            ModuleTableFieldController.create_new(UserLogVO.API_TYPE_ID, field_names<UserLogVO>().data, ModuleTableFieldVO.FIELD_TYPE_string, 'JSON', false),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, UserLogVO, null, DefaultTranslationVO.create_new({ 'fr-fr': "Logs des utilisateurs" })).segment_on_field(field_user_id.field_name, NumSegment.TYPE_INT);

        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

    }

    private initializeRolesPolicies() {
        const field_accpol_id = ModuleTableFieldController.create_new(RolePolicyVO.API_TYPE_ID, field_names<RolePolicyVO>().accpol_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Droit', true, true, 0);
        const field_role_id = ModuleTableFieldController.create_new(RolePolicyVO.API_TYPE_ID, field_names<RolePolicyVO>().role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        const datatable_fields = [
            field_role_id,
            field_accpol_id,
            ModuleTableFieldController.create_new(RolePolicyVO.API_TYPE_ID, field_names<RolePolicyVO>().granted, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Granted', false, true, false),
        ];

        ModuleTableController.create_new(this.name, RolePolicyVO, null, DefaultTranslationVO.create_new({ 'fr-fr': "Droits des rôles" }));

        field_accpol_id.set_many_to_one_target_moduletable_name(AccessPolicyVO.API_TYPE_ID);
        field_role_id.set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);

    }
}

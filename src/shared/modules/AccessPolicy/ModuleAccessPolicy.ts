/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import BooleanParamVO, { BooleanParamVOStatic } from '../API/vos/apis/BooleanParamVO';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ModuleVO from '../ModuleVO';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import LangVO from '../Translation/vos/LangVO';
import VOsTypesManager from '../VOsTypesManager';
import AccessPolicyGroupVO from './vos/AccessPolicyGroupVO';
import AccessPolicyVO from './vos/AccessPolicyVO';
import LoginParamVO, { LoginParamVOStatic } from './vos/apis/LoginParamVO';
import ResetPwdParamVO, { ResetPwdParamVOStatic } from './vos/apis/ResetPwdParamVO';
import ResetPwdUIDParamVO, { ResetPwdUIDParamVOStatic } from './vos/apis/ResetPwdUIDParamVO';
import SigninParamVO, { SigninParamVOStatic } from './vos/apis/SigninParamVO';
import ToggleAccessParamVO, { ToggleAccessParamVOStatic } from './vos/apis/ToggleAccessParamVO';
import PolicyDependencyVO from './vos/PolicyDependencyVO';
import RolePolicyVO from './vos/RolePolicyVO';
import RoleVO from './vos/RoleVO';
import UserLogVO from './vos/UserLogVO';
import UserRoleVO from './vos/UserRoleVO';
import UserSessionVO from './vos/UserSessionVO';
import UserVO from './vos/UserVO';

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
    public static APINAME_change_lang = "change_lang";
    public static APINAME_CHECK_ACCESS = "ACCESS_CHECK_ACCESS";
    public static APINAME_TEST_ACCESS = "ACCESS_TEST_ACCESS";
    public static APINAME_IS_ADMIN = "IS_ADMIN";
    public static APINAME_IS_ROLE = "IS_ROLE";
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

    private constructor() {

        super("access_policy", ModuleAccessPolicy.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_CHECK_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_TEST_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<void, string>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_get_my_sid,
            []
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_logout,
            [UserLogVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_delete_session,
            [UserLogVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<String2ParamVO, boolean>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_send_session_share_email,
            [],
            String2ParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<String2ParamVO, boolean>(
            ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS,
            ModuleAccessPolicy.APINAME_send_session_share_sms,
            [],
            String2ParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, boolean>(
            null,
            ModuleAccessPolicy.APINAME_IS_ADMIN,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, UserVO>(
            null,
            ModuleAccessPolicy.APINAME_getSelfUser,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_IS_ROLE,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<BooleanParamVO, { [policy_id: number]: { [role_id: number]: boolean } }>(
            null,
            ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX,
            [AccessPolicyVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, PolicyDependencyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID],
            BooleanParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, RoleVO[]>(
            null,
            ModuleAccessPolicy.APINAME_GET_MY_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, number>(
            null,
            ModuleAccessPolicy.APINAME_GET_LOGGED_USER_ID,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, string>(
            null,
            ModuleAccessPolicy.APINAME_GET_LOGGED_USER_NAME,
            [UserVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, LangVO>(
            null,
            ModuleAccessPolicy.APINAME_getMyLang,
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwdsms,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_sendrecapture,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwd,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, void>(
            null,
            ModuleAccessPolicy.APINAME_begininitpwd_uid,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_UID,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS_UID,
            [UserVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER_SMS,
            [UserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_RESET_PWD,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ResetPwdUIDParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_RESET_PWDUID,
            [UserVO.API_TYPE_ID],
            ResetPwdUIDParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_checkCode,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ResetPwdUIDParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_checkCodeUID,
            [UserVO.API_TYPE_ID],
            ResetPwdUIDParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ToggleAccessParamVO, boolean>(
            null,
            ModuleAccessPolicy.APINAME_TOGGLE_ACCESS,
            [RolePolicyVO.API_TYPE_ID],
            ToggleAccessParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<LoginParamVO, number>(
            null,
            ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT,
            [UserVO.API_TYPE_ID],
            LoginParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<SigninParamVO, number>(
            null,
            ModuleAccessPolicy.APINAME_SIGNIN_AND_REDIRECT,
            [UserVO.API_TYPE_ID],
            SigninParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<LoginParamVO, number>(
            null,
            ModuleAccessPolicy.APINAME_impersonateLogin,
            [UserVO.API_TYPE_ID],
            LoginParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, UserVO>(
            null,
            ModuleAccessPolicy.APINAME_change_lang,
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

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
    }

    private initializeUser() {
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ 'fr-fr': 'Langue' }), true);
        let label_field = (new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Login' }), true)).unique();
        let datatable_fields = [
            label_field,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Prénom' }), false),
            new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Nom' }), false),
            (new ModuleTableField('email', ModuleTableField.FIELD_TYPE_email, new DefaultTranslation({ 'fr-fr': 'E-mail' }), true)).unique(),
            (new ModuleTableField('phone', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Téléphone' }))).unique(),
            new ModuleTableField('blocked', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Compte blocké' }), true, true, false),
            new ModuleTableField('password', ModuleTableField.FIELD_TYPE_password, new DefaultTranslation({ 'fr-fr': 'Mot de passe' }), true),
            new ModuleTableField('password_change_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Date de changement du mot de passe' }), false),
            new ModuleTableField('reminded_pwd_1', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Premier rappel envoyé' }), true, true, false),
            new ModuleTableField('reminded_pwd_2', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Second rappel envoyé' }), true, true, false),
            new ModuleTableField('invalidated', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Mot de passe expiré' }), true, true, false),
            field_lang_id,
            new ModuleTableField('recovery_challenge', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Challenge de récupération' }), false, true, ""),
            new ModuleTableField('recovery_expiration', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Expiration du challenge' }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('logged_once', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Connecté au moins 1 fois' }), true, true, false),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Date de création' })).set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserVO.API_TYPE_ID, () => new UserVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Utilisateurs" }));
        field_lang_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', 'user');
        this.datatables.push(datatable);
    }

    private initializeUserSession() {
        let label_field = new ModuleTableField('sid', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'SID' })).unique();

        let datatable_fields = [
            label_field,
            new ModuleTableField('sess', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Information session' })),
            new ModuleTableField('expire', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Expiration' })).set_format_localized_time(true).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserSessionVO.API_TYPE_ID, () => new UserSessionVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Sessions des utilisateurs" }));
        datatable.set_bdd_ref('ref', UserSessionVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeRole() {
        let label_field = new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_translatable_text, 'Nom', true);
        let parent_role_id = new ModuleTableField('parent_role_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Rôle parent');

        let datatable_fields = [
            label_field,
            parent_role_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, RoleVO.API_TYPE_ID, () => new RoleVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Rôles" }));
        parent_role_id.donotCascadeOnDelete();
        parent_role_id.addManyToOneRelation(datatable);
        this.datatables.push(datatable);
    }

    private initializeUserRoles() {
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true, true, 0);
        let field_role_id = new ModuleTableField('role_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        let datatable_fields = [
            field_user_id,
            field_role_id,
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserRoleVO.API_TYPE_ID, () => new UserRoleVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': "Rôles des utilisateurs" }));

        field_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_role_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeModuleAccessPolicyGroup() {

        let label_field = new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_translatable_text, 'Nom', true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, AccessPolicyGroupVO.API_TYPE_ID, () => new AccessPolicyGroupVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Groupe de droits" }));

        this.datatables.push(datatable);
    }

    private initializeModuleAccessPolicy() {
        let label_field = new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_translatable_text, 'Nom', true);
        let field_accpolgroup_id = new ModuleTableField('group_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Group', false);
        let field_module_id = new ModuleTableField('module_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Module', false);
        let datatable_fields = [
            label_field,
            field_accpolgroup_id,
            field_module_id,
            new ModuleTableField('default_behaviour', ModuleTableField.FIELD_TYPE_enum, 'Comportement par défaut', true, true, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN).setEnumValues({
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN],
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS],
                [AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE]: AccessPolicyVO.DEFAULT_BEHAVIOUR_LABELS[AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE]
            }),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, AccessPolicyVO.API_TYPE_ID, () => new AccessPolicyVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Droit" }));

        field_accpolgroup_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyGroupVO.API_TYPE_ID]);
        field_module_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ModuleVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeModulePolicyDependency() {
        let src_pol_id = new ModuleTableField('src_pol_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Droit source', true);
        let depends_on_pol_id = new ModuleTableField('depends_on_pol_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Droit cible', false);
        let datatable_fields = [
            src_pol_id,
            depends_on_pol_id,
            new ModuleTableField('default_behaviour', ModuleTableField.FIELD_TYPE_enum, 'Comportement par défaut', true, true, PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED).setEnumValues({
                [PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED]: PolicyDependencyVO.DEFAULT_BEHAVIOUR_LABELS[PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED],
                [PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED]: PolicyDependencyVO.DEFAULT_BEHAVIOUR_LABELS[PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED]
            })
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, PolicyDependencyVO.API_TYPE_ID, () => new PolicyDependencyVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': "Dépendances entre droits" }));

        src_pol_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyVO.API_TYPE_ID]);
        depends_on_pol_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }



    private initializeUserLogVO() {

        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true);

        let datatable_fields = [
            field_user_id,
            new ModuleTableField('log_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, UserLogVO.LOG_TYPE_LOGIN).setEnumValues(UserLogVO.LOG_TYPE_LABELS),
            new ModuleTableField('log_time', ModuleTableField.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('impersonated', ModuleTableField.FIELD_TYPE_boolean, 'Via fonction LogAs', true, true, false),
            new ModuleTableField('referer', ModuleTableField.FIELD_TYPE_string, 'URL référente', false),
            new ModuleTableField('comment', ModuleTableField.FIELD_TYPE_textarea, 'Commentaire', false),
            new ModuleTableField('data', ModuleTableField.FIELD_TYPE_string, 'JSON', false),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserLogVO.API_TYPE_ID, () => new UserLogVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': "Logs des utilisateurs" })).segment_on_field(field_user_id.field_id, NumSegment.TYPE_INT);

        field_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeRolesPolicies() {
        let field_accpol_id = new ModuleTableField('accpol_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Droit', true, true, 0);
        let field_role_id = new ModuleTableField('role_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        let datatable_fields = [
            field_role_id,
            field_accpol_id,
            new ModuleTableField('granted', ModuleTableField.FIELD_TYPE_boolean, 'Granted', false, true, false),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, RolePolicyVO.API_TYPE_ID, () => new RolePolicyVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': "Droits des rôles" }));

        field_accpol_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyVO.API_TYPE_ID]);
        field_role_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }
}

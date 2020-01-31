import * as moment from 'moment';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import DateHandler from '../../tools/DateHandler';
import ModuleAPI from '../API/ModuleAPI';
import BooleanParamVO from '../API/vos/apis/BooleanParamVO';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import LangVO from '../Translation/vos/LangVO';
import VOsTypesManager from '../VOsTypesManager';
import AccessPolicyGroupVO from './vos/AccessPolicyGroupVO';
import AccessPolicyVO from './vos/AccessPolicyVO';
import AddRoleToUserParamVO from './vos/apis/AddRoleToUserParamVO';
import LoginParamVO from './vos/apis/LoginParamVO';
import ResetPwdParamVO from './vos/apis/ResetPwdParamVO';
import ToggleAccessParamVO from './vos/apis/ToggleAccessParamVO';
import PolicyDependencyVO from './vos/PolicyDependencyVO';
import RolePolicyVO from './vos/RolePolicyVO';
import RoleVO from './vos/RoleVO';
import UserRoleVO from './vos/UserRoleVO';
import UserVO from './vos/UserVO';
import UserLogVO from './vos/UserLogVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import NumSegment from '../DataRender/vos/NumSegment';

export default class ModuleAccessPolicy extends Module {

    public static MODULE_NAME: string = "AccessPolicy";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".FO_ACCESS";

    public static POLICY_IMPERSONATE: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".IMPERSONATE";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_BO_MODULES_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_MODULES_MANAGMENT_ACCESS";
    public static POLICY_BO_RIGHTS_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_RIGHTS_MANAGMENT_ACCESS";
    public static POLICY_BO_USERS_LIST_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_USERS_LIST_ACCESS";
    public static POLICY_BO_USERS_MANAGMENT_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAccessPolicy.MODULE_NAME + ".BO_USERS_MANAGMENT_ACCESS";

    public static ROLE_ADMIN: string = AccessPolicyTools.ROLE_UID_PREFIX + 'admin';
    public static ROLE_LOGGED: string = AccessPolicyTools.ROLE_UID_PREFIX + 'logged';
    public static ROLE_ANONYMOUS: string = AccessPolicyTools.ROLE_UID_PREFIX + 'anonymous';

    public static APINAME_impersonateLogin = "impersonateLogin";
    public static APINAME_CHECK_ACCESS = "ACCESS_CHECK_ACCESS";
    public static APINAME_IS_ADMIN = "IS_ADMIN";
    public static APINAME_IS_ROLE = "IS_ROLE";
    public static APINAME_GET_MY_ROLES = "GET_MY_ROLES";
    public static APINAME_ADD_ROLE_TO_USER = "ADD_ROLE_TO_USER";
    public static APINAME_BEGIN_RECOVER = "BEGIN_RECOVER";
    public static APINAME_RESET_PWD = "RESET_PWD";
    public static APINAME_TOGGLE_ACCESS = "TOGGLE_ACCESS";
    public static APINAME_GET_ACCESS_MATRIX = "GET_ACCESS_MATRIX";
    public static APINAME_LOGIN_AND_REDIRECT = "LOGIN_AND_REDIRECT";
    public static APINAME_GET_LOGGED_USER = "GET_LOGGED_USER";

    public static PARAM_NAME_REMINDER_PWD1_DAYS = 'reminder_pwd1_days';
    public static PARAM_NAME_REMINDER_PWD2_DAYS = 'reminder_pwd2_days';
    public static PARAM_NAME_PWD_INVALIDATION_DAYS = 'pwd_invalidation_days';
    public static PARAM_NAME_RECOVERY_HOURS = 'recovery_hours';

    public static getInstance(): ModuleAccessPolicy {
        if (!ModuleAccessPolicy.instance) {
            ModuleAccessPolicy.instance = new ModuleAccessPolicy();
        }
        return ModuleAccessPolicy.instance;
    }

    private static instance: ModuleAccessPolicy = null;

    public connected_user: UserVO = null;


    private constructor() {

        super("access_policy", ModuleAccessPolicy.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            ModuleAccessPolicy.APINAME_CHECK_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, boolean>(
            ModuleAccessPolicy.APINAME_IS_ADMIN,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            ModuleAccessPolicy.APINAME_IS_ROLE,
            [UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<BooleanParamVO, { [policy_id: number]: { [role_id: number]: boolean } }>(
            ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX,
            [AccessPolicyVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID, PolicyDependencyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, RolePolicyVO.API_TYPE_ID],
            BooleanParamVO.translateCheckAccessParams,
            BooleanParamVO.URL,
            BooleanParamVO.translateToURL,
            BooleanParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, RoleVO[]>(
            ModuleAccessPolicy.APINAME_GET_MY_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, UserVO>(
            ModuleAccessPolicy.APINAME_GET_LOGGED_USER,
            [UserVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<AddRoleToUserParamVO, void>(
            ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            AddRoleToUserParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER,
            [UserVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            ModuleAccessPolicy.APINAME_RESET_PWD,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ToggleAccessParamVO, boolean>(
            ModuleAccessPolicy.APINAME_TOGGLE_ACCESS,
            [RolePolicyVO.API_TYPE_ID],
            ToggleAccessParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<LoginParamVO, UserVO>(
            ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT,
            [UserVO.API_TYPE_ID],
            LoginParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<LoginParamVO, UserVO>(
            ModuleAccessPolicy.APINAME_impersonateLogin,
            [UserVO.API_TYPE_ID],
            LoginParamVO.translateCheckAccessParams
        ));
    }

    public async getLoggedUser(): Promise<UserVO> {
        return await ModuleAPI.getInstance().handleAPI<void, UserVO>(ModuleAccessPolicy.APINAME_GET_LOGGED_USER);
    }

    public async impersonateLogin(email: string): Promise<UserVO> {
        return await ModuleAPI.getInstance().handleAPI<LoginParamVO, UserVO>(ModuleAccessPolicy.APINAME_impersonateLogin, email, null);
    }

    public async loginAndRedirect(email: string, password: string, redirect_to: string): Promise<UserVO> {
        return await ModuleAPI.getInstance().handleAPI<LoginParamVO, UserVO>(ModuleAccessPolicy.APINAME_LOGIN_AND_REDIRECT, email, password, redirect_to);
    }

    public async getAccessMatrix(inherited_only: boolean): Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> {
        return await ModuleAPI.getInstance().handleAPI<BooleanParamVO, { [policy_id: number]: { [role_id: number]: boolean } }>(ModuleAccessPolicy.APINAME_GET_ACCESS_MATRIX, inherited_only);
    }

    public async togglePolicy(policy_id: number, role_id: number): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<ToggleAccessParamVO, boolean>(ModuleAccessPolicy.APINAME_TOGGLE_ACCESS, policy_id, role_id);
    }

    /**
     * @param policy_name Le titre de la policy, qui doit être unique sur tous les groupes de toutes façons
     */
    public async checkAccess(policy_name: string): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, boolean>(ModuleAccessPolicy.APINAME_CHECK_ACCESS, policy_name);
    }

    public async beginRecover(email: string): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, boolean>(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, email);
    }

    public async resetPwd(email: string, challenge: string, new_pwd1: string): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<string, boolean>(ModuleAccessPolicy.APINAME_RESET_PWD, email, challenge, new_pwd1);
    }

    public async addRoleToUser(user_id: number, role_id: number): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<AddRoleToUserParamVO, boolean>(ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER, user_id, role_id);
    }

    public async isAdmin(): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<void, boolean>(ModuleAccessPolicy.APINAME_IS_ADMIN);
    }

    public async isRole(role_translatable_name: string): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, boolean>(ModuleAccessPolicy.APINAME_IS_ROLE, role_translatable_name);
    }

    public async getMyRoles(): Promise<RoleVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, RoleVO[]>(ModuleAccessPolicy.APINAME_GET_MY_ROLES);
    }

    public prepareForInsertOrUpdateAfterPwdChange(user: UserVO, new_pwd1: string): void {

        user.password = new_pwd1;
        user.password_change_date = DateHandler.getInstance().formatDayForIndex(moment());
        user.invalidated = false;
        user.recovery_expiration = null;
        user.recovery_challenge = null;
        user.reminded_pwd_1 = false;
        user.reminded_pwd_2 = false;
    }

    public initialize() {
        this.fields = [
            new ModuleTableField(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS, ModuleTableField.FIELD_TYPE_int, 'reminder_pwd1_days', true, true, 20),
            new ModuleTableField(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS, ModuleTableField.FIELD_TYPE_int, 'reminder_pwd2_days', true, true, 3),
            new ModuleTableField(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS, ModuleTableField.FIELD_TYPE_int, 'pwd_invalidation_days', true, true, 90),
            new ModuleTableField(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS, ModuleTableField.FIELD_TYPE_float, 'recovery_hours', true, true, 2),
        ];
        this.datatables = [];

        this.initializeUser();
        this.initializeRole();
        this.initializeUserRoles();
        this.initializeModuleAccessPolicyGroup();
        this.initializeModuleAccessPolicy();
        this.initializeModulePolicyDependency();
        this.initializeRolesPolicies();
        this.initializeUserLogVO();
    }

    private initializeUser() {
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ fr: 'Langue' }), true);
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Nom' }), true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'E-mail' }), true),
            new ModuleTableField('phone', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Téléphone' })),
            new ModuleTableField('password', ModuleTableField.FIELD_TYPE_password, new DefaultTranslation({ fr: 'Mot de passe' }), true),
            new ModuleTableField('password_change_date', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Date de changement du mot de passe' }), false),
            new ModuleTableField('reminded_pwd_1', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ fr: 'Premier rappel envoyé' }), false, true, false),
            new ModuleTableField('reminded_pwd_2', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ fr: 'Second rappel envoyé' }), false, true, false),
            new ModuleTableField('invalidated', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ fr: 'Compte désactivé' }), false, true, false),
            field_lang_id,
            new ModuleTableField('recovery_challenge', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Challenge de récupération' }), false, true, ""),
            new ModuleTableField('recovery_expiration', ModuleTableField.FIELD_TYPE_int, new DefaultTranslation({ fr: 'Expiration du challenge' }), false, true, 0),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, UserVO.API_TYPE_ID, () => new UserVO(), datatable_fields, label_field, new DefaultTranslation({ fr: "Utilisateurs" }));
        field_lang_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', 'user');
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

        let datatable: ModuleTable<any> = new ModuleTable(this, RoleVO.API_TYPE_ID, () => new RoleVO(), datatable_fields, label_field, new DefaultTranslation({ fr: "Rôles" }));
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

        let datatable: ModuleTable<any> = new ModuleTable(this, UserRoleVO.API_TYPE_ID, () => new UserRoleVO(), datatable_fields, null, new DefaultTranslation({ fr: "Rôles des utilisateurs" }));

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

        let datatable: ModuleTable<any> = new ModuleTable(this, AccessPolicyGroupVO.API_TYPE_ID, () => new AccessPolicyGroupVO(), datatable_fields, label_field, new DefaultTranslation({ fr: "Groupe de droits" }));

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

        let datatable: ModuleTable<any> = new ModuleTable(this, AccessPolicyVO.API_TYPE_ID, () => new AccessPolicyVO(), datatable_fields, label_field, new DefaultTranslation({ fr: "Droit" }));

        field_accpolgroup_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyGroupVO.API_TYPE_ID]);

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

        let datatable: ModuleTable<any> = new ModuleTable(this, PolicyDependencyVO.API_TYPE_ID, () => new PolicyDependencyVO(), datatable_fields, null, new DefaultTranslation({ fr: "Dépendances entre droits" }));

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

        let datatable: ModuleTable<any> = new ModuleTable(this, UserLogVO.API_TYPE_ID, () => new UserLogVO(), datatable_fields, null, new DefaultTranslation({ fr: "Logs des utilisateurs" })).segment_on_field(field_user_id.field_id, NumSegment.TYPE_INT);

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

        let datatable: ModuleTable<any> = new ModuleTable(this, RolePolicyVO.API_TYPE_ID, () => new RolePolicyVO(), datatable_fields, null, new DefaultTranslation({ fr: "Droits des rôles" }));

        field_accpol_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AccessPolicyVO.API_TYPE_ID]);
        field_role_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }
}

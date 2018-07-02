import * as moment from 'moment';
import DateHandler from '../../tools/DateHandler';
import ModuleAPI from '../API/ModuleAPI';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import Module from '../Module';
import ModulesManager from '../ModulesManager';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import AccessPolicyGroupVO from './vos/AccessPolicyGroupVO';
import AccessPolicyVO from './vos/AccessPolicyVO';
import AddDefaultRolePolicyIfNotExistsParamVO from './vos/apis/AddDefaultRolePolicyIfNotExistsParamVO';
import AddRoleToUserParamVO from './vos/apis/AddRoleToUserParamVO';
import CheckAccessParamVO from './vos/apis/CheckAccessParamVO';
import RegisterModuleAccessPolicyParamVO from './vos/apis/RegisterModuleAccessPolicyParamVO';
import ResetPwdParamVO from './vos/apis/ResetPwdParamVO';
import RolePoliciesVO from './vos/RolePoliciesVO';
import RoleVO from './vos/RoleVO';
import UserRolesVO from './vos/UserRolesVO';
import UserVO from './vos/UserVO';
import ModuleTranslation from '../Translation/ModuleTranslation';
import StringParamVO from '../API/vos/apis/StringParamVO';

export default class ModuleAccessPolicy extends Module {

    public static APINAME_CHECK_ACCESS = "ACCESS_CHECK_ACCESS";
    public static APINAME_IS_ADMIN = "IS_ADMIN";
    public static APINAME_IS_ROLE = "IS_ROLE";
    public static APINAME_ADD_ROLE_IF_NOT_EXISTS = "ADD_ROLE_IF_NOT_EXISTS";
    public static APINAME_ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS = "ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS";
    public static APINAME_GET_MY_ROLES = "GET_MY_ROLES";
    public static APINAME_ADD_ROLE_TO_USER = "ADD_ROLE_TO_USER";
    public static APINAME_BEGIN_RECOVER = "BEGIN_RECOVER";
    public static APINAME_RESET_PWD = "RESET_PWD";
    public static APINAME_registerModuleAccessPolicy = "registerModuleAccessPolicy";

    public static ROLE_SUPER_ADMIN: string = 'access.roles.super_admin.label';

    public static MAIN_ACCESS_GROUP_NAME: string = "ACCES PRINCIPAUX";
    public static ADMIN_ACCESS_NAME: string = "ADMIN";

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

    public user_datatable: ModuleTable<UserVO>;
    public role_datatable: ModuleTable<RoleVO>;
    public userroles_datatable: ModuleTable<UserRolesVO>;
    public accesspolicygroup_datatable: ModuleTable<AccessPolicyGroupVO>;
    public accesspolicy_datatable: ModuleTable<AccessPolicyVO>;
    public rolepolicies_datatable: ModuleTable<RolePoliciesVO>;

    public connected_user: UserVO = null;

    private constructor() {

        super("access_policy", "AccessPolicy");
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<CheckAccessParamVO, boolean>(
            ModuleAccessPolicy.APINAME_CHECK_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRolesVO.API_TYPE_ID, RolePoliciesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            CheckAccessParamVO.translateCheckAccessParams,
            CheckAccessParamVO.URL,
            CheckAccessParamVO.translateToURL,
            CheckAccessParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, boolean>(
            ModuleAccessPolicy.APINAME_IS_ADMIN,
            [UserRolesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            ModuleAccessPolicy.APINAME_IS_ROLE,
            [UserRolesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, RoleVO>(
            ModuleAccessPolicy.APINAME_ADD_ROLE_IF_NOT_EXISTS,
            [RoleVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<AddDefaultRolePolicyIfNotExistsParamVO, void>(
            ModuleAccessPolicy.APINAME_ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS,
            [RolePoliciesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AccessPolicyVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, RoleVO[]>(
            ModuleAccessPolicy.APINAME_GET_MY_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRolesVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<AddRoleToUserParamVO, void>(
            ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            AddRoleToUserParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER,
            [UserVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            ModuleAccessPolicy.APINAME_RESET_PWD,
            [UserVO.API_TYPE_ID],
            ResetPwdParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<RegisterModuleAccessPolicyParamVO, void>(
            ModuleAccessPolicy.APINAME_registerModuleAccessPolicy,
            [AccessPolicyGroupVO.API_TYPE_ID, AccessPolicyVO.API_TYPE_ID],
            RegisterModuleAccessPolicyParamVO.translateCheckAccessParams
        ));
    }

    /**
     *
     * @param group_name Le titre du groupe
     * @param policy_name Le titre de la policy
     */
    public async checkAccess(group_name: string, policy_name: string): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<CheckAccessParamVO, boolean>(ModuleAccessPolicy.APINAME_CHECK_ACCESS, group_name, policy_name);
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

    public async addRoleIfNotExists(translatable_name: string): Promise<RoleVO> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, RoleVO>(ModuleAccessPolicy.APINAME_ADD_ROLE_IF_NOT_EXISTS, translatable_name);
    }

    public async addDefaultRolePolicyIfNotExists(
        role: RoleVO,
        policy: AccessPolicyVO,
        granted: boolean = false): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<AddDefaultRolePolicyIfNotExistsParamVO, void>(ModuleAccessPolicy.APINAME_ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS, role, policy, granted);
    }

    public passwordIsValidProposition(pwd_proposition: string): boolean {
        if ((!pwd_proposition) || (pwd_proposition.length < 8)) {
            return false;
        }

        // Doit contenir un chiffre
        if (!/[0-9]/.test(pwd_proposition)) {
            return false;
        }

        // Doit contenir une minuscule
        if (!/[a-z]/.test(pwd_proposition)) {
            return false;
        }

        // Doit contenir une majuscule
        if (!/[A-Z]/.test(pwd_proposition)) {
            return false;
        }

        return true;
    }

    public async changePwd(user: UserVO, new_pwd1: string): Promise<void> {

        user.password = new_pwd1;
        user.password_change_date = DateHandler.getInstance().formatDayForIndex(moment());
        user.invalidated = false;
        user.recovery_expiration = null;
        user.reminded_pwd_1 = false;
        user.reminded_pwd_2 = false;
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
    }

    public async updatePwdChangedInfos(user_id: number): Promise<void> {

        let user: UserVO = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, user_id);
        user.password_change_date = DateHandler.getInstance().formatDayForIndex(moment());
        user.invalidated = false;
        user.recovery_expiration = null;
        user.reminded_pwd_1 = false;
        user.reminded_pwd_2 = false;
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
    }

    /**
     * On s'assure que la policy existe en base. Sinon on crée au besoin le groupe et/ou la policy
     * @param group_name Le titre du groupe
     * @param policy_name Le titre de la policy
     */
    public async registerModuleAccessPolicy(group_name: string, policy_name: string): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<RegisterModuleAccessPolicyParamVO, void>(ModuleAccessPolicy.APINAME_registerModuleAccessPolicy, group_name, policy_name);
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
        this.initializeRolesPolicies();
    }

    private initializeUser() {
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, 'lang_id', false);
        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'name', true),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'email', true),
            new ModuleTableField('password', ModuleTableField.FIELD_TYPE_string, 'password', true),
            new ModuleTableField('password_change_date', ModuleTableField.FIELD_TYPE_string, 'password_change_date', true),
            new ModuleTableField('reminded_pwd_1', ModuleTableField.FIELD_TYPE_boolean, 'reminded_pwd_1', true),
            new ModuleTableField('reminded_pwd_2', ModuleTableField.FIELD_TYPE_boolean, 'reminded_pwd_2', true),
            new ModuleTableField('invalidated', ModuleTableField.FIELD_TYPE_boolean, 'invalidated', true),
            field_lang_id,
            new ModuleTableField('recovery_challenge', ModuleTableField.FIELD_TYPE_string, 'recovery_challenge', true),
            new ModuleTableField('recovery_expiration', ModuleTableField.FIELD_TYPE_int, 'recovery_expiration', true),
        ];

        this.user_datatable = new ModuleTable(this, UserVO.API_TYPE_ID, UserVO.forceNumeric, UserVO.forceNumerics, datatable_fields, UserVO.API_TYPE_ID);
        field_lang_id.addManyToOneRelation(this.user_datatable, ModuleTranslation.getInstance().datatable_lang);
    }

    private initializeRole() {
        let datatable_fields = [
            new ModuleTableField('translatable_name', 'text', 'Nom', true),
        ];

        this.role_datatable = new ModuleTable(this, RoleVO.API_TYPE_ID, RoleVO.forceNumeric, RoleVO.forceNumerics, datatable_fields, RoleVO.API_TYPE_ID);

        this.datatables.push(this.role_datatable);
    }

    private initializeUserRoles() {
        let field_user_id = new ModuleTableField('user_id', 'fkey', 'User', true, true, 0);
        let field_role_id = new ModuleTableField('role_id', 'fkey', 'Rôle', true, true, 0);
        let datatable_fields = [
            field_user_id,
            field_role_id,
        ];

        this.userroles_datatable = new ModuleTable(this, UserRolesVO.API_TYPE_ID, UserRolesVO.forceNumeric, UserRolesVO.forceNumerics, datatable_fields, UserRolesVO.API_TYPE_ID);

        field_user_id.addManyToOneRelation(this.userroles_datatable, this.user_datatable);
        field_role_id.addManyToOneRelation(this.userroles_datatable, this.role_datatable);

        this.datatables.push(this.userroles_datatable);
    }

    private initializeModuleAccessPolicyGroup() {

        let datatable_fields = [
            new ModuleTableField('translatable_name', 'text', 'Nom', true),
            new ModuleTableField('uniq_id', 'text', 'UniqID', true),
        ];

        this.accesspolicygroup_datatable = new ModuleTable(this, AccessPolicyGroupVO.API_TYPE_ID, AccessPolicyGroupVO.forceNumeric, AccessPolicyGroupVO.forceNumerics, datatable_fields, AccessPolicyGroupVO.API_TYPE_ID);

        this.datatables.push(this.accesspolicygroup_datatable);
    }

    private initializeModuleAccessPolicy() {
        let field_accpolgroup_id = new ModuleTableField('group_id', 'fkey', 'Group', true, true, 0);
        let datatable_fields = [
            new ModuleTableField('translatable_name', 'text', 'Nom', true),
            new ModuleTableField('uniq_id', 'text', 'UniqID', true),
            field_accpolgroup_id
        ];

        this.accesspolicy_datatable = new ModuleTable(this, AccessPolicyVO.API_TYPE_ID, AccessPolicyVO.forceNumeric, AccessPolicyVO.forceNumerics, datatable_fields, AccessPolicyVO.API_TYPE_ID);

        field_accpolgroup_id.addManyToOneRelation(this.accesspolicy_datatable, this.accesspolicygroup_datatable);

        this.datatables.push(this.accesspolicy_datatable);
    }

    private initializeRolesPolicies() {
        let field_accpol_id = new ModuleTableField('accpol_id', 'fkey', 'User', true, true, 0);
        let field_role_id = new ModuleTableField('role_id', 'fkey', 'Rôle', true, true, 0);
        let datatable_fields = [
            field_accpol_id,
            field_role_id,
            new ModuleTableField('granted', ModuleTableField.FIELD_TYPE_boolean, 'Granted', true, true, false),
        ];

        this.rolepolicies_datatable = new ModuleTable(this, RolePoliciesVO.API_TYPE_ID, RolePoliciesVO.forceNumeric, RolePoliciesVO.forceNumerics, datatable_fields, RolePoliciesVO.API_TYPE_ID);

        field_accpol_id.addManyToOneRelation(this.rolepolicies_datatable, this.accesspolicy_datatable);
        field_role_id.addManyToOneRelation(this.rolepolicies_datatable, this.role_datatable);

        this.datatables.push(this.rolepolicies_datatable);
    }
}

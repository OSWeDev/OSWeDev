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

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAccessPolicyServer.instance) {
            ModuleAccessPolicyServer.instance = new ModuleAccessPolicyServer();
        }
        return ModuleAccessPolicyServer.instance;
    }

    private static instance: ModuleAccessPolicyServer = null;

    private debug_check_access: boolean = true;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    public registerCrons(): void {
        AccessPolicyCronWorkersHandler.getInstance();
    }

    public async configure() {
        // On init le Rôle super admin qui est la base de tout
        let role_superadmin: RoleVO = await ModuleAccessPolicy.getInstance().addRoleIfNotExists(ModuleAccessPolicy.ROLE_SUPER_ADMIN);

        // Register Policies
        await ModuleAccessPolicy.getInstance().registerModuleAccessPolicy(ModuleAccessPolicy.MAIN_ACCESS_GROUP_NAME, ModuleAccessPolicy.ADMIN_ACCESS_NAME);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_CHECK_ACCESS, this.checkAccess.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ADMIN, this.isAdmin.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_IS_ROLE, this.isRole.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_ROLE_IF_NOT_EXISTS, this.addRoleIfNotExists.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS, this.addDefaultRolePolicyIfNotExists.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_GET_MY_ROLES, this.getMyRoles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER, this.addRoleToUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_BEGIN_RECOVER, this.beginRecover.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_RESET_PWD, this.resetPwd.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAccessPolicy.APINAME_registerModuleAccessPolicy, this.registerModuleAccessPolicy.bind(this));
    }

    /**
     * On s'assure que la policy existe en base. Sinon on crée au besoin le groupe et/ou la policy
     * @param group_name Le titre du groupe
     * @param policy_name Le titre de la policy
     */
    public async registerModuleAccessPolicy(params: RegisterModuleAccessPolicyParamVO): Promise<void> {
        let group_name: string = params.group_name;
        let policy_name: string = params.policy_name;

        if ((!group_name) || (!policy_name)) {
            return;
        }

        let apg: AccessPolicyGroupVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyGroupVO>(
            AccessPolicyGroupVO.API_TYPE_ID,
            'WHERE uniq_id=$1',
            [AccessPolicyGroupVO.getUniqID(group_name)]
        );

        if (!apg) {
            apg = new AccessPolicyGroupVO(group_name);
            // let request = "INSERT INTO " + this.accesspolicygroup_datatable.full_name + " (uniq_id, translatable_name) VALUES ('" + apg.uniq_id + "', '" + apg.translatable_name + "') RETURNING id;";
            // let id = await this.db.query(request);
            let insertres = await ModuleDAO.getInstance().insertOrUpdateVO(apg);

            if ((!insertres) || (!insertres.id)) {
                return;
            }
            apg.id = parseInt(insertres.id.toString());
            apg = VOsTypesManager.getInstance().moduleTables_by_voType[apg._type].forceNumeric(apg);
        }

        let ap: AccessPolicyVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyVO>(
            AccessPolicyVO.API_TYPE_ID,
            'WHERE uniq_id=$1', [AccessPolicyVO.getUniqID(group_name, policy_name)]);

        if (!ap) {
            ap = new AccessPolicyVO(group_name, policy_name, apg.id);
            // let request = "INSERT INTO " + this.accesspolicy_datatable.full_name + " (uniq_id, translatable_name, group_id) VALUES ('" + apg.uniq_id + "', '" + apg.translatable_name + "', " + apg.id + ") RETURNING id;";
            // await this.db.query(request);
            await ModuleDAO.getInstance().insertOrUpdateVO(ap);

            // TODO ajouter l'insert des traductions par défaut à ce niveau, pour toutes les langues ?
        }
    }

    private async getMyRoles(): Promise<RoleVO[]> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return null;
        }

        return await ModuleDAOServer.getInstance().selectAll<RoleVO>(
            RoleVO.API_TYPE_ID,
            " join " + ModuleAccessPolicy.getInstance().userroles_datatable.full_name + " ur on ur.role_id = t.id " +
            " where ur.user_id = $1",
            [uid],
            [UserRolesVO.API_TYPE_ID, UserVO.API_TYPE_ID]);
    }

    private async isRole(param: StringParamVO): Promise<boolean> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return false;
        }

        let userRoles: UserRolesVO = await ModuleDAOServer.getInstance().selectOne<UserRolesVO>(
            UserRolesVO.API_TYPE_ID,
            " join " + ModuleAccessPolicy.getInstance().role_datatable.full_name + " r on r.id = t.role_id " +
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
            " join " + ModuleAccessPolicy.getInstance().role_datatable.full_name + " r on r.id = t.role_id " +
            " where t.user_id = $1 and r.translatable_name = $2",
            [uid, ModuleAccessPolicy.ROLE_SUPER_ADMIN],
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

    private async checkAccess(checkAccessParam: CheckAccessParamVO): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return false;
        }

        this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":");

        // Un admin a accès à tout dans tous les cas
        if (await this.isAdmin()) {
            this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":TRUE:IS_ADMIN");
            return true;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
            this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":TRUE:IS_SERVER");
            return true;
        }

        let uid: number = httpContext.get('UID');
        if (!uid) {
            this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":FALSE:UID:NULL");
            return false;
        }

        let group_name: string = checkAccessParam.group_name;
        let policy_name: string = checkAccessParam.policy_name;

        this.consoledebug(
            'JOIN ' + ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name + " ap ON ap.id = t.accpol_id " +
            'JOIN ' + ModuleAccessPolicy.getInstance().role_datatable.full_name + " r ON t.role_id = r.id " +
            'JOIN ' + ModuleAccessPolicy.getInstance().userroles_datatable.full_name + " ur ON ur.role_id = r.id " +
            'JOIN ref.user u ON u.id = ur.user_id ' +
            'WHERE u.id = ' + uid + ' and ap.uniq_id = \'' + AccessPolicyVO.getUniqID(group_name, policy_name) + '\'');

        let rolePolicies: RolePoliciesVO[] = await ModuleDAOServer.getInstance().selectAll<RolePoliciesVO>(
            RolePoliciesVO.API_TYPE_ID,
            'JOIN ' + ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name + " ap ON ap.id = t.accpol_id " +
            'JOIN ' + ModuleAccessPolicy.getInstance().role_datatable.full_name + " r ON t.role_id = r.id " +
            'JOIN ' + ModuleAccessPolicy.getInstance().userroles_datatable.full_name + " ur ON ur.role_id = r.id " +
            'JOIN ref.user u ON u.id = ur.user_id ' +
            'WHERE u.id = $1 and ap.uniq_id = $2',
            [uid, AccessPolicyVO.getUniqID(group_name, policy_name)],
            [UserRolesVO.API_TYPE_ID, AccessPolicyVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID]);
        if ((!rolePolicies) || (!rolePolicies.length)) {
            this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":FALSE:NO_POLICY");
            return false;
        }

        // Si on a plusieurs rôles, il suffit que l'un d'eux nous donne accès
        for (let i in rolePolicies) {
            let rolePolicy: RolePoliciesVO = rolePolicies[i];

            if (rolePolicy.granted) {
                this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":TRUE:POLICY:GRANTED");
                return true;
            }
        }

        this.consoledebug("CHECKACCESS:" + checkAccessParam.group_name + ":" + checkAccessParam.policy_name + ":FALSE:POLICY:NOT_GRANTED");
        return false;
    }

    private async addRoleIfNotExists(param: StringParamVO): Promise<RoleVO> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return null;
        }

        let role: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, " WHERE t.translatable_name = $1", [param.text]);

        if (!role) {
            role = new RoleVO();
            role.translatable_name = param.text;
            let insertres = await ModuleDAO.getInstance().insertOrUpdateVO(role);

            if ((!insertres) || (!insertres.id)) {
                return;
            }
            role.id = parseInt(insertres.id.toString());
            role = VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID].forceNumeric(role);
        }

        return role;
    }

    private async addDefaultRolePolicyIfNotExists(params: AddDefaultRolePolicyIfNotExistsParamVO): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params) || (!params.policy) || (!params.role)) {
            return;
        }

        let rolePolicy: RolePoliciesVO = await ModuleDAOServer.getInstance().selectOne<RolePoliciesVO>(RolePoliciesVO.API_TYPE_ID, " WHERE t.accpol_id = $1 and t.role_id = $2", [params.policy.id, params.role.id]);

        if (!rolePolicy) {
            rolePolicy = new RolePoliciesVO();
            rolePolicy.accpol_id = params.policy.id;
            rolePolicy.role_id = params.role.id;
            rolePolicy.granted = params.granted;
            await ModuleDAO.getInstance().insertOrUpdateVO(rolePolicy);
        }
    }

    private async addRoleToUser(params: AddRoleToUserParamVO): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params) || (!params.user_id) || (!params.role_id)) {
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
}
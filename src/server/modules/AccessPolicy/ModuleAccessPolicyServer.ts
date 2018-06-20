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

export default class ModuleAccessPolicyServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAccessPolicyServer.instance) {
            ModuleAccessPolicyServer.instance = new ModuleAccessPolicyServer();
        }
        return ModuleAccessPolicyServer.instance;
    }

    private static instance: ModuleAccessPolicyServer = null;

    private debug_check_access: boolean = true;

    get actif(): boolean {
        return ModuleAccessPolicy.getInstance().actif;
    }

    public registerCrons(): void {
        AccessPolicyCronWorkersHandler.getInstance();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<CheckAccessParamVO, boolean>(
            ModuleAccessPolicy.APINAME_CHECK_ACCESS,
            [AccessPolicyVO.API_TYPE_ID, UserRolesVO.API_TYPE_ID, RolePoliciesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            this.checkAccess.bind(this),
            CheckAccessParamVO.translateCheckAccessParams,
            CheckAccessParamVO.URL,
            CheckAccessParamVO.translateToURL,
            CheckAccessParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, boolean>(
            ModuleAccessPolicy.APINAME_IS_ADMIN,
            [UserRolesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            this.isAdmin.bind(this)
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<string, boolean>(
            ModuleAccessPolicy.APINAME_IS_ROLE,
            [UserRolesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            this.isRole.bind(this),
            null,
            ":role_translatable_name",
            null,
            (req) => req.params.role_translatable_name
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<string, RoleVO>(
            ModuleAccessPolicy.APINAME_ADD_ROLE_IF_NOT_EXISTS,
            [RoleVO.API_TYPE_ID],
            this.addRoleIfNotExists.bind(this)
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<AddDefaultRolePolicyIfNotExistsParamVO, void>(
            ModuleAccessPolicy.APINAME_ADD_DEFAULT_ROLE_POLICY_IF_NOT_EXISTS,
            [RolePoliciesVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AccessPolicyVO.API_TYPE_ID],
            this.addDefaultRolePolicyIfNotExists.bind(this)
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, RoleVO[]>(
            ModuleAccessPolicy.APINAME_GET_MY_ROLES,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID, UserRolesVO.API_TYPE_ID],
            this.getMyRoles.bind(this)
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<AddRoleToUserParamVO, void>(
            ModuleAccessPolicy.APINAME_ADD_ROLE_TO_USER,
            [RoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            this.addRoleToUser.bind(this),
            AddRoleToUserParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<string, boolean>(
            ModuleAccessPolicy.APINAME_BEGIN_RECOVER,
            [UserVO.API_TYPE_ID],
            this.beginRecover.bind(this)
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ResetPwdParamVO, boolean>(
            ModuleAccessPolicy.APINAME_RESET_PWD,
            [UserVO.API_TYPE_ID],
            this.resetPwd.bind(this),
            ResetPwdParamVO.translateCheckAccessParams
        ));
    }

    private async getMyRoles(): Promise<RoleVO[]> {
        let httpContext = ServerBase.getInstance().getHttpContext();
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return null;
        }

        return await ModuleDAO.getInstance().selectAll<RoleVO>(
            RoleVO.API_TYPE_ID,
            " join " + ModuleAccessPolicy.getInstance().userroles_datatable.full_name + " ur on ur.role_id = t.id " +
            " where ur.user_id = $1",
            [uid],
            [UserRolesVO.API_TYPE_ID, UserVO.API_TYPE_ID]);
    }

    private async isRole(role_translatable_name: string): Promise<boolean> {
        let httpContext = ServerBase.getInstance().getHttpContext();
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return false;
        }

        let userRoles: UserRolesVO = await ModuleDAO.getInstance().selectOne<UserRolesVO>(
            UserRolesVO.API_TYPE_ID,
            " join " + ModuleAccessPolicy.getInstance().role_datatable.full_name + " r on r.id = t.role_id " +
            " where t.user_id = $1 and r.translatable_name = $2",
            [uid, role_translatable_name],
            [UserVO.API_TYPE_ID, RoleVO.API_TYPE_ID]);

        if (userRoles) {
            return true;
        }

        return false;
    }

    private async isAdmin(): Promise<boolean> {
        let httpContext = ServerBase.getInstance().getHttpContext();
        let uid: number = httpContext ? httpContext.get('UID') : null;

        if (!uid) {
            return false;
        }

        let userRoles: UserRolesVO = await ModuleDAO.getInstance().selectOne<UserRolesVO>(
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

        let httpContext = ServerBase.getInstance().getHttpContext();
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

        let rolePolicies: RolePoliciesVO[] = await ModuleDAO.getInstance().selectAll<RolePoliciesVO>(
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

    private async addRoleIfNotExists(translatable_name: string): Promise<RoleVO> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return null;
        }

        let role: RoleVO = await ModuleDAO.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, " WHERE t.translatable_name = $1", [translatable_name]);

        if (!role) {
            role = new RoleVO();
            role.translatable_name = translatable_name;
            let insertres = await ModuleDAO.getInstance().insertOrUpdateVO(role);

            if ((!insertres) || (!insertres.id)) {
                return;
            }
            role.id = parseInt(insertres.id.toString());
            role = RoleVO.forceNumeric(role);
        }

        return role;
    }

    private async addDefaultRolePolicyIfNotExists(params: AddDefaultRolePolicyIfNotExistsParamVO): Promise<void> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params) || (!params.policy) || (!params.role)) {
            return;
        }

        let rolePolicy: RolePoliciesVO = await ModuleDAO.getInstance().selectOne<RolePoliciesVO>(RolePoliciesVO.API_TYPE_ID, " WHERE t.accpol_id = $1 and t.role_id = $2", [params.policy.id, params.role.id]);

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

        let userRole: UserRolesVO = await ModuleDAO.getInstance().selectOne<UserRolesVO>(UserRolesVO.API_TYPE_ID, " WHERE t.user_id = $1 and t.role_id = $2", [params.user_id, params.role_id]);

        if (!userRole) {
            userRole = new UserRolesVO();
            userRole.role_id = params.role_id;
            userRole.user_id = params.user_id;
            await ModuleDAO.getInstance().insertOrUpdateVO(userRole);
        }
    }

    private async beginRecover(email: string): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!email)) {
            return false;
        }

        return PasswordRecovery.getInstance().beginRecovery(email);
    }

    private async resetPwd(params: ResetPwdParamVO): Promise<boolean> {

        if ((!ModuleAccessPolicy.getInstance().actif) || (!params)) {
            return false;
        }

        return await PasswordReset.getInstance().resetPwd(params.email, params.challenge, params.new_pwd1);
    }
}
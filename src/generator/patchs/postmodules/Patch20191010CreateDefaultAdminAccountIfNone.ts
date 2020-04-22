/* istanbul ignore next: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';

export default class Patch20191010CreateDefaultAdminAccountIfNone implements IGeneratorWorker {

    public static getInstance(): Patch20191010CreateDefaultAdminAccountIfNone {
        if (!Patch20191010CreateDefaultAdminAccountIfNone.instance) {
            Patch20191010CreateDefaultAdminAccountIfNone.instance = new Patch20191010CreateDefaultAdminAccountIfNone();
        }
        return Patch20191010CreateDefaultAdminAccountIfNone.instance;
    }

    private static instance: Patch20191010CreateDefaultAdminAccountIfNone = null;

    get uid(): string {
        return 'Patch20191010CreateDefaultAdminAccountIfNone';
    }

    private constructor() { }

    /**
     * Objectif : on crée un compte admin par défaut si aucun n'existe
     */
    public async work(db: IDatabase<any>) {

        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        let users: UserVO[] = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
        if ((users != null) && (users.length > 0)) {
            return;
        }

        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos<RoleVO>(RoleVO.API_TYPE_ID);
        if ((!roles) || (!roles.length)) {
            throw new Error('Impossible de trouver le rôle nécessaire pour créer le compte admin');
        }

        let role: RoleVO = null;
        for (let i in roles) {
            if (roles[i].translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                role = roles[i];
                break;
            }
        }

        if (!role) {
            throw new Error('Impossible de trouver le rôle nécessaire pour créer le compte admin');
        }

        let admin: UserVO = await this.createuser('admin', 'contact@wedev.fr');
        await this.addRole(admin, role);
    }

    private async createuser(user_name: string, email: string): Promise<UserVO> {
        let user: UserVO = await ModuleDAO.getInstance().getNamedVoByName<UserVO>(UserVO.API_TYPE_ID, user_name);

        if (!!user) {
            return user;
        }

        let lang: LangVO = await ModuleDAOServer.getInstance().selectOne<LangVO>(LangVO.API_TYPE_ID, ' where code_lang=$1', ['fr']);

        user = new UserVO();

        user.invalidated = false;
        user.lang_id = lang.id;
        user.name = user_name;
        user.password = user_name + '$';
        user.email = email;

        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(user);
        if ((!res) || (!res.id)) {
            throw new Error('Echec de création du compte admin par défaut');
        }

        user.id = parseInt(res.id.toString());

        return user;
    }

    private async addRole(user: UserVO, role: RoleVO): Promise<void> {

        let userroles: UserRoleVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<UserRoleVO>(UserRoleVO.API_TYPE_ID, 'user_id', [role.id]);

        if ((!!userroles) && (!!userroles.length)) {
            return;
        }

        let userrole: UserRoleVO = new UserRoleVO();

        userrole.role_id = role.id;
        userrole.user_id = user.id;

        await ModuleDAO.getInstance().insertOrUpdateVO(userrole);
    }
}
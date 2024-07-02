/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CreateDefaultAdminAccountIfNone implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): CreateDefaultAdminAccountIfNone {
        if (!CreateDefaultAdminAccountIfNone.instance) {
            CreateDefaultAdminAccountIfNone.instance = new CreateDefaultAdminAccountIfNone();
        }
        return CreateDefaultAdminAccountIfNone.instance;
    }

    private static instance: CreateDefaultAdminAccountIfNone = null;

    get uid(): string {
        return 'CreateDefaultAdminAccountIfNone';
    }

    private constructor() { }

    /**
     * Objectif : on crée un compte admin par défaut si aucun n'existe
     */
    public async work(db: IDatabase<any>) {

        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        const users: UserVO[] = await query(UserVO.API_TYPE_ID).select_vos();
        if ((users != null) && (users.length > 0)) {
            return;
        }

        const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).select_vos();
        if ((!roles) || (!roles.length)) {
            throw new Error('Impossible de trouver le rôle nécessaire pour créer le compte admin');
        }

        let role: RoleVO = null;
        for (const i in roles) {
            if (roles[i].translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                role = roles[i];
                break;
            }
        }

        if (!role) {
            throw new Error('Impossible de trouver le rôle nécessaire pour créer le compte admin');
        }

        const admin: UserVO = await this.createuser('admin', 'contact@wedev.fr');
        await this.addRole(admin, role);
    }

    private async createuser(user_name: string, email: string): Promise<UserVO> {
        let user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_text_eq(field_names<UserVO>().name, user_name).select_vo<UserVO>();

        if (user) {
            return user;
        }

        const lang: LangVO = await query(LangVO.API_TYPE_ID).filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr').exec_as_server().select_one();

        user = new UserVO();

        user.invalidated = false;
        user.lang_id = lang.id;
        user.name = user_name;
        user.password = user_name + '$';
        user.email = email;

        const res: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);
        if ((!res) || (!res.id)) {
            throw new Error('Echec de création du compte admin par défaut');
        }

        user.id = res.id;

        return user;
    }

    private async addRole(user: UserVO, role: RoleVO): Promise<void> {

        const userroles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().user_id, role.id).select_vos();

        if ((!!userroles) && (!!userroles.length)) {
            return;
        }

        const userrole: UserRoleVO = new UserRoleVO();

        userrole.role_id = role.id;
        userrole.user_id = user.id;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(userrole);
    }
}
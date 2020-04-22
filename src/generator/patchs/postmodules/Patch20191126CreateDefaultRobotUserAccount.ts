/* istanbul ignore next: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20191126CreateDefaultRobotUserAccount implements IGeneratorWorker {

    public static getInstance(): Patch20191126CreateDefaultRobotUserAccount {
        if (!Patch20191126CreateDefaultRobotUserAccount.instance) {
            Patch20191126CreateDefaultRobotUserAccount.instance = new Patch20191126CreateDefaultRobotUserAccount();
        }
        return Patch20191126CreateDefaultRobotUserAccount.instance;
    }

    private static instance: Patch20191126CreateDefaultRobotUserAccount = null;

    get uid(): string {
        return 'Patch20191126CreateDefaultRobotUserAccount';
    }

    private constructor() { }

    /**
     * Objectif : on crée un compte admin par défaut si aucun n'existe
     */
    public async work(db: IDatabase<any>) {

        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        await this.createuser('robot', 'robot@wedev.fr');
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
            throw new Error('Echec de création du compte robot par défaut');
        }

        user.id = parseInt(res.id.toString());

        return user;
    }
}
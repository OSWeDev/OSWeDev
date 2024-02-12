/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CreateDefaultRobotUserAccount implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): CreateDefaultRobotUserAccount {
        if (!CreateDefaultRobotUserAccount.instance) {
            CreateDefaultRobotUserAccount.instance = new CreateDefaultRobotUserAccount();
        }
        return CreateDefaultRobotUserAccount.instance;
    }

    private static instance: CreateDefaultRobotUserAccount = null;

    get uid(): string {
        return 'CreateDefaultRobotUserAccount';
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

        let lang: LangVO = await query(LangVO.API_TYPE_ID).filter_by_text_eq('code_lang', 'fr-fr').select_one();

        user = new UserVO();

        user.invalidated = false;
        user.lang_id = lang.id;
        user.name = user_name;
        user.password = user_name + '$';
        user.email = email;

        let res: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);
        if ((!res) || (!res.id)) {
            throw new Error('Echec de création du compte robot par défaut');
        }

        user.id = res.id;

        return user;
    }
}
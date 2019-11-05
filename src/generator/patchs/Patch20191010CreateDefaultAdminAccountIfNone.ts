import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../server/modules/DAO/ModuleDAOServer';
import UserVO from '../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import LangVO from '../../shared/modules/Translation/vos/LangVO';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../IGeneratorWorker';

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

        try {
            let users: UserVO[] = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
            if ((users != null) || (users.length > 0)) {
                return;
            }
            await this.createuser('admin', 'contact@wedev.fr');
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    private async createuser(user_name: string, email: string) {
        try {
            let import_auto: UserVO = await ModuleDAO.getInstance().getNamedVoByName<UserVO>(UserVO.API_TYPE_ID, user_name);

            if (!!import_auto) {
                return;
            }

            let lang: LangVO = await ModuleDAOServer.getInstance().selectOne<LangVO>(LangVO.API_TYPE_ID, ' where code_lang=$1', ['fr']);

            import_auto = new UserVO();

            import_auto.invalidated = false;
            import_auto.lang_id = lang.id;
            import_auto.name = user_name;
            import_auto.password = user_name + '$';
            import_auto.email = email;

            await ModuleDAO.getInstance().insertOrUpdateVO(import_auto);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }
}
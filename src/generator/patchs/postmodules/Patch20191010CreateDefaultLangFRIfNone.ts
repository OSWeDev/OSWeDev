import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';

/* istanbul ignore next: no unit tests on patchs */
export default class Patch20191010CreateDefaultLangFRIfNone implements IGeneratorWorker {

    public static getInstance(): Patch20191010CreateDefaultLangFRIfNone {
        if (!Patch20191010CreateDefaultLangFRIfNone.instance) {
            Patch20191010CreateDefaultLangFRIfNone.instance = new Patch20191010CreateDefaultLangFRIfNone();
        }
        return Patch20191010CreateDefaultLangFRIfNone.instance;
    }

    private static instance: Patch20191010CreateDefaultLangFRIfNone = null;

    get uid(): string {
        return 'Patch20191010CreateDefaultLangFRIfNone';
    }

    private constructor() { }

    /**
     * Objectif : on crée la lang FR si aucune n'est en base
     */
    public async work(db: IDatabase<any>) {

        try {
            let langs: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
            if ((langs != null) && (langs.length > 0)) {
                return;
            }
            await this.createlang('fr');
        } catch (error) {
            console.error(error);
        }
    }

    private async createlang(code_lang: string) {
        try {
            let lang: LangVO = await ModuleDAOServer.getInstance().selectOne<LangVO>(LangVO.API_TYPE_ID, "where code_lang=$1;", [code_lang]);

            if (!!lang) {
                return;
            }

            lang = new LangVO();

            lang.code_lang = code_lang;

            await ModuleDAO.getInstance().insertOrUpdateVO(lang);
        } catch (error) {
            console.error(error);
        }
    }
}
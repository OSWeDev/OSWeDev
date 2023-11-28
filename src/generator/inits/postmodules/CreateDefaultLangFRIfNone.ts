/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';

export default class CreateDefaultLangFRIfNone implements IGeneratorWorker {

    public static getInstance(): CreateDefaultLangFRIfNone {
        if (!CreateDefaultLangFRIfNone.instance) {
            CreateDefaultLangFRIfNone.instance = new CreateDefaultLangFRIfNone();
        }
        return CreateDefaultLangFRIfNone.instance;
    }

    private static instance: CreateDefaultLangFRIfNone = null;

    get uid(): string {
        return 'CreateDefaultLangFRIfNone';
    }

    private constructor() { }

    /**
     * Objectif : on crée la lang FR si aucune n'est en base
     */
    public async work(db: IDatabase<any>) {

        try {
            let langs: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
            if ((langs != null) && (langs.length > 0)) {
                return;
            }
            await this.createlang('fr-fr');
        } catch (error) {
            console.error(error);
        }
    }

    private async createlang(code_lang: string) {
        try {
            let lang: LangVO = await query(LangVO.API_TYPE_ID).filter_by_text_eq('code_lang', code_lang).select_one();

            if (!!lang) {
                return;
            }

            lang = new LangVO();

            lang.code_lang = code_lang;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(lang);
        } catch (error) {
            console.error(error);
        }
    }
}
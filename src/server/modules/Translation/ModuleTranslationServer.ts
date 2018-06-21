import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleServerBase from '../ModuleServerBase';
import { Express, Request, Response } from 'express';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import GetAPIDefinition from '../../../shared/modules/API/vos/GetAPIDefinition';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import GetTranslationParamVO from '../../../shared/modules/Translation/apis/GetTranslationParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import FileHandler from '../../tools/FileHandler';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';

export default class ModuleTranslationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleTranslationServer.instance) {
            ModuleTranslationServer.instance = new ModuleTranslationServer();
        }
        return ModuleTranslationServer.instance;
    }

    private static instance: ModuleTranslationServer = null;

    get actif(): boolean {
        return ModuleTranslation.getInstance().actif;
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            this.getAllTranslations.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, LangVO[]>(
            ModuleTranslation.APINAME_GET_LANGS,
            [LangVO.API_TYPE_ID],
            this.getLangs.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<string, TranslatableTextVO>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT,
            [TranslatableTextVO.API_TYPE_ID],
            this.getTranslatableText.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslatableTextVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS,
            [TranslatableTextVO.API_TYPE_ID],
            this.getTranslatableTexts.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<GetTranslationParamVO, TranslationVO>(
            ModuleTranslation.APINAME_GET_TRANSLATION,
            [TranslationVO.API_TYPE_ID],
            this.getTranslation.bind(this),
            GetTranslationParamVO.translateCheckAccessParams,
            GetTranslationParamVO.URL,
            GetTranslationParamVO.translateToURL,
            GetTranslationParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            this.getTranslations.bind(this)
        ));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
    }

    public async getTranslatableText(code_text: string): Promise<TranslatableTextVO> {
        return await ModuleDAO.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, 'where code_text = $1', [code_text]);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslationVO>(TranslationVO.API_TYPE_ID);
    }

    public async getTranslations(lang_id: number): Promise<TranslationVO[]> {
        return await ModuleDAO.getInstance().selectAll<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1', [lang_id]);
    }

    public async getTranslation(params: GetTranslationParamVO): Promise<TranslationVO> {
        return await ModuleDAO.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1 and t.text_id = $2', [params.lang_id, params.text_id]);
    }

    public async configure(): Promise<void> {

        // On charge les langs, puis les trads dans chaque lang
        let langs: LangVO[] = await this.getLangs();
        let langsFileContent: string = this.getLangsFileContent(langs);

        if (!await FileHandler.getInstance().dirExists('./src/client/locales/')) {
            await FileHandler.getInstance().dirCreate('./src/client/locales/');
        }
        await FileHandler.getInstance().writeFile('./src/client/locales/locales.ts', langsFileContent);

        let translatableTexts: TranslatableTextVO[] = await this.getTranslatableTexts();

        for (let i in langs) {

            let lang: LangVO = langs[i];
            let translations: TranslationVO[] = await this.getTranslations(lang.id);
            let langFileContent: string = this.getLangFileContent(lang, translations, VOsTypesManager.getInstance().vosArray_to_vosByIds(translatableTexts));

            if (!await FileHandler.getInstance().dirExists('./src/client/locales/' + lang.code_lang.toLowerCase())) {
                await FileHandler.getInstance().dirCreate('./src/client/locales/' + lang.code_lang.toLowerCase());
            }
            await FileHandler.getInstance().writeFile('./src/client/locales/' + lang.code_lang.toLowerCase() + '/translation.ts', langFileContent);
        }
    }

    private getLangsFileContent(langs: LangVO[]): string {
        let res: string = "";

        for (let i in langs) {
            let lang: LangVO = langs[i];

            res += "import { LOCALE_" + lang.code_lang.toUpperCase() + " } from './" + lang.code_lang.toLowerCase() + "/translation';\n";
        }
        res += "\n";

        res += "export const ALL_LOCALES = {\n";

        for (let i in langs) {
            let lang: LangVO = langs[i];

            res += "    " + lang.code_lang.toLowerCase() + ": LOCALE_" + lang.code_lang.toUpperCase() + ",\n";
        }

        res += "};\n";

        return res;
    }

    private getLangFileContent(lang: LangVO, translations: TranslationVO[], translatableTexts_by_id: { [id: number]: TranslatableTextVO }): string {
        let res: string = "";
        res += "/* tslint:disable */\n";
        res += "export const LOCALE_" + lang.code_lang.toUpperCase() + " = \n";

        let translationsObj = {};
        for (let i in translations) {
            let translation: TranslationVO = translations[i];
            this.index(translationsObj, translatableTexts_by_id[translation.text_id].code_text, translation.translated.replace('"', '\"'));
        }

        res += JSON.stringify(translationsObj);

        res += ";\n";
        return res;
    }

    private index(obj, is, value) {
        if (typeof is == 'string') {
            return this.index(obj, is.split('.'), value);
        } else if (is.length == 1 && value !== undefined) {
            return obj[is[0]] = value;
        } else if (is.length == 0) {
            return obj;
        } else {
            if (typeof obj[is[0]] == 'undefined') {
                obj[is[0]] = {};
            }
            return this.index(obj[is[0]], is.slice(1), value);
        }
    }
}
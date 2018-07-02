import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GetTranslationParamVO from '../../../shared/modules/Translation/apis/GetTranslationParamVO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import FileHandler from '../../tools/FileHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';

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

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS, this.getAllTranslations.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_LANGS, this.getLangs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, this.getTranslatableText.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS, this.getTranslatableTexts.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATION, this.getTranslation.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATIONS, this.getTranslations.bind(this));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
    }

    public async getTranslatableText(param: StringParamVO): Promise<TranslatableTextVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, 'where code_text = $1', [param.text]);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslationVO>(TranslationVO.API_TYPE_ID);
    }

    public async getTranslations(param: NumberParamVO): Promise<TranslationVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1', [param.num]);
    }

    public async getTranslation(params: GetTranslationParamVO): Promise<TranslationVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1 and t.text_id = $2', [params.lang_id, params.text_id]);
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
            let translations: TranslationVO[] = await ModuleTranslation.getInstance().getTranslations(lang.id);
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
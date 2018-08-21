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

    private constructor() {
        super(ModuleTranslation.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS, this.getAllTranslations.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_LANGS, this.getLangs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, this.getTranslatableText.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS, this.getTranslatableTexts.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATION, this.getTranslation.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATIONS, this.getTranslations.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_getALL_LOCALES, this.getALL_LOCALES.bind(this));
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

    private async getALL_LOCALES(): Promise<{ [code_lang: string]: any }> {
        let langs: LangVO[] = await this.getLangs();
        let translatableTexts: TranslatableTextVO[] = await this.getTranslatableTexts();
        let translatableTexts_by_id: { [id: number]: TranslatableTextVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(translatableTexts);
        let res: { [code_lang: string]: any } = {};

        for (let i in langs) {
            let lang: LangVO = langs[i];
            let translations: TranslationVO[] = await ModuleTranslation.getInstance().getTranslations(lang.id);

            for (let i in translations) {
                let translation: TranslationVO = translations[i];

                if (!translation.text_id) {
                    continue;
                }

                res = this.addCodeToLocales(res, lang.code_lang.toLowerCase(), translatableTexts_by_id[translation.text_id].code_text, translation.translated);
            }
        }
        return res;
    }

    public addCodeToLocales(ALL_LOCALES: { [code_lang: string]: any }, code_lang: string, code_text: string, translated: string): { [code_lang: string]: any } {

        if (!ALL_LOCALES) {
            ALL_LOCALES = {};
        }

        if ((!code_lang) || (!code_text)) {
            return ALL_LOCALES;
        }

        if (!translated) {
            translated = "";
        }

        let tmp_code_text_segs: string[] = code_text.split('.');
        let code_text_segs: string[] = [];

        for (let i in tmp_code_text_segs) {
            if (tmp_code_text_segs[i] && (tmp_code_text_segs[i] != "")) {
                code_text_segs.push(tmp_code_text_segs[i]);
            }
        }

        if (!ALL_LOCALES[code_lang]) {
            ALL_LOCALES[code_lang] = {};
        }

        let locale_pointer = ALL_LOCALES[code_lang];
        for (let i in code_text_segs) {
            let code_text_seg = code_text_segs[i];

            if (parseInt(i.toString()) == (code_text_segs.length - 1)) {

                locale_pointer[code_text_seg] = translated;
                break;
            }

            if (!locale_pointer[code_text_seg]) {
                locale_pointer[code_text_seg] = {};
            }

            locale_pointer = locale_pointer[code_text_seg];
        }

        return ALL_LOCALES;
    }
}
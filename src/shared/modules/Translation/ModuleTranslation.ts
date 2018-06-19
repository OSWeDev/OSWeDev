/// #if false
import FileHandler from '../../tools/FileHandler';
/// #endif
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModuleParamChange from '../ModuleParamChange';
import * as moment from 'moment';
import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import ModulesManager from '../ModulesManager';
import TimeSegment from '../DataRender/vos/TimeSegment';
import LangVO from './vos/LangVO';
import TranslationVO from './vos/TranslationVO';
import TranslatableTextVO from './vos/TranslatableTextVO';
import VOsTypesManager from '../VOsTypesManager';
import ModuleAPI from '../API/ModuleAPI';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import GetTranslationParamVO from './apis/GetTranslationParamVO';

export default class ModuleTranslation extends Module {

    public static APINAME_GET_TRANSLATABLE_TEXTS: string = "getTranslatableTexts";
    public static APINAME_GET_TRANSLATABLE_TEXT: string = "getTranslatableText";
    public static APINAME_GET_LANGS: string = "getLangs";
    public static APINAME_GET_ALL_TRANSLATIONS: string = "getAllTranslations";
    public static APINAME_GET_TRANSLATIONS: string = "getTranslations";
    public static APINAME_GET_TRANSLATION: string = "getTranslation";

    public static getInstance(): ModuleTranslation {
        if (!ModuleTranslation.instance) {
            ModuleTranslation.instance = new ModuleTranslation();
        }
        return ModuleTranslation.instance;
    }

    private static instance: ModuleTranslation = null;

    public datatable_lang: ModuleTable<LangVO>;
    public datatable_translatabletext: ModuleTable<TranslatableTextVO>;
    public datatable_translation: ModuleTable<TranslationVO>;

    private constructor() {

        super("translation", "Translation");
        this.initialize();

        // Si on est côté serveur l'init des apis se passe dans le module server
        if (!ModulesManager.getInstance().isServerSide) {
            this.registerApis();
        }
    }

    /// #if false
    public async hook_module_configure(db) {
        await this.generate();

        return true;
    }
    public async hook_module_install(db) { return true; }
    /// #endif

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, LangVO[]>(
            ModuleTranslation.APINAME_GET_LANGS,
            [LangVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<string, TranslatableTextVO>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT,
            [TranslatableTextVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslatableTextVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS,
            [TranslatableTextVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<GetTranslationParamVO, TranslationVO>(
            ModuleTranslation.APINAME_GET_TRANSLATION,
            [TranslationVO.API_TYPE_ID],
            null,
            GetTranslationParamVO.translateCheckAccessParams,
            GetTranslationParamVO.URL,
            GetTranslationParamVO.translateToURL,
            GetTranslationParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID]
        ));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslatableTextVO[]>(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS);
    }

    public async getTranslatableText(code_text: string): Promise<TranslatableTextVO> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslatableTextVO>(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, code_text);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, LangVO[]>(ModuleTranslation.APINAME_GET_LANGS);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslationVO[]>(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS);
    }

    public async getTranslations(lang_id: number): Promise<TranslationVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslationVO[]>(ModuleTranslation.APINAME_GET_TRANSLATIONS, lang_id);
    }

    public async getTranslation(lang_id: number, text_id: number): Promise<TranslationVO> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslationVO>(ModuleTranslation.APINAME_GET_TRANSLATION, lang_id, text_id);
    }

    protected initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table lang
        let datatable_fields = [
            new ModuleTableField('code_lang', ModuleTableField.FIELD_TYPE_string, 'Code de la langue', true),
        ];

        this.datatable_lang = new ModuleTable(this, LangVO.API_TYPE_ID, LangVO.forceNumeric, LangVO.forceNumerics, datatable_fields, LangVO.API_TYPE_ID);
        this.datatables.push(this.datatable_lang);

        // Création de la table translatableText
        datatable_fields = [
            new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'Id du text', true),
        ];

        this.datatable_translatabletext = new ModuleTable(this, TranslatableTextVO.API_TYPE_ID, TranslatableTextVO.forceNumeric, TranslatableTextVO.forceNumerics, datatable_fields, TranslatableTextVO.API_TYPE_ID);
        this.datatables.push(this.datatable_translatabletext);

        // Création de la table translation
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', false);
        let field_text_id = new ModuleTableField('text_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Text', false);
        datatable_fields = [
            field_lang_id,
            field_text_id,
            new ModuleTableField('translated', ModuleTableField.FIELD_TYPE_string, 'Texte traduit', true),
        ];

        this.datatable_translation = new ModuleTable(this, TranslationVO.API_TYPE_ID, TranslationVO.forceNumeric, TranslationVO.forceNumerics, datatable_fields, TranslationVO.API_TYPE_ID);
        field_lang_id.addRelation(this.datatable_translation, 'ref', this.datatable_lang.name, 'id');
        field_text_id.addRelation(this.datatable_translation, 'ref', this.datatable_translatabletext.name, 'id');
        this.datatables.push(this.datatable_translation);
    }

    /// #if false
    private async generate() {

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
    /// #endif
}
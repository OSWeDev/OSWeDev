import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO from '../API/vos/apis/NumberParamVO';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import GetTranslationParamVO from './apis/GetTranslationParamVO';
import LangVO from './vos/LangVO';
import TranslatableTextVO from './vos/TranslatableTextVO';
import TranslationVO from './vos/TranslationVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';

export default class ModuleTranslation extends Module {

    public static MODULE_NAME: string = 'Translation';

    public static POLICY_GROUP: string = ModuleAccessPolicy.POLICY_GROUP_UID_PREFIX + ModuleTranslation.MODULE_NAME;
    public static POLICY_BO_TRANSLATIONS_ACCESS: string = ModuleAccessPolicy.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.BO_TRANSLATIONS_ACCESS';
    public static POLICY_BO_OTHERS_ACCESS: string = ModuleAccessPolicy.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.BO_OTHERS_ACCESS';
    public static POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS: string = ModuleAccessPolicy.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.ON_PAGE_TRANSLATION_MODULE_ACCESS';

    public static APINAME_GET_TRANSLATABLE_TEXTS: string = "getTranslatableTexts";
    public static APINAME_GET_TRANSLATABLE_TEXT: string = "getTranslatableText";
    public static APINAME_GET_LANGS: string = "getLangs";
    public static APINAME_GET_ALL_TRANSLATIONS: string = "getAllTranslations";
    public static APINAME_GET_TRANSLATIONS: string = "getTranslations";
    public static APINAME_GET_TRANSLATION: string = "getTranslation";
    public static APINAME_getALL_LOCALES: string = "getALL_LOCALES";

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

        super("translation", ModuleTranslation.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, LangVO[]>(
            ModuleTranslation.APINAME_GET_LANGS,
            [LangVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, TranslatableTextVO>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT,
            [TranslatableTextVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, TranslatableTextVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS,
            [TranslatableTextVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<GetTranslationParamVO, TranslationVO>(
            ModuleTranslation.APINAME_GET_TRANSLATION,
            [TranslationVO.API_TYPE_ID],
            GetTranslationParamVO.translateCheckAccessParams,
            GetTranslationParamVO.URL,
            GetTranslationParamVO.translateToURL,
            GetTranslationParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, TranslationVO[]>(
            ModuleTranslation.APINAME_GET_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, { [code_lang: string]: { [code_text: string]: string } }>(
            ModuleTranslation.APINAME_getALL_LOCALES,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID]
        ));
    }

    public async getALL_LOCALES(): Promise<{ [code_lang: string]: { [code_text: string]: string } }> {
        return await ModuleAPI.getInstance().handleAPI<void, { [code_lang: string]: { [code_text: string]: string } }>(ModuleTranslation.APINAME_getALL_LOCALES);
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslatableTextVO[]>(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS);
    }

    public async getTranslatableText(code_text: string): Promise<TranslatableTextVO> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, TranslatableTextVO>(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, code_text);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, LangVO[]>(ModuleTranslation.APINAME_GET_LANGS);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, TranslationVO[]>(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS);
    }

    public async getTranslations(lang_id: number): Promise<TranslationVO[]> {
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, TranslationVO[]>(ModuleTranslation.APINAME_GET_TRANSLATIONS, lang_id);
    }

    public async getTranslation(lang_id: number, text_id: number): Promise<TranslationVO> {
        return await ModuleAPI.getInstance().handleAPI<GetTranslationParamVO, TranslationVO>(ModuleTranslation.APINAME_GET_TRANSLATION, lang_id, text_id);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table lang
        let label_field = new ModuleTableField('code_lang', ModuleTableField.FIELD_TYPE_string, 'Code de la langue', true);
        let datatable_fields = [
            label_field
        ];
        this.datatable_lang = new ModuleTable(this, LangVO.API_TYPE_ID, datatable_fields, label_field, "Langues");
        this.datatables.push(this.datatable_lang);

        // Création de la table translatableText
        label_field = new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'Id du text', true);
        datatable_fields = [
            label_field
        ];
        this.datatable_translatabletext = new ModuleTable(this, TranslatableTextVO.API_TYPE_ID, datatable_fields, label_field, "Codes");
        this.datatables.push(this.datatable_translatabletext);

        // Création de la table translation
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', false);
        let field_text_id = new ModuleTableField('text_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Text', false);
        label_field = new ModuleTableField('translated', ModuleTableField.FIELD_TYPE_string, 'Texte traduit', true);
        datatable_fields = [
            field_lang_id,
            field_text_id,
            label_field
        ];

        this.datatable_translation = new ModuleTable(this, TranslationVO.API_TYPE_ID, datatable_fields, label_field, "Traductions");
        field_lang_id.addManyToOneRelation(this.datatable_translation, this.datatable_lang);
        field_text_id.addManyToOneRelation(this.datatable_translation, this.datatable_translatabletext);
        this.datatables.push(this.datatable_translation);
    }
}
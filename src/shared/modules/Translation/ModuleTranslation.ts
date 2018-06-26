import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModulesManager from '../ModulesManager';
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
        field_lang_id.addManyToOneRelation(this.datatable_translation, this.datatable_lang);
        field_text_id.addManyToOneRelation(this.datatable_translation, this.datatable_translatabletext);
        this.datatables.push(this.datatable_translation);
    }
}
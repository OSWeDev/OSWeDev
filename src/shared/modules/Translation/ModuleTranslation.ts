import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import GetTranslationParamVO, { GetTranslationParamVOStatic } from './apis/GetTranslationParamVO';
import TParamVO, { TParamVOStatic } from './apis/TParamVO';
import LangVO from './vos/LangVO';
import TranslatableTextVO from './vos/TranslatableTextVO';
import TranslationVO from './vos/TranslationVO';

export default class ModuleTranslation extends Module {

    public static MODULE_NAME: string = 'Translation';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleTranslation.MODULE_NAME;
    public static POLICY_BO_TRANSLATIONS_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.BO_TRANSLATIONS_ACCESS';
    public static POLICY_BO_OTHERS_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.BO_OTHERS_ACCESS';
    public static POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.ON_PAGE_TRANSLATION_MODULE_ACCESS';
    public static POLICY_LANG_SELECTOR_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.LANG_SELECTOR_ACCESS';
    public static POLICY_LANG_SELECTOR_PER_LANG_ACCESS_PREFIX: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslation.MODULE_NAME + '.LANG_SELECTOR_PER_LANG_ACCESS_PREFIX';

    public static APINAME_GET_TRANSLATABLE_TEXTS: string = "getTranslatableTexts";
    public static APINAME_GET_TRANSLATABLE_TEXT: string = "getTranslatableText";
    public static APINAME_GET_LANGS: string = "getLangs";
    public static APINAME_GET_LANG: string = "getLang";
    public static APINAME_GET_ALL_TRANSLATIONS: string = "getAllTranslations";
    public static APINAME_GET_TRANSLATIONS: string = "getTranslations";
    public static APINAME_GET_TRANSLATION: string = "getTranslation";
    public static APINAME_getALL_LOCALES: string = "getALL_LOCALES";
    public static APINAME_getALL_FLAT_LOCALE_TRANSLATIONS: string = "getALL_FLAT_LOCALE_TRANSLATIONS";
    public static APINAME_T: string = "t";
    public static APINAME_LABEL: string = "label";

    public static getInstance(): ModuleTranslation {
        if (!ModuleTranslation.instance) {
            ModuleTranslation.instance = new ModuleTranslation();
        }
        return ModuleTranslation.instance;
    }

    private static instance: ModuleTranslation = null;

    public getALL_LOCALES: () => Promise<{ [code_lang: string]: { [code_text: string]: any } }> = APIControllerWrapper.sah(ModuleTranslation.APINAME_getALL_LOCALES);
    public getALL_FLAT_LOCALE_TRANSLATIONS: (code_lang: string) => Promise<{ [code_text: string]: string }> = APIControllerWrapper.sah(ModuleTranslation.APINAME_getALL_FLAT_LOCALE_TRANSLATIONS);
    public getTranslatableTexts: () => Promise<TranslatableTextVO[]> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS);
    public getTranslatableText: (code_text: string) => Promise<TranslatableTextVO> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT);
    public getLangs: () => Promise<LangVO[]> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_LANGS);
    public getLang: (code_lang: string) => Promise<LangVO> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_LANG);
    public getAllTranslations: () => Promise<TranslationVO[]> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS);
    public getTranslations: (lang_id: number) => Promise<TranslationVO[]> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_TRANSLATIONS);
    public getTranslation: (lang_id: number, text_id: number) => Promise<TranslationVO> = APIControllerWrapper.sah(ModuleTranslation.APINAME_GET_TRANSLATION);
    public t: (code_text: string, lang_id: number) => Promise<string> = APIControllerWrapper.sah(ModuleTranslation.APINAME_T);
    public label: (code_text: string, lang_id: number) => Promise<string> = APIControllerWrapper.sah(ModuleTranslation.APINAME_LABEL);

    private constructor() {

        super("translation", ModuleTranslation.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang_id: number) {
        return ModuleTranslation.POLICY_LANG_SELECTOR_PER_LANG_ACCESS_PREFIX + '_' + lang_id;
    }

    public registerApis() {
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<void, TranslationVO[]>(
            null,
            ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, { [code_text: string]: string }>(
            null,
            ModuleTranslation.APINAME_getALL_FLAT_LOCALE_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<void, LangVO[]>(
            null,
            ModuleTranslation.APINAME_GET_LANGS,
            [LangVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, LangVO>(
            null,
            ModuleTranslation.APINAME_GET_LANG,
            [LangVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, TranslatableTextVO>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT,
            [TranslatableTextVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<void, TranslatableTextVO[]>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS,
            [TranslatableTextVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetTranslationParamVO, TranslationVO>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATION,
            [TranslationVO.API_TYPE_ID],
            GetTranslationParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<NumberParamVO, TranslationVO[]>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<void, { [code_lang: string]: { [code_text: string]: string } }>(
            null,
            ModuleTranslation.APINAME_getALL_LOCALES,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<TParamVO, string>(
            null,
            ModuleTranslation.APINAME_T,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID],
            TParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<TParamVO, string>(
            null,
            ModuleTranslation.APINAME_LABEL,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID],
            TParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table lang
        let label_field = new ModuleTableField('code_lang', ModuleTableField.FIELD_TYPE_string, 'Code de la langue', true).unique();
        let datatable_fields = [
            label_field,
            new ModuleTableField('code_flag', ModuleTableField.FIELD_TYPE_string, 'Code du drapeau', false),
            new ModuleTableField('code_phone', ModuleTableField.FIELD_TYPE_string, 'Indicatif (+33)', false),
        ];
        let datatable_lang = new ModuleTable(this, LangVO.API_TYPE_ID, () => new LangVO(), datatable_fields, label_field, "Langues");
        this.datatables.push(datatable_lang);

        // Création de la table translatableText
        label_field = new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'Id du text', true).unique();
        datatable_fields = [
            label_field
        ];
        let datatable_translatabletext = new ModuleTable(this, TranslatableTextVO.API_TYPE_ID, () => new TranslatableTextVO(), datatable_fields, label_field, "Codes");
        this.datatables.push(datatable_translatabletext);

        // Création de la table translation
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', true);
        let field_text_id = new ModuleTableField('text_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Text', true);
        label_field = new ModuleTableField('translated', ModuleTableField.FIELD_TYPE_string, 'Texte traduit', true);
        datatable_fields = [
            field_lang_id,
            field_text_id,
            label_field
        ];

        let datatable_translation = new ModuleTable(this, TranslationVO.API_TYPE_ID, () => new TranslationVO(), datatable_fields, label_field, "Traductions");
        field_lang_id.addManyToOneRelation(datatable_lang);
        field_text_id.addManyToOneRelation(datatable_translatabletext);
        this.datatables.push(datatable_translation);
    }
}
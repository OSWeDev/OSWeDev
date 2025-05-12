import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import ModuleTableCompositeUniqueKeyController from '../DAO/ModuleTableCompositeUniqueKeyController';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import OseliaRunVO from '../Oselia/vos/OseliaRunVO';
import GetTranslationParamVO, { GetTranslationParamVOStatic } from './apis/GetTranslationParamVO';
import TParamVO, { TParamVOStatic } from './apis/TParamVO';
import DefaultTranslationVO from './vos/DefaultTranslationVO';
import DemandeAssistantTraductionVO from './vos/DemandeAssistantTraductionVO';
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

    private static instance: ModuleTranslation = null;

    public getALL_LOCALES: () => Promise<{ [code_lang: string]: { [code_text: string]: any } }> = APIControllerWrapper.sah(ModuleTranslation.APINAME_getALL_LOCALES);
    public getALL_FLAT_LOCALE_TRANSLATIONS: (code_lang: string) => Promise<{ [code_text: string]: string }> = APIControllerWrapper.sah(ModuleTranslation.APINAME_getALL_FLAT_LOCALE_TRANSLATIONS);
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

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTranslation {
        if (!ModuleTranslation.instance) {
            ModuleTranslation.instance = new ModuleTranslation();
        }
        return ModuleTranslation.instance;
    }


    public get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang_id: number) {
        return ModuleTranslation.POLICY_LANG_SELECTOR_PER_LANG_ACCESS_PREFIX + '_' + lang_id;
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<void, TranslationVO[]>(
            null,
            ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, { [code_text: string]: string }>(
            null,
            ModuleTranslation.APINAME_getALL_FLAT_LOCALE_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<void, LangVO[]>(
            null,
            ModuleTranslation.APINAME_GET_LANGS,
            [LangVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, LangVO>(
            null,
            ModuleTranslation.APINAME_GET_LANG,
            [LangVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, TranslatableTextVO>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT,
            [TranslatableTextVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetTranslationParamVO, TranslationVO>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATION,
            [TranslationVO.API_TYPE_ID],
            GetTranslationParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<NumberParamVO, TranslationVO[]>(
            null,
            ModuleTranslation.APINAME_GET_TRANSLATIONS,
            [TranslationVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<void, { [code_lang: string]: { [code_text: string]: string } }>(
            null,
            ModuleTranslation.APINAME_getALL_LOCALES,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<TParamVO, string>(
            null,
            ModuleTranslation.APINAME_T,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID],
            TParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<TParamVO, string>(
            null,
            ModuleTranslation.APINAME_LABEL,
            [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID],
            TParamVOStatic
        ));
    }

    public initialize() {

        this.initialize_LangVO();
        this.initialize_TranslatableTextVO();
        this.initialize_TranslationVO();
        this.initialize_DefaultTranslationVO();
        this.initialize_DemandeAssistantTraductionVO();
    }

    private initialize_LangVO() {
        // Création de la table lang
        const label_field = ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_lang, ModuleTableFieldVO.FIELD_TYPE_string, 'Code de la langue', true).unique();
        ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_flag, ModuleTableFieldVO.FIELD_TYPE_string, 'Code du drapeau', false);
        ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_phone, ModuleTableFieldVO.FIELD_TYPE_string, 'Indicatif (+33)', false);

        ModuleTableController.create_new(this.name, LangVO, label_field, "Langues");
    }

    private initialize_TranslatableTextVO() {
        // Création de la table translatableText
        const label_field = ModuleTableFieldController.create_new(TranslatableTextVO.API_TYPE_ID, field_names<TranslatableTextVO>().code_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Id du text', true).unique();
        ModuleTableController.create_new(this.name, TranslatableTextVO, label_field, "Codes");
    }

    private initialize_TranslationVO() {
        // Création de la table translation
        const field_lang_id = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true)
            .set_many_to_one_target_moduletable_name(LangVO.API_TYPE_ID);
        const field_text_id = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().text_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Text', true)
            .set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        const label_field = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().translated, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte traduit', true);

        ModuleTableController.create_new(this.name, TranslationVO, label_field, "Traductions");
        ModuleTableCompositeUniqueKeyController.add_composite_unique_key_to_vo_type(TranslationVO.API_TYPE_ID, [field_lang_id, field_text_id]);
    }

    private initialize_DefaultTranslationVO() {
        const label_field = ModuleTableFieldController.create_new(DefaultTranslationVO.API_TYPE_ID, field_names<DefaultTranslationVO>().code_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Code texte de la traduction', true).unique();
        ModuleTableFieldController.create_new(DefaultTranslationVO.API_TYPE_ID, field_names<DefaultTranslationVO>().default_translations, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Traductions', true);

        ModuleTableController.create_new(this.name, DefaultTranslationVO, label_field, "Traductions par défaut");
    }

    private initialize_DemandeAssistantTraductionVO() {
        ModuleTableFieldController.create_new(DemandeAssistantTraductionVO.API_TYPE_ID, field_names<DemandeAssistantTraductionVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true)
            .set_many_to_one_target_moduletable_name(LangVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(DemandeAssistantTraductionVO.API_TYPE_ID, field_names<DemandeAssistantTraductionVO>().text_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Texte', true)
            .set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(DemandeAssistantTraductionVO.API_TYPE_ID, field_names<DemandeAssistantTraductionVO>().oselia_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Oselia run', true)
            .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);
        ModuleTableController.create_new(this.name, DemandeAssistantTraductionVO, null, "Demandes d'assistant de traduction");
    }
}
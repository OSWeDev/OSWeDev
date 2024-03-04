import LocaleManager from "../../../tools/LocaleManager";
import ModuleTranslation from "../ModuleTranslation";

/**
 * TranslationManager
 * - Manage translations
 */
export default class TranslationManager {

    /**
     * get_all_flat_locale_translations
     * - Get all translations for a specific locale
     *
     * @param {string} local
     * @returns {Promise<{ [code_text: string]: string }>
     */
    public static async get_all_flat_locale_translations(local?: string): Promise<{ [code_text: string]: string }> {
        const self = TranslationManager.getInstance();

        if (!local) {
            local = LocaleManager.getInstance().getDefaultLocale();
        }

        if (self.ALL_FLAT_LOCALE_TRANSLATIONS[local]) {
            return self.ALL_FLAT_LOCALE_TRANSLATIONS[local];
        }

        const translations: { [code_text: string]: string } = await ModuleTranslation.getInstance().getALL_FLAT_LOCALE_TRANSLATIONS(
            local
        );

        self.ALL_FLAT_LOCALE_TRANSLATIONS[local] = translations;

        return translations;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): TranslationManager {
        if (!TranslationManager.instance) {
            TranslationManager.instance = new TranslationManager();
        }

        return TranslationManager.instance;
    }

    private static instance: TranslationManager = null;

    public ALL_FLAT_LOCALE_TRANSLATIONS: { [local: string]: { [code_text: string]: string } } = {};

    private constructor() {
    }

}
import DefaultTranslationVO from '../modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../modules/Translation/vos/LangVO';
import TranslatableTextVO from '../modules/Translation/vos/TranslatableTextVO';

export default class LocaleManager {

    public static ALL_FLAT_LOCALE_TRANSLATIONS: { [code_text: string]: string } = null;

    public static i18n: any = null;

    public static vue_instance_ref = null;
    public static sync_with_translation_store: boolean = true;
    public static ajax_cache_client_controller = null;
    public static getALL_FLAT_LOCALE_TRANSLATIONS: (code_lang: string) => Promise<{ [code_text: string]: string }> = null;
    private static defaultLocale: string;

    private constructor() {
    }

    public static set_translation(code_text: string, value: string, synced: boolean = false) {
        LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS[code_text] = value;

        if ((!LocaleManager.sync_with_translation_store) || (!LocaleManager.vue_instance_ref) || synced) {
            // Si le store n'est pas initialisé ou déjà synchronisé, on ne fait rien
            return;
        }

        LocaleManager.vue_instance_ref.$store.dispatch("TranslatableTextStore/set_flat_locale_translation", {
            code_text: code_text,
            value: value
        });
    }

    /**
     * get_all_flat_locale_translations
     * - Get all translations for a specific locale
     *
     * @param {string} local
     * @returns {Promise<{ [code_text: string]: string }>
     */
    public static async get_all_flat_locale_translations(/*local?: string*/ force_reload?: boolean): Promise<{ [code_text: string]: string }> {

        if ((!force_reload) && LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS) {
            return LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS;
        }

        if (!!LocaleManager.ajax_cache_client_controller) {
            LocaleManager.ajax_cache_client_controller.invalidateCachesFromApiTypesInvolved([LangVO.API_TYPE_ID, TranslatableTextVO.API_TYPE_ID, TranslatableTextVO.API_TYPE_ID]);
        }

        const translations: { [code_text: string]: string } = await LocaleManager.getALL_FLAT_LOCALE_TRANSLATIONS(LocaleManager.getDefaultLocale());
        LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS = translations;

        if ((!LocaleManager.sync_with_translation_store) || (!LocaleManager.vue_instance_ref)) {
            // Si le store n'est pas initialisé, on ne fait rien
            // TODO FIXME : est-ce qu'on doit pas event listener un init du vue_instance_ref/store ? pour init le store ?
            return;
        }

        LocaleManager.vue_instance_ref.$store.dispatch("TranslatableTextStore/set_flat_locale_translations", translations);

        return translations;
    }

    public static label(txt: string, params = {}): string {
        const res = LocaleManager.t(
            txt + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION,
            params
        );

        return (res != null) ? res.toString() : null;
    }

    public static t(txt: string, params = {}): string {
        if (!txt) {
            return txt;
        }

        // Vérification si le store est initialisé
        if (LocaleManager.sync_with_translation_store) {
            const translation = LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS[txt];

            // Si la traduction existe dans le store
            if (translation) {
                return translation.replace(/{{(\w+)}}/g, (_, key) => params[key] ?? `{{${key}}}`);
            }

            // Si store est initialisé mais pas de traduction
            return null;
        }

        // Si le store n'est pas initialisé, utilisation de i18n
        if (LocaleManager.i18n && LocaleManager.i18n.t && (LocaleManager.i18n.t != this.t)) {
            const res = LocaleManager.i18n.t(txt, params);
            return res != null ? res.toString() : null;
        }

        return txt;
    }

    public static setDefaultLocale(defaultLocale: string) {
        LocaleManager.defaultLocale = defaultLocale;
    }

    public static getDefaultLocale() {
        return LocaleManager.defaultLocale;
    }
}
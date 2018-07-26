import VueI18n from 'vue-i18n';

export default class LocaleManager {

    public static getInstance() {
        if (!LocaleManager.instance) {
            LocaleManager.instance = new LocaleManager();
        }

        return LocaleManager.instance;
    }

    private static instance: LocaleManager = null;

    public i18n: VueI18n;
    private defaultLocale: string;

    private constructor() {
    }

    public setDefaultLocale(defaultLocale: string) {
        this.defaultLocale = defaultLocale;
    }

    public getDefaultLocale() {
        return this.defaultLocale;
    }


}
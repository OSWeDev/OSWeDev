export default class LocaleManager {

    public static getInstance() {
        if (!LocaleManager.instance) {
            LocaleManager.instance = new LocaleManager();
        }

        return LocaleManager.instance;
    }

    private static instance: LocaleManager = null;

    public i18n: any;
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
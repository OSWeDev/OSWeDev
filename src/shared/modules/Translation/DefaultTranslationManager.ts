import DefaultTranslation from './vos/DefaultTranslation';

export default class DefaultTranslationManager {
    public static getInstance(): DefaultTranslationManager {
        if (!DefaultTranslationManager.instance) {
            DefaultTranslationManager.instance = new DefaultTranslationManager();
        }
        return DefaultTranslationManager.instance;
    }

    private static instance: DefaultTranslationManager;

    public registered_default_translations: DefaultTranslation[] = [];

    private constructor() { }

    public registerDefaultTranslation(defaultTranslation: DefaultTranslation) {
        this.registered_default_translations.push(defaultTranslation);
    }
}
import DefaultTranslation from './vos/DefaultTranslation';

export default class DefaultTranslationManager {
    public static getInstance(): DefaultTranslationManager {
        if (!DefaultTranslationManager.instance) {
            DefaultTranslationManager.instance = new DefaultTranslationManager();
        }
        return DefaultTranslationManager.instance;
    }

    private static instance: DefaultTranslationManager;

    public registered_default_translations: { [code_text: string]: DefaultTranslation } = {};

    private constructor() { }

    public registerDefaultTranslation(defaultTranslation: DefaultTranslation) {
        if ((!defaultTranslation) || (!defaultTranslation.code_text)) {
            return null;
        }
        this.registered_default_translations[defaultTranslation.code_text] = defaultTranslation;
    }
}
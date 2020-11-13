import ObjectHandler from '../../tools/ObjectHandler';
import DefaultTranslation from './vos/DefaultTranslation';

export default class DefaultTranslationManager {
    public static getInstance(): DefaultTranslationManager {
        if (!DefaultTranslationManager.instance) {
            DefaultTranslationManager.instance = new DefaultTranslationManager();
        }
        return DefaultTranslationManager.instance;
    }

    private static instance: DefaultTranslationManager;

    /**
     * Local thread cache -----
     */
    public registered_default_translations: { [code_text: string]: DefaultTranslation } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    public registerDefaultTranslation(defaultTranslation: DefaultTranslation) {
        if ((!defaultTranslation) || (!defaultTranslation.code_text) ||
            (!ObjectHandler.getInstance().hasAtLeastOneAttribute(defaultTranslation.default_translations))) {
            return;
        }
        this.registered_default_translations[defaultTranslation.code_text] = defaultTranslation;
    }
}
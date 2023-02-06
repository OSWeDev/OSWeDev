import ObjectHandler from '../../tools/ObjectHandler';
import DefaultTranslation from './vos/DefaultTranslation';

export default class DefaultTranslationManager {
    /**
     * Local thread cache -----
     */
    public static registered_default_translations: { [code_text: string]: DefaultTranslation } = {};
    /**
     * ----- Local thread cache
     */

    public static registerDefaultTranslation(defaultTranslation: DefaultTranslation) {
        if ((!defaultTranslation) || (!defaultTranslation.code_text) ||
            (!ObjectHandler.getInstance().hasAtLeastOneAttribute(defaultTranslation.default_translations))) {
            return;
        }
        DefaultTranslationManager.registered_default_translations[defaultTranslation.code_text] = defaultTranslation;
    }
}
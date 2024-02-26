import ObjectHandler from '../../tools/ObjectHandler';
import DefaultTranslationVO from './vos/DefaultTranslationVO';

export default class DefaultTranslationManager {
    /**
     * Local thread cache -----
     */
    public static registered_default_translations: { [code_text: string]: DefaultTranslationVO } = {};
    /**
     * ----- Local thread cache
     */

    public static registerDefaultTranslation(defaultTranslation: DefaultTranslationVO) {
        if ((!defaultTranslation) || (!defaultTranslation.code_text) ||
            (!ObjectHandler.hasAtLeastOneAttribute(defaultTranslation.default_translations))) {
            return;
        }
        DefaultTranslationManager.registered_default_translations[defaultTranslation.code_text] = defaultTranslation;
    }
}
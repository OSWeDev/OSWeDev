import OnPageTranslationItem from "./vos/OnPageTranslationItem";

export default class OnPageTranslationController {
    public static getInstance(): OnPageTranslationController {
        if (!OnPageTranslationController.instance) {
            OnPageTranslationController.instance = new OnPageTranslationController();
        }
        return OnPageTranslationController.instance;
    }

    private static instance: OnPageTranslationController = null;

    public page_translations: { [translation_code: string]: OnPageTranslationItem } = {};

    private constructor() { }

    public registerPageTranslation(translation_code: string, missing: boolean = true) {
        if (this.page_translations[translation_code]) {

            // Si on a déjà le code, mais qu'on a en info missing, cette info doit être prioritaire
            if (missing) {
                this.page_translations[translation_code].missing = true;
            }
            return;
        }

        this.page_translations[translation_code] = new OnPageTranslationItem(translation_code, missing);
    }

    public clear() {
        this.page_translations = {};
    }
}
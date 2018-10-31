import OnPageTranslationItem from "./vos/OnPageTranslationItem";

export default class OnPageTranslationController {
    public static getInstance() {
        if (!OnPageTranslationController.instance) {
            OnPageTranslationController.instance = new OnPageTranslationController();
        }
        return OnPageTranslationController.getInstance;
    }

    private static instance: OnPageTranslationController = null;

    public page_translations: { [translation_code: string]: OnPageTranslationItem } = {};

    private constructor() { }

    public registerPageTranslation(translation_code: string, missing: boolean = true) {
        if (this.page_translations[translation_code]) {
            return;
        }

        this.page_translations[translation_code] = new OnPageTranslationItem(translation_code, missing);
    }
}
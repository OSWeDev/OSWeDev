
export default class TranslationsServerController {

    // istanbul ignore next: nothing to test
    public static getInstance(): TranslationsServerController {
        if (!TranslationsServerController.instance) {
            TranslationsServerController.instance = new TranslationsServerController();
        }
        return TranslationsServerController.instance;
    }
    private static instance: TranslationsServerController = null;
    private constructor() { }

    public addCodeToLocales(ALL_LOCALES: { [code_lang: string]: any }, code_lang: string, code_text: string, translated: string): { [code_lang: string]: any } {

        if (!ALL_LOCALES) {
            ALL_LOCALES = {};
        }

        if ((!code_lang) || (!code_text)) {
            return ALL_LOCALES;
        }

        if (!translated) {
            translated = "";
        }

        const tmp_code_text_segs: string[] = code_text.split('.');
        const code_text_segs: string[] = [];

        for (const i in tmp_code_text_segs) {
            if (tmp_code_text_segs[i] && (tmp_code_text_segs[i] != "")) {
                code_text_segs.push(tmp_code_text_segs[i]);
            }
        }

        if (!ALL_LOCALES[code_lang]) {
            ALL_LOCALES[code_lang] = {};
        }

        let locale_pointer = ALL_LOCALES[code_lang];
        for (const i in code_text_segs) {
            const code_text_seg = code_text_segs[i];

            if (parseInt(i.toString()) == (code_text_segs.length - 1)) {

                locale_pointer[code_text_seg] = translated;
                break;
            }

            if (!locale_pointer[code_text_seg]) {
                locale_pointer[code_text_seg] = {};
            }

            locale_pointer = locale_pointer[code_text_seg];
        }

        return ALL_LOCALES;
    }

    public addCodeToFlatLocales(ALL_FLAT_LOCALES: { [code_lang: string]: { [code_text: string]: string } }, code_lang: string, code_text: string, translated: string): { [code_lang: string]: { [code_text: string]: string } } {

        if (!ALL_FLAT_LOCALES) {
            ALL_FLAT_LOCALES = {};
        }

        if ((!code_lang) || (!code_text)) {
            return ALL_FLAT_LOCALES;
        }

        if (!translated) {
            translated = "";
        }

        if (!ALL_FLAT_LOCALES[code_lang]) {
            ALL_FLAT_LOCALES[code_lang] = {};
        }

        ALL_FLAT_LOCALES[code_lang][code_text] = translated;
        return ALL_FLAT_LOCALES;
    }
}
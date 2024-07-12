
export default class DefaultTranslationVO {
    public static API_TYPE_ID: string = "default_translation";

    public static DEFAULT_LANG_DEFAULT_TRANSLATION: string = 'fr-fr';
    public static DEFAULT_LABEL_EXTENSION: string = ".___LABEL___";

    /**
     * @param default_translations
     * @param code_text Probablement rempli directement par la fonction qui demande cet objet. Par exemple les Modules fields écrasent cette valeur.
     */
    public static create_new(
        default_translations: { [code_lang: string]: string },
        code_text: string = null) {
        const res = new DefaultTranslationVO();

        res.default_translations = default_translations;
        res.code_text = code_text;

        return res;
    }

    public id: number;
    public _type: string = DefaultTranslationVO.API_TYPE_ID;

    public default_translations: { [code_lang: string]: string };
    public code_text: string;
}
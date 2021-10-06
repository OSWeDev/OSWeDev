
export default class DefaultTranslation {

    public static DEFAULT_LANG_DEFAULT_TRANSLATION: string = 'fr-fr';
    public static DEFAULT_LABEL_EXTENSION: string = ".___LABEL___";

    /**
     * @param default_translations
     * @param code_text Probablement rempli directement par la fonction qui demande cet objet. Par exemple les Modules fields écrasent cette valeur.
     */
    public constructor(
        public default_translations: { [code_lang: string]: string },
        public code_text: string = null) {
    }
}
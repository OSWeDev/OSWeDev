export default class DefaultTranslation {

    public static DEFAULT_LANG_DEFAULT_TRANSLATION: string = "fr";

    /**
     * 
     * @param default_translations 
     * @param code_text Probablement rempli directement par la fonction qui demande cet objet. Par exemple les Modules fields écrasent cette valeur.
     */
    public constructor(
        public default_translations: { [code_lang: string]: string },
        public code_text: string = null) {
    }
}
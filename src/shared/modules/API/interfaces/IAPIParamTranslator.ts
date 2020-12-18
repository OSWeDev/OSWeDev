/**
 * L'ajout de constructor dans l'interface permet juste d'éviter de mettre un champ inutile obligatoire...
 */
export default interface IAPIParamTranslator<T> {
    translateToURL?: () => string;
    constructor;
}

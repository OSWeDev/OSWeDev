export default interface IAPIParamTranslator<T> {
    translateToURL?: () => string;
    getAPIParams: () => any[];
}

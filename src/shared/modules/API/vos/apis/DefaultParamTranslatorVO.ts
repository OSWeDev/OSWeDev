import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

/**
 * Proposé par GPT pour généraliser la traduction des paramètres des API
 */
export default class DefaultParamTranslatorVO<P extends unknown[]> implements IAPIParamTranslator<DefaultParamTranslatorVO<P>> {
    public params: P;

    public constructor(...params: P) {
        this.params = params;
    }


    public static fromParams<T extends unknown[]>(...params: T): DefaultParamTranslatorVO<T> {
        return new DefaultParamTranslatorVO<T>(...params);
    }

    public static getAPIParams<T extends unknown[]>(param: DefaultParamTranslatorVO<T>): T {
        return param.params;
    }
}

export const DefaultParamTranslatorVOStatic: IAPIParamTranslatorStatic<DefaultParamTranslatorVO<unknown[]>> =
    DefaultParamTranslatorVO as IAPIParamTranslatorStatic<DefaultParamTranslatorVO<unknown[]>>;

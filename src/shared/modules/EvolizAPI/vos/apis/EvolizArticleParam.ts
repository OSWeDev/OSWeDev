import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizArticleVO from "../articles/EvolizArticleVO";

export default class EvolizArticleParam implements IAPIParamTranslator<EvolizArticleParam> {

    public static fromParams(article: EvolizArticleVO): EvolizArticleParam {
        return new EvolizArticleParam(article);
    }

    public static getAPIParams(param: EvolizArticleParam): any[] {
        return [param.article];
    }

    public constructor(
        public article: EvolizArticleVO
    ) { }
}

export const EvolizArticleParamStatic: IAPIParamTranslatorStatic<EvolizArticleParam> = EvolizArticleParam;
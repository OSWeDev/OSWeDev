import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class BuildSelectQueryParamVO implements IAPIParamTranslator<BuildSelectQueryParamVO> {

    public static fromParams(
        context_query: ContextQueryVO
    ): BuildSelectQueryParamVO {

        return new BuildSelectQueryParamVO(
            context_query
        );
    }

    public static getAPIParams(param: BuildSelectQueryParamVO): any[] {
        return [
            param.context_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO
    ) {
    }
}

export const BuildSelectQueryParamVOStatic: IAPIParamTranslatorStatic<BuildSelectQueryParamVO> = BuildSelectQueryParamVO;
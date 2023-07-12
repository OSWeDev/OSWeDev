/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class SelectVosParamVO implements IAPIParamTranslator<SelectVosParamVO> {

    public static fromParams(
        context_query: ContextQueryVO
    ): SelectVosParamVO {

        return new SelectVosParamVO(
            context_query
        );
    }

    public static getAPIParams(param: SelectVosParamVO): any[] {
        return [
            param.context_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO
    ) {
    }
}

export const SelectVosParamVOStatic: IAPIParamTranslatorStatic<SelectVosParamVO> = SelectVosParamVO;
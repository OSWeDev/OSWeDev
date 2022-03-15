import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class SelectFilterVisibleOptionsParamVO implements IAPIParamTranslator<SelectFilterVisibleOptionsParamVO> {

    public static fromParams(
        context_query: ContextQueryVO,
        actual_query: string): SelectFilterVisibleOptionsParamVO {

        return new SelectFilterVisibleOptionsParamVO(context_query, actual_query);
    }

    public static getAPIParams(param: SelectFilterVisibleOptionsParamVO): any[] {
        return [
            param.context_query,
            param.actual_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO,
        public actual_query: string) {
    }
}

export const SelectFilterVisibleOptionsParamVOStatic: IAPIParamTranslatorStatic<SelectFilterVisibleOptionsParamVO> = SelectFilterVisibleOptionsParamVO;
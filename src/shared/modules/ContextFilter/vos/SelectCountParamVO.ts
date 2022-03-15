import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class SelectCountParamVO implements IAPIParamTranslator<SelectCountParamVO> {

    public static fromParams(
        context_query: ContextQueryVO): SelectCountParamVO {

        return new SelectCountParamVO(context_query);
    }

    public static getAPIParams(param: SelectCountParamVO): any[] {
        return [
            param.context_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO) {
    }
}

export const SelectCountParamVOStatic: IAPIParamTranslatorStatic<SelectCountParamVO> = SelectCountParamVO;
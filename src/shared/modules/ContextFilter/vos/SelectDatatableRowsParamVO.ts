import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class SelectDatatableRowsParamVO implements IAPIParamTranslator<SelectDatatableRowsParamVO> {

    public static fromParams(
        context_query: ContextQueryVO
    ): SelectDatatableRowsParamVO {

        return new SelectDatatableRowsParamVO(context_query);
    }

    public static getAPIParams(param: SelectDatatableRowsParamVO): any[] {
        return [
            param.context_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO
    ) { }
}

export const SelectDatatableRowsParamVOStatic: IAPIParamTranslatorStatic<SelectDatatableRowsParamVO> = SelectDatatableRowsParamVO;
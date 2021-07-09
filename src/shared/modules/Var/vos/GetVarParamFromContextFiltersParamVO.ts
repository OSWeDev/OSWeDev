import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

export default class GetVarParamFromContextFiltersParamVO implements IAPIParamTranslator<GetVarParamFromContextFiltersParamVO> {

    public static fromParams(
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): GetVarParamFromContextFiltersParamVO {

        return new GetVarParamFromContextFiltersParamVO(var_name, get_active_field_filters);
    }

    public static getAPIParams(param: GetVarParamFromContextFiltersParamVO): any[] {
        return [
            param.var_name,
            param.get_active_field_filters
        ];
    }

    public constructor(
        public var_name: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
    ) {
    }
}

export const GetVarParamFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetVarParamFromContextFiltersParamVO> = GetVarParamFromContextFiltersParamVO;
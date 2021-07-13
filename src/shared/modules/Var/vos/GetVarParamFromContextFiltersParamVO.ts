import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

export default class GetVarParamFromContextFiltersParamVO implements IAPIParamTranslator<GetVarParamFromContextFiltersParamVO> {

    public static fromParams(
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]): GetVarParamFromContextFiltersParamVO {

        return new GetVarParamFromContextFiltersParamVO(var_name, get_active_field_filters, active_api_type_ids);
    }

    public static getAPIParams(param: GetVarParamFromContextFiltersParamVO): any[] {
        return [
            param.var_name,
            param.get_active_field_filters,
            param.active_api_type_ids
        ];
    }

    public constructor(
        public var_name: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[]
    ) {
    }
}

export const GetVarParamFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetVarParamFromContextFiltersParamVO> = GetVarParamFromContextFiltersParamVO;
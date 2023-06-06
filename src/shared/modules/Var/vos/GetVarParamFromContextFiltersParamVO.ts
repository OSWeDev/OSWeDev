import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import FieldFiltersVO from "../../DashboardBuilder/vos/FieldFiltersVO";

export default class GetVarParamFromContextFiltersParamVO implements IAPIParamTranslator<GetVarParamFromContextFiltersParamVO> {

    public static fromParams(
        var_name: string,
        get_active_field_filters: FieldFiltersVO,
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        accept_max_ranges: boolean): GetVarParamFromContextFiltersParamVO {

        return new GetVarParamFromContextFiltersParamVO(var_name, get_active_field_filters, custom_filters, active_api_type_ids, discarded_field_paths, accept_max_ranges);
    }

    public static getAPIParams(param: GetVarParamFromContextFiltersParamVO): any[] {
        return [
            param.var_name,
            param.get_active_field_filters,
            param.custom_filters,
            param.active_api_type_ids,
            param.discarded_field_paths,
            param.accept_max_ranges
        ];
    }

    public constructor(
        public var_name: string,
        public get_active_field_filters: FieldFiltersVO,
        public custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        public active_api_type_ids: string[],
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        public accept_max_ranges: boolean = false
    ) {
    }
}

export const GetVarParamFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetVarParamFromContextFiltersParamVO> = GetVarParamFromContextFiltersParamVO;
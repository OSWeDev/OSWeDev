import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";

export default class GetDatatableRowsCountFromContextFiltersParamVO implements IAPIParamTranslator<GetDatatableRowsCountFromContextFiltersParamVO> {

    public static fromParams(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]): GetDatatableRowsCountFromContextFiltersParamVO {

        return new GetDatatableRowsCountFromContextFiltersParamVO(api_type_ids, field_ids, get_active_field_filters, active_api_type_ids);
    }

    public static getAPIParams(param: GetDatatableRowsCountFromContextFiltersParamVO): any[] {
        return [
            param.api_type_ids,
            param.field_ids,
            param.get_active_field_filters,
            param.active_api_type_ids,
        ];
    }

    public constructor(
        public api_type_ids: string[],
        public field_ids: string[],
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[]) {
    }
}

export const GetDatatableRowsCountFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetDatatableRowsCountFromContextFiltersParamVO> = GetDatatableRowsCountFromContextFiltersParamVO;
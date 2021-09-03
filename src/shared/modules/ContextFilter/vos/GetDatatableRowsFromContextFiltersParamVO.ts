import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";
import SortByVO from "./SortByVO";

export default class GetDatatableRowsFromContextFiltersParamVO implements IAPIParamTranslator<GetDatatableRowsFromContextFiltersParamVO> {

    public static fromParams(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases: string[]): GetDatatableRowsFromContextFiltersParamVO {

        return new GetDatatableRowsFromContextFiltersParamVO(api_type_ids, field_ids, get_active_field_filters, active_api_type_ids, limit, offset, sort_by, res_field_aliases);
    }

    public static getAPIParams(param: GetDatatableRowsFromContextFiltersParamVO): any[] {
        return [
            param.api_type_ids,
            param.field_ids,
            param.get_active_field_filters,
            param.active_api_type_ids,
            param.limit,
            param.offset,
            param.sort_by,
            param.res_field_aliases
        ];
    }

    public constructor(
        public api_type_ids: string[],
        public field_ids: string[],
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[],
        public limit: number,
        public offset: number,
        public sort_by: SortByVO,
        public res_field_aliases: string[]) {
    }
}

export const GetDatatableRowsFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetDatatableRowsFromContextFiltersParamVO> = GetDatatableRowsFromContextFiltersParamVO;
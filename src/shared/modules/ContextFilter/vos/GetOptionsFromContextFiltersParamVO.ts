import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";

export default class GetOptionsFromContextFiltersParamVO implements IAPIParamTranslator<GetOptionsFromContextFiltersParamVO> {

    public static fromParams(
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        actual_query: string,
        limit: number,
        offset: number): GetOptionsFromContextFiltersParamVO {

        return new GetOptionsFromContextFiltersParamVO(api_type_id, field_id, get_active_field_filters, actual_query, limit, offset);
    }

    public static getAPIParams(param: GetOptionsFromContextFiltersParamVO): any[] {
        return [
            param.api_type_id,
            param.field_id,
            param.get_active_field_filters,
            param.actual_query,
            param.limit,
            param.offset
        ];
    }

    public constructor(
        public api_type_id: string,
        public field_id: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public actual_query: string,
        public limit: number,
        public offset: number) {
    }
}

export const GetOptionsFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetOptionsFromContextFiltersParamVO> = GetOptionsFromContextFiltersParamVO;
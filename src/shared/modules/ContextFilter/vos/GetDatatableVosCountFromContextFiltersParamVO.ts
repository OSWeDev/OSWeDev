import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";

export default class GetDatatableVosCountFromContextFiltersParamVO implements IAPIParamTranslator<GetDatatableVosCountFromContextFiltersParamVO> {

    public static fromParams(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]): GetDatatableVosCountFromContextFiltersParamVO {

        return new GetDatatableVosCountFromContextFiltersParamVO(api_type_id, get_active_field_filters, active_api_type_ids);
    }

    public static getAPIParams(param: GetDatatableVosCountFromContextFiltersParamVO): any[] {
        return [
            param.api_type_id,
            param.get_active_field_filters,
            param.active_api_type_ids,
        ];
    }

    public constructor(
        public api_type_id: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[]) {
    }
}

export const GetDatatableVosCountFromContextFiltersParamVOStatic: IAPIParamTranslatorStatic<GetDatatableVosCountFromContextFiltersParamVO> = GetDatatableVosCountFromContextFiltersParamVO;
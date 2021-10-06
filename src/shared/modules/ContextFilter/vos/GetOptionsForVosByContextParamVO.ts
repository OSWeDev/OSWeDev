import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";
import SortByVO from "./SortByVO";

export default class GetOptionsForVosByContextParamVO implements IAPIParamTranslator<GetOptionsForVosByContextParamVO> {

    public static fromParams(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO
    ): GetOptionsForVosByContextParamVO {

        return new GetOptionsForVosByContextParamVO(
            api_type_id,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            sort_by
        );
    }

    public static getAPIParams(param: GetOptionsForVosByContextParamVO): any[] {
        return [
            param.api_type_id,
            param.get_active_field_filters,
            param.active_api_type_ids,
            param.limit,
            param.offset,
            param.sort_by
        ];
    }

    public constructor(
        public api_type_id: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[],
        public limit: number,
        public offset: number,
        public sort_by: SortByVO,
    ) {
    }
}

export const GetOptionsForVosByContextParamVOStatic: IAPIParamTranslatorStatic<GetOptionsForVosByContextParamVO> = GetOptionsForVosByContextParamVO;
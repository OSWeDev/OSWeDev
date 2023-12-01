/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class QueryVOFromUniqueFieldContextFiltersParamVO implements IAPIParamTranslator<QueryVOFromUniqueFieldContextFiltersParamVO> {

    public static fromParams(
        api_type_id: string,
        unique_field_id: string,
        unique_field_value: any
    ): QueryVOFromUniqueFieldContextFiltersParamVO {

        return new QueryVOFromUniqueFieldContextFiltersParamVO(api_type_id, unique_field_id, unique_field_value);
    }

    public static getAPIParams(param: QueryVOFromUniqueFieldContextFiltersParamVO): any[] {
        return [
            param.api_type_id,
            param.unique_field_id,
            param.unique_field_value
        ];
    }

    public constructor(
        public api_type_id: string,
        public unique_field_id: string,
        public unique_field_value: any) {
    }
}

export const QueryVOFromUniqueFieldContextFiltersParamVOStatic: IAPIParamTranslatorStatic<QueryVOFromUniqueFieldContextFiltersParamVO> = QueryVOFromUniqueFieldContextFiltersParamVO;
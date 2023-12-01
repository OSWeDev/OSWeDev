/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class GetParamParamAsBooleanVO implements IAPIParamTranslator<GetParamParamAsBooleanVO> {

    public static fromParams(param_name: string, default_if_undefined: boolean = null, max_cache_age_ms: number = null): GetParamParamAsBooleanVO {

        return new GetParamParamAsBooleanVO(param_name, default_if_undefined, max_cache_age_ms);
    }

    public static getAPIParams(param: GetParamParamAsBooleanVO): any[] {
        return [param.param_name, param.default_if_undefined, param.max_cache_age_ms];
    }

    public constructor(
        public param_name: string,
        public default_if_undefined: boolean = null,
        public max_cache_age_ms: number = null) {
    }
}

export const GetParamParamAsBooleanVOStatic: IAPIParamTranslatorStatic<GetParamParamAsBooleanVO> = GetParamParamAsBooleanVO;
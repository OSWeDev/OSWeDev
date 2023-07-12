/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class GetParamParamAsStringVO implements IAPIParamTranslator<GetParamParamAsStringVO> {

    public static fromParams(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null): GetParamParamAsStringVO {

        return new GetParamParamAsStringVO(param_name, default_if_undefined, max_cache_age_ms);
    }

    public static getAPIParams(param: GetParamParamAsStringVO): any[] {
        return [param.param_name, param.default_if_undefined, param.max_cache_age_ms];
    }

    public constructor(
        public param_name: string,
        public default_if_undefined: string = null,
        public max_cache_age_ms: number = null) {
    }
}

export const GetParamParamAsStringVOStatic: IAPIParamTranslatorStatic<GetParamParamAsStringVO> = GetParamParamAsStringVO;
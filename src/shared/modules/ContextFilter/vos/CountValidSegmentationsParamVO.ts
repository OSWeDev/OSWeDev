/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class CountValidSegmentationsParamVO implements IAPIParamTranslator<CountValidSegmentationsParamVO> {

    public static fromParams(
        api_type_id: string, context_query: ContextQueryVO, ignore_self_filter: boolean = true
    ): CountValidSegmentationsParamVO {

        return new CountValidSegmentationsParamVO(
            api_type_id,
            context_query,
            ignore_self_filter
        );
    }

    public static getAPIParams(param: CountValidSegmentationsParamVO): any[] {
        return [
            param.api_type_id,
            param.context_query,
            param.ignore_self_filter
        ];
    }

    public constructor(
        public api_type_id: string, public context_query: ContextQueryVO, public ignore_self_filter: boolean = true
    ) {
    }
}

export const CountValidSegmentationsParamVOStatic: IAPIParamTranslatorStatic<CountValidSegmentationsParamVO> = CountValidSegmentationsParamVO;
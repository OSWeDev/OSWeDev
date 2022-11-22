import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class CountValidSegmentationsParamVO implements IAPIParamTranslator<CountValidSegmentationsParamVO> {

    public static fromParams(
        api_type_id: string, context_query: ContextQueryVO
    ): CountValidSegmentationsParamVO {

        return new CountValidSegmentationsParamVO(
            api_type_id,
            context_query
        );
    }

    public static getAPIParams(param: CountValidSegmentationsParamVO): any[] {
        return [
            param.api_type_id,
            param.context_query
        ];
    }

    public constructor(
        public api_type_id: string, public context_query: ContextQueryVO
    ) {
    }
}

export const CountValidSegmentationsParamVOStatic: IAPIParamTranslatorStatic<CountValidSegmentationsParamVO> = CountValidSegmentationsParamVO;
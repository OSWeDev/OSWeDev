import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
export default class FetchLikesParamParam implements IAPIParamTranslator<FetchLikesParamParam> {

    public static fromParams(
        api_type_id: string,
        vo_ids: number[]
    ): FetchLikesParamParam {
        return new FetchLikesParamParam(
            api_type_id,
            vo_ids
        );
    }

    public static getAPIParams(param: FetchLikesParamParam): any[] {
        return [
            param.api_type_id,
            param.vo_ids,
        ];
    }

    public constructor(
        public api_type_id: string,
        public vo_ids: number[]
    ) { }
}

export const FetchLikesParamParamStatic: IAPIParamTranslatorStatic<FetchLikesParamParam> = FetchLikesParamParam;
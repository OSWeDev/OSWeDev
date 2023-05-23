import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class UpdateVosParamVO implements IAPIParamTranslator<UpdateVosParamVO> {

    public static fromParams(
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_id: string]: any }
    ): UpdateVosParamVO {

        return new UpdateVosParamVO(
            context_query, new_api_translated_values
        );
    }

    public static getAPIParams(param: UpdateVosParamVO): any[] {
        return [
            param.context_query,
            param.new_api_translated_values
        ];
    }

    public constructor(
        public context_query: ContextQueryVO,
        public new_api_translated_values: { [update_field_id: string]: any }
    ) {
    }
}

export const UpdateVosParamVOStatic: IAPIParamTranslatorStatic<UpdateVosParamVO> = UpdateVosParamVO;
import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class UpdateVosParamVO implements IAPIParamTranslator<UpdateVosParamVO> {

    public static fromParams(
        context_query: ContextQueryVO, update_field_id: string, new_api_translated_value: any
    ): UpdateVosParamVO {

        return new UpdateVosParamVO(
            context_query, update_field_id, new_api_translated_value
        );
    }

    public static getAPIParams(param: UpdateVosParamVO): any[] {
        return [
            param.context_query,
            param.update_field_id,
            param.new_api_translated_value
        ];
    }

    public constructor(
        public context_query: ContextQueryVO,
        public update_field_id: string,
        public new_api_translated_value: any
    ) {
    }
}

export const UpdateVosParamVOStatic: IAPIParamTranslatorStatic<UpdateVosParamVO> = UpdateVosParamVO;
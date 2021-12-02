import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextFilterVO from "./ContextFilterVO";

export default class GetOptionsForUpdateVosByContextParamVO implements IAPIParamTranslator<GetOptionsForUpdateVosByContextParamVO> {

    public static fromParams(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        update_field_id: string,
        new_api_translated_value: any
    ): GetOptionsForUpdateVosByContextParamVO {

        return new GetOptionsForUpdateVosByContextParamVO(
            api_type_id,
            get_active_field_filters,
            active_api_type_ids,
            update_field_id,
            new_api_translated_value
        );
    }

    public static getAPIParams(param: GetOptionsForUpdateVosByContextParamVO): any[] {
        return [
            param.api_type_id,
            param.get_active_field_filters,
            param.active_api_type_ids,
            param.update_field_id,
            param.new_api_translated_value
        ];
    }

    public constructor(
        public api_type_id: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public active_api_type_ids: string[],
        public update_field_id: string,
        public new_api_translated_value: any
    ) {
    }
}

export const GetOptionsForUpdateVosByContextParamVOStatic: IAPIParamTranslatorStatic<GetOptionsForUpdateVosByContextParamVO> = GetOptionsForUpdateVosByContextParamVO;
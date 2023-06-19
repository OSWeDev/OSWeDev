import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import IDistantVOBase from "../../IDistantVOBase";
import ContextQueryVO from "./ContextQueryVO";

export default class UpdateVosParamVO<T extends IDistantVOBase> implements IAPIParamTranslator<UpdateVosParamVO<T>> {

    public static fromParams<U extends IDistantVOBase>(
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_id: string]: any }
    ): UpdateVosParamVO<U> {

        return new UpdateVosParamVO(
            context_query, new_api_translated_values
        );
    }

    public static getAPIParams<U extends IDistantVOBase>(param: UpdateVosParamVO<U>): any[] {
        return [
            param.context_query,
            param.new_api_translated_values
        ];
    }

    public constructor(
        public context_query: ContextQueryVO,
        public new_api_translated_values: { [update_field_id in keyof T]?: any }
    ) {
    }
}

export const UpdateVosParamVOStatic: IAPIParamTranslatorStatic<UpdateVosParamVO<any>> = UpdateVosParamVO<any>;
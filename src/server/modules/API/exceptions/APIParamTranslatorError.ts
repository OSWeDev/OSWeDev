import APIDefinition from "../../../../shared/modules/API/vos/APIDefinition";

export default class APIParamTranslatorError extends Error {
    public static ERROR_TYPE: string = 'API_PARAM_TRANSLATOR_ERROR';
    public _type: string = APIParamTranslatorError.ERROR_TYPE;

    public constructor(e: Error | string, api: APIDefinition<any, any>, uid: number) {
        super(APIParamTranslatorError.ERROR_TYPE + ':api_name:' + api.api_name + ':uid:' + uid + ':error:' + e);
    }
}
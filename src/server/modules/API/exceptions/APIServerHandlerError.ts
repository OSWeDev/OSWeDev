import APIDefinition from "../../../../shared/modules/API/vos/APIDefinition";

export default class APIServerHandlerError extends Error {
    public static ERROR_TYPE: string = 'API_SERVER_HANDLER_ERROR';
    public _type: string = APIServerHandlerError.ERROR_TYPE;

    public constructor(e: Error | string, api: APIDefinition<any, any>, uid: number) {
        super(APIServerHandlerError.ERROR_TYPE + ':api_name:' + api.api_name + ':uid:' + uid + ':error:' + e);
    }
}
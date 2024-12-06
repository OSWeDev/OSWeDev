import APIDefinition from "../../../../shared/modules/API/vos/APIDefinition";

export default class APIAccessDenied extends Error {
    public static ERROR_TYPE: string = 'API_ACCESS_DENIED';
    public _type: string = APIAccessDenied.ERROR_TYPE;

    public constructor(api: APIDefinition<any, any>, uid: number) {
        super(APIAccessDenied.ERROR_TYPE + ':api_name:' + api.api_name + ':uid:' + uid);
    }
}
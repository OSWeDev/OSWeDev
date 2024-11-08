import APIDefinition from "../../../../shared/modules/API/vos/APIDefinition";

export default class APIGunZipError extends Error {
    public static ERROR_TYPE: string = 'API_GUNZIP_ERROR';
    public _type: string = APIGunZipError.ERROR_TYPE;

    public constructor(e: Error | string, api: APIDefinition<any, any>, uid: number) {
        super(APIGunZipError.ERROR_TYPE + ':api_name:' + api.api_name + ':uid:' + uid + ':error:' + e);
    }
}
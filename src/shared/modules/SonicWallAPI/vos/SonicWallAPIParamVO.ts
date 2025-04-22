import IDistantVOBase from "../../IDistantVOBase";

export default class SonicWallAPIParamVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "sonicwall_api_param";

    public id: number;
    public _type: string = SonicWallAPIParamVO.API_TYPE_ID;

    public ip: string;
    public port: string;
    public username: string;
    public password: string;
}
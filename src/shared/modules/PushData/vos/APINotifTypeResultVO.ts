import IDistantVOBase from '../../IDistantVOBase';


export default class APINotifTypeResultVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "apintres";

    public static createNew(
        api_call_id: number,
        res: any): APINotifTypeResultVO {

        const resu: APINotifTypeResultVO = new APINotifTypeResultVO();

        resu.api_call_id = api_call_id;
        resu.res = res;

        return resu;
    }

    public id: number;
    public _type: string = APINotifTypeResultVO.API_TYPE_ID;

    public api_call_id: number;
    public res: any;
}
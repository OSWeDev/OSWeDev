import IDistantVOBase from '../../IDistantVOBase';

export default class OseliaThreadUserVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "oselia_thread_user";

    public id: number;
    public _type: string = OseliaThreadUserVO.API_TYPE_ID;

    public user_id: number;
    public thread_id: number;
    public role_id: number;
}
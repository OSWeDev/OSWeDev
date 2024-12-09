import IDistantVOBase from "../../IDistantVOBase";

export default class ExpressSessionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "express_session";

    public id: number;
    public _type: string = ExpressSessionVO.API_TYPE_ID;

    /**
     * The session implementing ISessionObject
     */
    public sess: string;

    /**
     * session.id, not the sid !
     */
    public session_id: string;
    public expire: number;
}
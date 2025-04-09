import IDistantVOBase from "../../IDistantVOBase";

export default class PwaClientSubscriptionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "pwa_client_subscription";

    public id: number;
    public _type: string = PwaClientSubscriptionVO.API_TYPE_ID;

    public user_id: number;
    public endpoint: string;
    public auth: string;
    public p256dh: string;

    public static createNew(
        user_id: number,
        endpoint: string,
        auth: string,
        p256dh: string
    ): PwaClientSubscriptionVO {
        const res: PwaClientSubscriptionVO = new PwaClientSubscriptionVO();

        res.user_id = user_id;
        res.endpoint = endpoint;
        res.auth = auth;
        res.p256dh = p256dh;

        return res;
    }
}
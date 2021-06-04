import IDistantVOBase from "../../IDistantVOBase";

export default class NFCTagUserVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "nfc_tag_user";

    public id: number;
    public _type: string = NFCTagUserVO.API_TYPE_ID;

    public nfc_tag_id: number;
    public user_id: number;
}
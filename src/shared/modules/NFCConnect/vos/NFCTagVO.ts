import INamedVO from "../../../interfaces/INamedVO";
import IDistantVOBase from "../../IDistantVOBase";

export default class NFCTagVO implements IDistantVOBase, INamedVO {
    public static API_TYPE_ID: string = "nfc_tag";

    public id: number;
    public _type: string = NFCTagVO.API_TYPE_ID;

    public name: string;
    public activated: boolean;
}
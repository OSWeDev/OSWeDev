export default class EvolizPayTypeVO {
    public static API_TYPE_ID: string = "evoliz_pay_type";

    public id: number;
    public _type: string = EvolizPayTypeVO.API_TYPE_ID;

    //Payment type identifier
    public paytypeid: number;
    //Payment type label
    public label: string;
}
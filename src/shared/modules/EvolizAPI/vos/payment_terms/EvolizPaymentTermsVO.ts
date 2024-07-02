export default class EvolizPaymentTermsVO {
    public static API_TYPE_ID: string = "evoliz_payment_terms";

    public id: number;
    public _type: string = EvolizPaymentTermsVO.API_TYPE_ID;

    //Payment term identifier
    public paytermid: number;
    //Payment term label
    public label: string;
}
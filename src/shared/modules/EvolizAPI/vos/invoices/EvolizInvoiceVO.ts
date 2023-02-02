export default class EvolizInvoiceVO {
    public static API_TYPE_ID: string = "evoliz_invoice";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = EvolizInvoiceVO.API_TYPE_ID;

}
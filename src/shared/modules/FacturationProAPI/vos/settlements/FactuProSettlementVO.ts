
export default class FactuProSettlementVO {
    public static API_TYPE_ID: string = "fp_settlement";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProSettlementVO.API_TYPE_ID;

    //Num facture
    public invoice_id: number;
    //Total : pourquoi texte dans l'api factupro ?
    public total: string;
    //Méthode paiement
    public payment_mode: number;
    //Date paiement
    public paid_on: Date;
    //Référence
    public payment_ref: string;
}
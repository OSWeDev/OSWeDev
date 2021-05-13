
export default class FactuProAssetVO {
    public static API_TYPE_ID: string = "fp_asset";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProAssetVO.API_TYPE_ID;

    //Num facture
    public invoice_id: number;
    //Nom fichier
    public document_name: string;
    //Taille fichier
    public document_size: number;
    //URL
    public download_url: string;
    //Titre
    public title: string;
}
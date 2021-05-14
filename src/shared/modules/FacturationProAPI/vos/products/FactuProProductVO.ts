
export default class FactuProProductVO {
    public static API_TYPE_ID: string = "fp_product";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProProductVO.API_TYPE_ID;

    // Référence interne
    public ref: string;
    // Libellé
    public title: string;
    // Prix unitaire HT
    public unit_price: number;
    // Taux de TVA
    public vat: number;
    // Unité de mesure
    public measure: string;
    // Type de facturation
    public nature: number;
    // Catégorie
    public category_id: number;
    // Notes internes
    public notes: string;
    // Créé le
    public created_at: Date;
    // Modifié le
    public updated_at: Date;
    // Enregistrement marqué comme à supprimer
    public soft_deleted: boolean;
    // Date définitive de la suppression
    public hard_delete_on: Date;
    // API - Référence numérique libre
    public api_id: number;
    // API - Texte libre
    public api_custom: string;
}
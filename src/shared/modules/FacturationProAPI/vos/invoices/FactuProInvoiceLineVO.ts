
export default class FactuProInvoiceLineVO {
    public static API_TYPE_ID: string = "fp_invoiceline";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProInvoiceLineVO.API_TYPE_ID;

    // Quantité
    public quantity: number;
    // Unité de mesure
    public measure: string;
    // Libellé
    public title: string;
    // Prix unitaire
    public unit_price: number;
    // Taux de TVA
    public vat: number;
    // Identifiant du produit
    public product_id: number;
    // Ligne n°
    public position: number;
    // Total HT
    public total: number;
    //En option
    // Ce champ n’est utilisé que pour les devis.Lorsque la valeur de ce champ est ‘true’, la ligne est considérée comme une option, elle n’est donc pas prise en compte dans le calcul du total, et toutes les lignes optionnelles sont regroupées en fin de devis dans un bloc spécifique.
    public optional: boolean;
    // Style de formattage
    // Par défaut(ie valeur vide), ce champ indique une ligne de facturation standard.La valeur ‘comment’ permet d’indiquer qu’il s’agit d’une ligne de commentaire, la valeur ‘title’ permet d’indiquer qu’il s’agit d’une ligne de titre(mise en gras automatiquement) et la valeur ‘new_page’ permet d’indiquer qu’il s’agit d’un saut de page.
    public style: string;
    // Type
    // la nature de la prestation n’est à préciser que pour les auto - entrepreneurs et les micro - entrepreneurs, afin de calculer correctement les cotisations sociales.
    public nature: number;

}
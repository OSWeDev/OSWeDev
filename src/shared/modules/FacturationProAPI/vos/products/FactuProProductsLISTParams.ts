
export default class FactuProProductsLISTParams {
    // numéro de page
    public page: string;
    // recherche exacte sur le champ api_id
    public api_id: string;
    // recherche partielle sur le champ api_custom
    public api_custom: string;
    // recherche partielle sur la référence produit
    public ref: string;
    // recherche partielle sur le libellé du produit
    public title: string;
}
export default class FactuProDevisLISTParams {
    //  numéro de page
    public page: string;
    //  recherche exacte sur le champ api_id
    public api_id: string;
    //  recherche partielle sur le champ api_custom
    public api_custom: string;
    //  recherche partielle sur le numéro de facture
    public quote_ref: string;
    //  recherche exacte sur le numéro de facture (incluant son eventuel prefixe)
    public full_quote_ref: string;
    //  afficher uniquement les factures d’un client spécifique
    public customer_id: string;
    //  recherche partielle sur le l’objet de la facture
    public title: string;
    //  recherche partielle sur le nom de société
    public company: string;
    //  recherche partielle sur le nom de famille
    public last_name: string;
    // recherche sur un statut de devis. Les valeurs possibles sont :
    // pending: En cours(devis non soldés en attente ou accepté)
    // to_invoice: A facturer(devis acceptés et non soldés)
    // invoiced: Soldé
    // 0: En attente
    // 1: Accepté
    // 9: Refusé
    public status: string;
    // recherche sur l’ID d’une catégorie spécifique (utiliser l’ID 0 pour retrouver les factures sans catégorie)
    public category_id: string;
    // recherche sur l’ID d’un suivi commercial spécifique
    public followup_id: string;
    // recherche par code d’imputation (abonnement Entreprise)
    public accounting_entry: string;
    // période de début ; Format YYYY-MM ou YYYY-MM-DD
    public period_start: string;
    // période de fin ; Format YYYY-MM ou YYYY-MM-DD
    public period_end: string;
    // asc: tri croissant
    // desc: tri décroissant
    public sort: string;
    // customer: tri par nom mnémotechnique de client
    // total: tri par montant total de facturation
    // billed: tri par date de facturation
    // created: tri par date de création d’une facture (ie date à laquelle l’enregistrement a été créé)
    // updated: tri par date de dernière modification d’une facture (ie date à laquelle l’enregistrement a été modifié pour la dernière fois)
    public order: string;
}
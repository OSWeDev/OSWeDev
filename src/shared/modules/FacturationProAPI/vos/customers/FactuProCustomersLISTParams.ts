
export default class FactuProCustomersLISTParams {
    // numéro de page
    public page: string;
    // recherche exacte sur le champ api_id
    public api_id: string;
    // recherche partielle sur le champ api_custom
    public api_custom: string;
    // recherche partielle sur le nom de société
    public company: string;
    // recherche partielle sur le nom de famille
    public last_name: string;
    // recherche partielle sur l’email
    public email: string;
    // recherche sur l’ID d’une catégorie spécifique(utiliser l’ID 0 pour retrouver les clients sans catégorie)
    public category_id: string;
    // par défaut, les données SEPA ne sont pas exportées.Seule la clé API de l’administrateur de la société permet d’exporter les données SEPA, et vous devez explicitement demander ces informations en utilisant la valeur 1.
    public with_sepa: string;
    // recherche sur une partie du code du compte client(abonnement Entreprise)
    public account_code: string;
    // recherche sur le code d’imputation par défaut(abonnement Entreprise)
    public accounting_entry: string;
    // en l’absence de précision, le système retourne uniquement les clients actifs.Vous pouvez utiliser les valeurs suivantes pour retourner différents groupes de clients:
    // all: retourne tous les clients(actifs ou archivés)
    // company: retourne uniquement les professionnels actifs
    // individual: retourne uniquement les particuliers actifs
    // archived: retourne uniquement les clients archivés
    public mode: string;
    // asc : tri croissant    desc: tri décroissant
    public sort: string;
    // type de tri
    public order: string;
    // tri par date de dernière facture au client
    public last_invoice: string;
    // tri par date de dernier paiement du client
    public last_paid: string;
    // tri par date de création
    public created: string;
    // tri par date de dernière modification
    public updated: string;
}
export default class FactuProCustomerVO {
    public static API_TYPE_ID: string = "fp_firm";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProCustomerVO.API_TYPE_ID;

    //Société
    public company_name: string;
    //Civilité
    public civility: string;
    //Prénom
    public first_name: string;
    //Nom
    public last_name: string;
    //Nom mnémotechnique
    public short_name: string;
    //Adresse de facturation
    public street: string;
    //Ville
    public city: string;
    //Code postal
    public zip_code: string;
    //Pays: Code ISO à 2 lettres du pays, en majuscules
    public country: string;
    //Téléphone
    public phone: string;
    //Fax
    public fax: string;
    //Email
    public email: string;
    //Mobile
    public mobile: string;
    //Site web
    public website: string;
    //Notes internes
    public notes: string;
    //N° TVA
    public vat_number: string;
    //Siret
    public siret: string;
    //Catégorie
    public category_id: number;
    //Compte client
    public account_code: string;
    //Compte d’imputation
    public accounting_entry: string;
    //Créé le
    public created_at: Date;
    //Modifié le
    public updated_at: Date;
    //IBAN: Lecture autorisée uniquement avec la clé API de l’administrateur de l’entreprise
    public sepa_iban: string;
    //BIC: Lecture autorisée uniquement avec la clé API de l’administrateur de l’entreprise
    public sepa_bic: string;
    //RUM: Lecture autorisée uniquement avec la clé API de l’administrateur de l’entreprise
    public sepa_rum: string;
    //Date de signature du mandat SEPA: Lecture autorisée uniquement avec la clé API de l’administrateur de l’entreprise
    public sepa_signature_on: Date;
    //API - Référence numérique libre
    public api_id: number;
    //API - Texte libre
    public api_custom: string;
    //Particulier
    public individual: boolean;
    //Référence client
    public reference: string;
    //Pénalités de retard
    public penalty: number;
    //Taux d’escompte
    public discount: number;
    //Délai de paiement
    public pay_before: string;
    //Durée de validité d’un devis
    public validity: number;
    //Dernière facture le
    public last_invoiced_on: Date;
    //Dernier règlement le
    public last_paid_on: Date;
    //Devise
    public currency: string;
    //Langue des PDF
    public language: string;
    //Taux de TVA
    public default_vat: number;
    //Code pays des taux TVA à appliquer
    public vat_country: string;
    //Motif d’exonération de TVA
    public vat_exemption: string;
    //Enregistrement marqué comme à supprimer
    public soft_deleted: boolean;
    //Date définitive de la suppression
    public hard_delete_on: Date;
}
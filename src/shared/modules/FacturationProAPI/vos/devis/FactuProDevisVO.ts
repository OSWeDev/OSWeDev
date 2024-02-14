import FactuProAssetVO from "../assets/FactuProAssetVO";
import FactuProInvoiceLineVO from "../invoices/FactuProInvoiceLineVO";
import FactuProInvoiceVO from "../invoices/FactuProInvoiceVO";

export default class FactuProDevisVO {
    public static API_TYPE_ID: string = "fp_devis";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProDevisVO.API_TYPE_ID;

    // Client
    public customer_id: number;
    // Nom de la société ou du client
    public customer_identity: string;
    // Objet
    public title: string;
    // Langue du PDF
    public language: string;
    // Catégorie
    public category_id: number;
    // Suivi commercial
    public followup_id: number;
    // Date facture
    public invoiced_on: Date;
    // Date d’échéance
    public term_on: Date;
    // Brouillon
    public draft: boolean;
    // Montant total HT
    public total: number;
    // Montant total TTC
    public total_with_vat: number;
    // Devise
    public currency: string;
    // Réduction globale
    public rebate_percentage: number;
    // Motif d’exonération de TVA
    public vat_exemption: string;
    // Code pays des taux TVA à appliquer
    public vat_country: string;
    // Intitulé de la taxe additionnelle sur le total HT
    public tax_title: string;
    // Pourcentage de la taxe additionnelle sur le total HT
    public tax_percent: number;
    // Pénalités de retard
    public penalty: number;
    // Délai de paiement
    public pay_before: string;
    // Taux d’escompte
    public discount: number;
    // Précompte des cotisations
    public precompte: boolean;
    // Nature de l’activité
    public activity_title: string;
    // Service à la personne
    public service_personne: boolean;
    // Compte d’imputation
    public accounting_entry: string;
    // Informations complémentaires
    public information: string;
    // Note interne
    public internal_note: string;
    // Bon de commande
    public purchase_number: string;
    // Créé le
    public created_at: Date;
    // Modifié le
    public updated_at: Date;
    // Géré par
    public user_id: number;
    // Url de téléchargement publique
    public public_download_url: string;
    // Lignes de facturation
    public items: FactuProInvoiceLineVO[];
    // Fichiers joints
    public files: FactuProAssetVO[];
    // API - Référence numérique libre
    public api_id: number;
    // API - Texte libre
    public api_custom: string;
    // Enregistrement marqué comme à supprimer
    public soft_deleted: boolean;
    // Date définitive de la suppression
    public hard_delete_on: Date;
    // Statut du devis
    public quote_status: number;
    // N° de devis
    public quote_ref: number;
    // Ne pas faire de suivi de facturation
    public ignore_quote: boolean;
    // Devis soldé ?
    public fully_invoiced: boolean;
    // Montant déjà facturé
    public amount_invoiced: number;
    // Tableau des IDs des factures associées à ce devis
    public invoice_ids: FactuProInvoiceVO[];
    // Livré / Réalisé le
    public delivery_on: Date;
    // Total TTC estimé en euro
    public estimated_total_in_main_currency: number;
}
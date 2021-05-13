import FactuProAssetVO from '../assets/FactuProAssetVO';
import FactuProSettlementVO from '../settlements/FactuProSettlementVO';
import FactuProInvoiceLineVO from './FactuProInvoiceLineVO';

export default class FactuProInvoiceVO {
    public static API_TYPE_ID: string = "fp_invoice";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProInvoiceVO.API_TYPE_ID;

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
    // Livré / Réalisé le
    public delivery_on: Date;
    // ID Devis associé
    public quote_id: number;
    // N° de facture
    public invoice_ref: string;
    // N° de facture externe
    public external_ref: string;
    // N° de facture intégral(incluant le prefixe)
    public full_invoice_ref: string;
    // Mode de règlement
    public payment_mode: number;
    // Payé le
    public paid_on: Date;
    // Référence du paiement
    public payment_ref: string;
    // Equivalent en euros
    public paid_in_main_currency: number;
    // Total TTC estimé en euro
    public estimated_total_in_main_currency: number;
    // Avoir sur la facture n°ID
    // Si la facture est un avoir généré via notre système automatisé, ce champ contient l’ID de la facture annulée
    public refund_id: number;
    // Url de paiement en ligne(option GOLD requise)
    public pay_url: string;
    // Montant restant dû
    public balance: number;
    // Facture externe
    public external: boolean;
    // Liste des règlements
    public settlements: FactuProSettlementVO[];
}
import IDistantVOBase from '../../../IDistantVOBase';

export default class CommandeVO implements IDistantVOBase {
    public static STATUT_LABELS: string[] = [
        'commande.statut_labels.panier.name',
        'commande.statut_labels.annule.name',
        'commande.statut_labels.en_attente.name',
        'commande.statut_labels.en_cours_de_traitement.name',
        'commande.statut_labels.tunnel_achat_validation_panier.name',
        'commande.statut_labels.tunnel_achat_verification.name',
        'commande.statut_labels.tunnel_achat_paiement.name',
        'commande.statut_labels.termine.name',
    ];
    public static STATUT_PANIER: number = 0;
    public static STATUT_ANNULE: number = 1;
    public static STATUT_EN_ATTENTE: number = 2;
    public static STATUT_EN_COURS_DE_TRAITEMENT: number = 3;
    public static STATUT_TUNNEL_ACHAT_VALIDATION_PANIER: number = 4;
    public static STATUT_TUNNEL_ACHAT_VERIFICATION: number = 5;
    public static STATUT_TUNNEL_ACHAT_PAIEMENT: number = 6;
    public static STATUT_TERMINE: number = 7;

    public static API_TYPE_ID: string = 'commerce_commande';

    public id: number;
    public _type: string = CommandeVO.API_TYPE_ID;
    public identifiant: string;
    public date: number;
    public statut: number;
    public client_id: number;
}
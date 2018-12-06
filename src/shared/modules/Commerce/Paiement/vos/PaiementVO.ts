import IDistantVOBase from '../../../IDistantVOBase';

export default class PaiementVO implements IDistantVOBase {
    public static STATUT_LABELS: string[] = [
        'paiement.statut_labels.erreur.name',
        'paiement.statut_labels.succes.name',
    ];
    public static STATUT_ERREUR: number = 0;
    public static STATUT_SUCCES: number = 1;

    public static API_TYPE_ID: string = 'commerce_paiement';

    public id: number;
    public _type: string = PaiementVO.API_TYPE_ID;
    public abonnement_id: number;
    public mode_paiement_id: number;
    public statut: number;
}
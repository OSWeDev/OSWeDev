import IDistantVOBase from '../../../IDistantVOBase';

export default class PaiementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "paiement";

    public id: number;
    public _type: string = PaiementVO.API_TYPE_ID;
    public abonnement_id: number;
    public mode_paiement_id: number;
    public statut: string;
}
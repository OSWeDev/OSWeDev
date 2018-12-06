import IDistantVOBase from '../../../IDistantVOBase';

export default class PackAbonnementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "pack_abonnement";

    public id: number;
    public _type: string = PackAbonnementVO.API_TYPE_ID;
    public ligne_commande_id: number;
    public abonnement_id: number;
}
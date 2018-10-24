import IDistantVOBase from '../../../IDistantVOBase';

export default class LigneCommandeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "commande_ligne";

    public id: number;
    public _type: string = LigneCommandeVO.API_TYPE_ID;
    public commande_id: number;
    public service_id: number;
    public prix_unitaire: number;
    public quantite: number;
}
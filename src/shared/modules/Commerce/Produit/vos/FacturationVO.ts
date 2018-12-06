import IDistantVOBase from '../../../IDistantVOBase';

export default class FacturationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "facturation";

    public id: number;
    public _type: string = FacturationVO.API_TYPE_ID;
    public titre: string;
    public frequence: number;
    public texte_affichage: string;
}
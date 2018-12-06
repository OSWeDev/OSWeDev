import IDistantVOBase from '../../../IDistantVOBase';

export default class FacturationProduitVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "facturation_produit";

    public id: number;
    public _type: string = FacturationProduitVO.API_TYPE_ID;
    public facturation_id: number;
    public produit_id: number;
    public par_defaut: boolean;
}
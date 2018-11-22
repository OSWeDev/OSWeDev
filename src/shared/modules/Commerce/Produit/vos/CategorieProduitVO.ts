import IDistantVOBase from '../../../IDistantVOBase';

export default class CategorieProduitVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "categorie_produit";

    public id: number;
    public _type: string = CategorieProduitVO.API_TYPE_ID;
    public titre: string;
}
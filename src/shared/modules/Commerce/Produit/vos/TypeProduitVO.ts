import IDistantVOBase from '../../../IDistantVOBase';

export default class TypeProduitVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "type_produit";

    public id: number;
    public _type: string = TypeProduitVO.API_TYPE_ID;
    public vo_type_produit: string;
    public vo_type_param: string;
    public categorie_produit_id: number;
}
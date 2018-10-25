import IDistantVOBase from '../../../IDistantVOBase';

export default class ProduitVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'commerce_produit';

    public id: number;
    public _type: string = ProduitVO.API_TYPE_ID;
    public titre: string;
    public actif: boolean;
    public prix: number;
    public tva: number;
    public categorie_produit_id: number;
}
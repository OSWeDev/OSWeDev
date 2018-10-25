import IDistantVOBase from '../../../IDistantVOBase';

export default class ServiceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'commerce_service';

    public id: number;
    public _type: string = ServiceVO.API_TYPE_ID;
    public produit_id: number;
    public informations_id: number;
}
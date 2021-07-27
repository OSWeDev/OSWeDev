import IDistantVOBase from '../../../IDistantVOBase';

export default class AbonnementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'commerce_abonnement';

    public id: number;
    public _type: string = AbonnementVO.API_TYPE_ID;
    public renouvellement: boolean;
    public echeance: number;
    public resiliation: number;
}
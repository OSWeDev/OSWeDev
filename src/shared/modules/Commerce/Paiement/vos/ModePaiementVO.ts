import IDistantVOBase from '../../../IDistantVOBase';

export default class ModePaiementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "mode_paiement";

    public id: number;
    public _type: string = ModePaiementVO.API_TYPE_ID;
    public mode: string;
}
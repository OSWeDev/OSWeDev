import IDistantVOBase from '../../../IDistantVOBase';

export default class CommandeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "commande";

    public id: number;
    public _type: string = CommandeVO.API_TYPE_ID;
    public date: string;
    public statut: string;
    public client_id: number;
}
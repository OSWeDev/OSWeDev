import IDistantVOBase from '../../../IDistantVOBase';

export default class ClientVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "client";

    public id: number;
    public _type: string = ClientVO.API_TYPE_ID;
    public id_client_facturationpro: string;
    public user_id: number;
    public informations_id: number;
}
import IDistantVOBase from '../../IDistantVOBase';

export default class AzureConnectedUserVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "azure_connected_user";

    public id: number;
    public _type: string = AzureConnectedUserVO.API_TYPE_ID;

    public user_id: number;

    public access_token: string;
    public refresh_token: string;

    public registered_callback_name: string;
    public connect_callback_redirect_url: string;
}
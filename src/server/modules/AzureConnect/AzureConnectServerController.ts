import AzureConnectedUserVO from '../../../shared/modules/AzureConnect/vos/AzureConnectedUserVO';

export default class AzureConnectServerController {

    public static registered_callbacks_by_name: { [name: string]: (azure_connected_user: AzureConnectedUserVO) => Promise<void> } = {};
}
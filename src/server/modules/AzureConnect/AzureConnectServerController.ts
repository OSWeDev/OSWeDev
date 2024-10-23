import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import AzureConnectedUserVO from '../../../shared/modules/AzureConnect/vos/AzureConnectedUserVO';

export default class AzureConnectServerController {

    public static registered_callbacks_by_name: { [name: string]: (azure_connected_user: AzureConnectedUserVO) => Promise<void> } = {};

    public static registered_azure_client_by_registration_name: { [registration_name: string]: Client } = {};

    public static register_azure_client(
        registration_name: string,
        tenantId: string,
        clientId: string,
        clientSecret: string,
    ): Client {

        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

        if (!AzureConnectServerController.registered_azure_client_by_registration_name[registration_name]) {
            AzureConnectServerController.registered_azure_client_by_registration_name[registration_name] = Client.init({
                authProvider: async (done) => {
                    try {
                        const token = await credential.getToken('https://graph.microsoft.com/.default');
                        done(null, token?.token);
                    } catch (err) {
                        done(err, null);
                    }
                }
            });
        }

        return AzureConnectServerController.registered_azure_client_by_registration_name[registration_name];
    }
}
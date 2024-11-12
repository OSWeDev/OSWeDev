import { Client } from "@microsoft/microsoft-graph-client";
import axios from "axios";
import qs from "qs";
import ModuleParams from "../../../shared/modules/Params/ModuleParams";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ParamsServerController from "../Params/ParamsServerController";

export default class AzureConnectServerController {

    // public static registered_callbacks_by_name: { [name: string]: (azure_connected_user: AzureConnectedUserVO) => Promise<void> } = {};

    /**
     * Pour éviter les réinits à l'infini, on limite à une init par minute
     */
    public static registered_azure_last_init_date_by_registration_name: { [registration_name: string]: number } = {};

    public static registered_azure_tenant_id_param_name_by_registration_name: { [registration_name: string]: string } = {};
    public static registered_azure_client_id_param_name_by_registration_name: { [registration_name: string]: string } = {};
    public static registered_azure_client_secret_param_name_by_registration_name: { [registration_name: string]: string } = {};

    private static registered_azure_client_by_registration_name: { [registration_name: string]: Client } = {};

    public static register_azure_client(
        registration_name: string,
        tenant_id_param_name: string,
        client_id_param_name: string,
        client_secret_param_name: string,
    ) {

        AzureConnectServerController.registered_azure_tenant_id_param_name_by_registration_name[registration_name] = tenant_id_param_name;
        AzureConnectServerController.registered_azure_client_id_param_name_by_registration_name[registration_name] = client_id_param_name;
        AzureConnectServerController.registered_azure_client_secret_param_name_by_registration_name[registration_name] = client_secret_param_name;

        if (AzureConnectServerController.registered_azure_client_by_registration_name[registration_name]) {
            delete AzureConnectServerController.registered_azure_client_by_registration_name[registration_name];
        }
    }

    public static async get_registered_azure_client(registration_name: string, force_reinit: boolean = false): Promise<Client> {

        if (AzureConnectServerController.registered_azure_last_init_date_by_registration_name[registration_name] && (Date.now() - AzureConnectServerController.registered_azure_last_init_date_by_registration_name[registration_name] < 60000)) {
            throw new Error('get_registered_azure_client: already initialized less than 1 minute ago for registration_name: ' + registration_name);
        }

        const client: Client = AzureConnectServerController.registered_azure_client_by_registration_name[registration_name];
        if ((!client) || force_reinit) {

            const tenant_id_param_name = AzureConnectServerController.registered_azure_tenant_id_param_name_by_registration_name[registration_name];
            const client_id_param_name = AzureConnectServerController.registered_azure_client_id_param_name_by_registration_name[registration_name];
            const client_secret_param_name = AzureConnectServerController.registered_azure_client_secret_param_name_by_registration_name[registration_name];

            if (!tenant_id_param_name || !client_id_param_name || !client_secret_param_name) {
                ConsoleHandler.error('get_registered_azure_client: no tenant_id_param_name or client_id_param_name or client_secret_param_name found for registration_name: ' + registration_name);
                return null;
            }

            const tenant_id = await ParamsServerController.getParamValueAsString(tenant_id_param_name);
            const client_id = await ParamsServerController.getParamValueAsString(client_id_param_name);
            const client_secret = await ParamsServerController.getParamValueAsString(client_secret_param_name);

            if (!tenant_id || !client_id || !client_secret) {
                ConsoleHandler.error('get_registered_azure_client: no tenant_id or client_id or client_secret found for registration_name: ' + registration_name);
                return null;
            }

            AzureConnectServerController.registered_azure_client_by_registration_name[registration_name] = Client.init({
                authProvider: async (done) => {
                    try {
                        const token = await this.get_access_token(client_id, client_secret, tenant_id, 'https://graph.microsoft.com/.default');
                        done(null, token);
                    } catch (err) {
                        done(err, null);
                    }
                }
            });
        }

        return AzureConnectServerController.registered_azure_client_by_registration_name[registration_name];
    }

    /**
     * FIXME : Tant qu'on n'arrive pas à utiliser @azure/identity, on passe par l'application az cli
     */
    public static async get_access_token(
        client_id: string,
        client_secret: string,
        tenant_id: string,
        resource: string = 'https://graph.microsoft.com.default',
    ): Promise<string> {

        const url = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`;
        const data = {
            client_id: client_id,
            scope: resource,
            client_secret: client_secret,
            grant_type: "client_credentials",
        };

        try {
            const response = await axios.post(url, qs.stringify(data), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            console.log("Access Token:", response.data.access_token);
            return response.data.access_token;
        } catch (error) {
            console.error("Erreur lors de l'obtention du token d'accès :", error.response ? error.response.data : error.message);
        }
    }

    // /**
    //  * FIXME : Tant qu'on n'arrive pas à utiliser @azure/identity, on passe par l'application az cli
    //  */
    // public static get_access_token(
    //     client_id: string,
    //     client_secret: string,
    //     tenant_id: string,
    //     resource: string = 'https://graph.microsoft.com',
    // ): string {

    //     try {

    //         // Exécuter az login
    //         execSync('az login --service-principal --username ' + client_id + ' --password ' + client_secret + ' --tenant ' + tenant_id + ' --allow-no-subscriptions', { stdio: 'inherit' });

    //         // Obtenir le token d'accès
    //         const tokenOutput = execSync('az account get-access-token --resource ' + resource + ' --query accessToken -o tsv');
    //         const accessToken = tokenOutput.toString().trim();

    //         return accessToken;
    //     } catch (error) {
    //         console.error('Erreur lors de l\'obtention du token d\'accès :', error);
    //     }

    //     return null;
    // }
}
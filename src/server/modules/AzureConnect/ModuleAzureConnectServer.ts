import { Client } from '@microsoft/microsoft-graph-client';
import { AuthorizationCode } from 'simple-oauth2';
import ModuleAzureConnect from '../../../shared/modules/AzureConnect/ModuleAzureConnect';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';
import AzureConnectServerController from './AzureConnectServerController';

export default class ModuleAzureConnectServer extends ModuleServerBase {

    private static instance: ModuleAzureConnectServer = null;
    private static interval: NodeJS.Timeout = null;

    private oauth2: AuthorizationCode = null;
    private client_id: string = null;
    private client_secret: string = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAzureConnect.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAzureConnectServer.instance) {
            ModuleAzureConnectServer.instance = new ModuleAzureConnectServer();
        }
        return ModuleAzureConnectServer.instance;
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        // APIControllerWrapper.registerServerApiHandler(ModuleAzureConnect.APINAME_azure_connect_callback, this.azure_connect_callback.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleAzureConnect.APINAME_azure_connect, this.azure_connect.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleAzureConnect.APINAME_azure_refresh_token, this.azure_refresh_token.bind(this));
    }

    public async azure_get_last_unread_email(
        thread_vo: GPTAssistantAPIThreadVO,
        registration_name: string,
        email: string,
        mark_as_read: boolean = false,
    ): Promise<Client> {

        try {

            const client = await AzureConnectServerController.get_registered_azure_client(registration_name);
            if (!client) {
                ConsoleHandler.error('get_emails: no client found for registration_name: ' + registration_name);
                return null;
            }

            const res = await client
                .api('/users/' + email + '/mailFolders/inbox/messages')
                .filter('isRead eq false') // Filtre les mails non lus
                .top(1)  // Limite à 1 mail
                .get();

            if (res && res.value && res.value.length && mark_as_read) {
                await client
                    .api('/users/' + email + '/messages/' + res.value[0].id)
                    .update({ isRead: true });
            }

            return res.value;
        } catch (error) {
            console.error(error);
        }
    }

    // // istanbul ignore next: cannot test configure
    // public async configure() {

    //     await all_promises([
    //         (async () => {
    //             ModuleParams.getInstance().getParamValueAsString(ModuleAzureConnect.AZURE_CONNECT_CLIENT_ID_PARAM_NAME, null, 180000).then((res) => {
    //                 this.client_id = res;
    //             });
    //         })(),
    //         (async () => {
    //             ModuleParams.getInstance().getParamValueAsString(ModuleAzureConnect.AZURE_CONNECT_CLIENT_SECRET_PARAM_NAME, null, 180000).then((res) => {
    //                 this.client_secret = res;
    //             });
    //         })(),
    //     ]);

    //     this.oauth2 = new AuthorizationCode({
    //         client: {
    //             id: this.client_id,
    //             secret: this.client_secret,
    //         },
    //         auth: {
    //             tokenHost: 'https://login.microsoftonline.com',
    //             authorizePath: `/common/oauth2/v2.0/authorize`,
    //             tokenPath: `/common/oauth2/v2.0/token`,
    //         },
    //         options: {
    //             authorizationMethod: 'body',
    //         },
    //     });

    // }

    // /**
    //  * Callback appelé par Azure après connexion
    //  * @param state L'id du holder des infos de connexion en bdd
    //  * @param code le code permettant de récupérer les tokens
    //  * @param req
    //  * @param res
    //  */
    // private async azure_connect_callback(state: string, code: string, req, res) {
    //     try {
    //         const result = await this.oauth2.getToken({
    //             code,
    //             redirect_uri: process.env.REDIRECT_URI,
    //             scope: 'openid offline_access Mail.Read',
    //         });
    //         const accessToken = result.token.access_token;
    //         const refreshToken = result.token.refresh_token;

    //         const holder: AzureConnectedUserVO = await query(AzureConnectedUserVO.API_TYPE_ID).filter_by_id(parseInt(state)).select_vo<AzureConnectedUserVO>();
    //         holder.access_token = accessToken;
    //         holder.refresh_token = refreshToken;

    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(holder);

    //         if (holder.registered_callback_name && AzureConnectServerController.registered_callbacks_by_name[holder.registered_callback_name]) {
    //             await AzureConnectServerController.registered_callbacks_by_name[holder.registered_callback_name](holder);
    //         }

    //         if (holder.connect_callback_redirect_url) {
    //             res.redirect(holder.connect_callback_redirect_url);
    //         }
    //     } catch (error) {
    //         res.status(500).send(error.message);
    //     }
    // }

    // /**
    //  * Démarrer le flux d'autorisation OAuth
    //  */
    // private async azure_connect(azure_connected_user: AzureConnectedUserVO, req, res) {

    //     if (!azure_connected_user) {
    //         ConsoleHandler.error('azure_connect: azure_connected_user is null');
    //         return;
    //     }

    //     const authorizationUri = this.oauth2.authorizeURL({
    //         redirect_uri: process.env.REDIRECT_URI,
    //         scope: 'openid offline_access Mail.Read',
    //         state: azure_connected_user.id,
    //     });
    //     res.redirect(authorizationUri);
    // }

    // private async azure_refresh_token(azure_connected_user: AzureConnectedUserVO, req, res) {

    //     if ((!azure_connected_user) || (!azure_connected_user.refresh_token)) {
    //         ConsoleHandler.error('azure_refresh_token: azure_connected_user is null or has no refresh_token');
    //         return;
    //     }

    //     try {

    //         const result = await this.oauth2.refreshToken({
    //             refresh_token: azure_connected_user.refresh_token,
    //         });
    //         const newAccessToken = result.token.access_token;
    //         const newRefreshToken = result.token.refresh_token;

    //         azure_connected_user.access_token = newAccessToken;
    //         azure_connected_user.refresh_token = newRefreshToken;

    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(azure_connected_user);
    //     } catch (error) {
    //         res.status(500).send(error.message);
    //     }
    // }
}
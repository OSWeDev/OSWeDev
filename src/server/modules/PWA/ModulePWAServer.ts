import webPush from 'web-push';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModulePWA from '../../../shared/modules/PWA/ModulePWA';
import PwaClientSubscriptionVO from '../../../shared/modules/PWA/vos/PwaClientSubscriptionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleServerBase from '../ModuleServerBase';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ConfigurationService from '../../env/ConfigurationService';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PwaNotification from '../../../shared/modules/PWA/vos/PwaNotification';

export default class ModulePWAServer extends ModuleServerBase {

    private static instance: ModulePWAServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModulePWA.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePWAServer {
        if (!ModulePWAServer.instance) {
            ModulePWAServer.instance = new ModulePWAServer();
        }
        return ModulePWAServer.instance;
    }

    public registerApis(): void {
        APIControllerWrapper.registerServerApiHandler(ModulePWA.APINAME_send_push_notif, this.send_push_notif.bind(this));
    }

    public async send_push_notif(
        user_id: number,
        message: string,
        url: string,
    ) {
        if (!user_id || !message) {
            return;
        }

        try {
            const publicKey = await ModuleParams.getInstance().getParamValueAsString(ModulePWA.PARAM_PWA_PUSH_PUBLIC_KEY);
            const privateKey = await ModuleParams.getInstance().getParamValueAsString(ModulePWA.PARAM_PWA_PUSH_PRIVATE_KEY);
            const mailto = await ModuleParams.getInstance().getParamValueAsString(ModulePWA.PARAM_PWA_PUSH_MAILTO);
            const icon = await ModuleParams.getInstance().getParamValueAsString(ModulePWA.PARAM_PWA_PUSH_ICON);

            if (!publicKey || !privateKey || !mailto) {
                return;
            }

            const client_subscription: PwaClientSubscriptionVO = await query(PwaClientSubscriptionVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<PwaClientSubscriptionVO>().user_id, user_id)
                .select_vo();

            if (!client_subscription?.id) {
                return;
            }

            webPush.setVapidDetails('mailto:' + mailto, publicKey, privateKey);

            const subscription: PushSubscriptionJSON = {
                endpoint: client_subscription.endpoint,
                keys: {
                    auth: (client_subscription.auth),
                    p256dh: (client_subscription.p256dh)
                }
            };

            const params = JSON.stringify(PwaNotification.createNew(
                ConfigurationService.node_configuration.app_title,
                message,
                ConfigurationService.node_configuration.base_url + icon,
                ConfigurationService.node_configuration.base_url + icon,
                url ?? ConfigurationService.node_configuration.base_url,
            ));
            await webPush.sendNotification(
                subscription,
                params
            );
        } catch (e) {
            ConsoleHandler.error(e);
        }
    }
}
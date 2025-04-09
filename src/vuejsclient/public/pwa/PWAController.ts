import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import PwaClientSubscriptionVO from '../../../shared/modules/PWA/vos/PwaClientSubscriptionVO';
import ModulePWA from '../../../shared/modules/PWA/ModulePWA';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
/* istanbul ignore file: nothing to test */

export default class PWAController {

    private static instance: PWAController = null;

    public custom_initialize_pwa: (jquery: any, app_name: string, sw_file: string) => Promise<void>;

    // istanbul ignore next: nothing to test
    public static getInstance(): PWAController {
        if (!PWAController.instance) {
            PWAController.instance = new PWAController();
        }
        return PWAController.instance;
    }

    public async initialize_pwa(jquery: any, app_name: string, sw_file: string) {
        if (this.custom_initialize_pwa) {
            await this.custom_initialize_pwa(jquery, app_name, sw_file);
        }

        if ('serviceWorker' in navigator) {
            const registration: ServiceWorkerRegistration = await navigator.serviceWorker.register(sw_file, { scope: '/' });

            if (registration) {
                await registration.update();
            }
        }
    }

    public async get_push_subscription(): Promise<PushSubscription> {
        if ('serviceWorker' in navigator) {
            const registration: ServiceWorkerRegistration = await navigator.serviceWorker.getRegistration();

            if (registration) {
                let push_subscription: PushSubscription = await registration.pushManager.getSubscription();

                if (!push_subscription) {
                    const publicKey: string = await ModuleParams.getInstance().getParamValueAsString(ModulePWA.PARAM_PWA_PUSH_PUBLIC_KEY);
                    const convertedKey = ConversionHandler.urlBase64ToUint8Array(publicKey);

                    push_subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedKey
                    });
                }

                return push_subscription;
            }
        }

        return null;
    }

    public async add_pwa_subscription(user_id: number) {
        if (!user_id) {
            return;
        }

        const push_subscription: PushSubscription = await this.get_push_subscription();

        if (!push_subscription) {
            return;
        }

        let client_subscription: PwaClientSubscriptionVO = await query(PwaClientSubscriptionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<PwaClientSubscriptionVO>().user_id, user_id)
            .select_vo();

        const push_subscription_json: PushSubscriptionJSON = push_subscription.toJSON();

        if (push_subscription_json) {
            if (!client_subscription?.id) {
                client_subscription = PwaClientSubscriptionVO.createNew(
                    user_id,
                    push_subscription_json.endpoint,
                    push_subscription_json.keys.auth,
                    push_subscription_json.keys.p256dh
                );
            }

            client_subscription.endpoint = push_subscription_json.endpoint;
            client_subscription.auth = push_subscription_json.keys.auth;
            client_subscription.p256dh = push_subscription_json.keys.p256dh;
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(client_subscription);
    }
}
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import PwaPushNotificationParam, { PwaPushNotificationParamStatic } from './params/PwaPushNotificationParam';
import PwaClientSubscriptionVO from './vos/PwaClientSubscriptionVO';

export default class ModulePWA extends Module {

    public static APINAME_send_push_notif: string = 'send_push_notif';

    public static PARAM_PWA_PUSH_PUBLIC_KEY: string = 'PWA_PUSH_PUBLIC_KEY';
    public static PARAM_PWA_PUSH_PRIVATE_KEY: string = 'PWA_PUSH_PRIVATE_KEY';
    public static PARAM_PWA_PUSH_MAILTO: string = 'PWA_PUSH_MAILTO';
    public static PARAM_PWA_PUSH_ICON: string = 'PWA_PUSH_ICON';

    private static instance: ModulePWA = null;

    /**
     * @param user_id Utilisateur à notifier
     * @param message Message de la notification
     * @param url Si pas de valeur, on prend l'url de la page d'accueil
     */
    public send_push_notif: (
        user_id: number,
        message: string,
        url: string,
    ) => Promise<any> = APIControllerWrapper.sah(ModulePWA.APINAME_send_push_notif);

    private constructor() {
        super("pwa", "PWA");
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePWA {
        if (!ModulePWA.instance) {
            ModulePWA.instance = new ModulePWA();
        }
        return ModulePWA.instance;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<PwaPushNotificationParam, any>(
            null,
            ModulePWA.APINAME_send_push_notif,
            [PwaClientSubscriptionVO.API_TYPE_ID],
            PwaPushNotificationParamStatic
        ));
    }

    public initialize() {
        this.initialize_PwaClientSubscriptionVO();
    }

    private initialize_PwaClientSubscriptionVO() {
        const user_id = ModuleTableFieldController.create_new(PwaClientSubscriptionVO.API_TYPE_ID, field_names<PwaClientSubscriptionVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true);

        ModuleTableFieldController.create_new(PwaClientSubscriptionVO.API_TYPE_ID, field_names<PwaClientSubscriptionVO>().endpoint, ModuleTableFieldVO.FIELD_TYPE_string, 'endpoint', false);
        ModuleTableFieldController.create_new(PwaClientSubscriptionVO.API_TYPE_ID, field_names<PwaClientSubscriptionVO>().auth, ModuleTableFieldVO.FIELD_TYPE_string, 'auth', false);
        ModuleTableFieldController.create_new(PwaClientSubscriptionVO.API_TYPE_ID, field_names<PwaClientSubscriptionVO>().p256dh, ModuleTableFieldVO.FIELD_TYPE_string, 'p256dh', false);

        ModuleTableController.create_new(this.name, PwaClientSubscriptionVO, null, "PWA Client Subscriptions");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}
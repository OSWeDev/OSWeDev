import * as io from 'socket.io-client/dist/socket.io.slim.js';
import APIController from '../../../../shared/modules/API/APIController';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import VueAppBase from '../../../VueAppBase';
import VarsClientController from '../../components/Var/VarsClientController';
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';
import VueModuleBase from '../VueModuleBase';

export default class PushDataVueModule extends VueModuleBase {

    public static getInstance(): PushDataVueModule {
        if (!PushDataVueModule.instance) {
            PushDataVueModule.instance = new PushDataVueModule();
        }

        return PushDataVueModule.instance;
    }

    private static instance: PushDataVueModule = null;

    protected socket;

    private constructor() {

        super(ModulePushData.getInstance().name);
    }

    public initialize() {
        let self = this;

        // test suppression base api url this.socket = io.connect(VueAppBase.getInstance().appController.data_base_api_url);
        this.socket = io.connect('');
        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_SIMPLE], async function (notification: NotificationVO) {

            if (VueAppBase.instance_ && LocaleManager.getInstance().i18n) {

                notification = APIController.getInstance().try_translate_vo_from_api(notification);

                let content = LocaleManager.getInstance().i18n.t(notification.simple_notif_label);
                switch (notification.simple_notif_type) {
                    case NotificationVO.SIMPLE_SUCCESS:
                        VueAppBase.instance_.vueInstance.snotify.success(content);
                        break;
                    case NotificationVO.SIMPLE_WARN:
                        VueAppBase.instance_.vueInstance.snotify.warning(content);
                        break;
                    case NotificationVO.SIMPLE_ERROR:
                        VueAppBase.instance_.vueInstance.snotify.error(content);
                        break;
                    case NotificationVO.SIMPLE_INFO:
                    default:
                        VueAppBase.instance_.vueInstance.snotify.info(content);
                }

                if (!notification.read) {
                    VueAppBase.instance_.vueInstance.$store.dispatch('NotificationStore/add_notification', notification);
                }
            }
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DAO], async function (notification: NotificationVO) {
            if (VueAppBase.instance_ && LocaleManager.getInstance().i18n) {

                notification = APIController.getInstance().try_translate_vo_from_api(notification);

                switch (notification.dao_notif_type) {
                    case NotificationVO.DAO_GET_VO_BY_ID:
                        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                        let vo: IDistantVOBase = await ModuleDAO.getInstance().getVoById(notification.api_type_id, notification.dao_notif_vo_id);
                        VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeData', vo);
                        console.debug("NotificationVO.DAO_GET_VO_BY_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                        break;
                    case NotificationVO.DAO_GET_VOS:
                        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos(notification.api_type_id);
                        VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeDatas', { API_TYPE_ID: notification.api_type_id, vos: vos });
                        console.debug("NotificationVO.DAO_GET_VOS:" + notification.api_type_id);
                        break;
                    case NotificationVO.DAO_REMOVE_ID:
                        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                        VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/removeData', {
                            API_TYPE_ID: notification.api_type_id,
                            id: notification.dao_notif_vo_id
                        });
                        console.debug("NotificationVO.DAO_REMOVE_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                        break;

                    default:
                }
            }
        });


        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VARDATA], async function (notification: NotificationVO) {
            if (VueAppBase.instance_ && LocaleManager.getInstance().i18n) {

                notification = APIController.getInstance().try_translate_vo_from_api(notification);

                let vos: VarDataBaseVO[] = null;
                if (!!notification.vos) {
                    vos = APIController.getInstance().try_translate_vos_from_api(JSON.parse(notification.vos));
                    VueAppBase.instance_.vueInstance.$store.dispatch('VarStore/setVarsData', vos);
                    await VarsClientController.getInstance().notifyCallbacks(vos);

                    let types: { [name: string]: boolean } = {};
                    for (let i in vos) {
                        let vo = vos[i];

                        if (!types[vo._type]) {
                            types[vo._type] = true;
                            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([vo._type]);
                        }
                    }
                }
            }
        });
        // TODO: Handle other notif types
    }
}
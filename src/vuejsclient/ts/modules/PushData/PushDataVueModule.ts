import * as io from 'socket.io-client/dist/socket.io.slim.js';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import VueAppBase from '../../../VueAppBase';
import VueModuleBase from '../VueModuleBase';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';

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
                    // ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([NotificationVO.API_TYPE_ID]);
                    // let vo: IDistantVOBase = await ModuleDAO.getInstance().getVoById(NotificationVO.API_TYPE_ID, notification.id);
                    VueAppBase.instance_.vueInstance.$store.dispatch('NotificationStore/add_notification', notification);
                }
            }
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DAO], async function (notification: NotificationVO) {
            if (VueAppBase.instance_ && LocaleManager.getInstance().i18n) {

                switch (notification.dao_notif_type) {
                    case NotificationVO.DAO_GET_VO_BY_ID:
                        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                        let vo: IDistantVOBase = await ModuleDAO.getInstance().getVoById(notification.api_type_id, notification.dao_notif_vo_id);
                        VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeData', vo);
                        console.debug("NotificationVO.DAO_GET_VO_BY_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                        break;
                    case NotificationVO.DAO_GET_VOS:
                        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos(notification.api_type_id);
                        VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeDatas', { API_TYPE_ID: notification.api_type_id, vos: vos });
                        console.debug("NotificationVO.DAO_GET_VOS:" + notification.api_type_id);
                        break;
                    default:
                }
            }
        });


        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VARDATA], async function (notification: NotificationVO) {
            if (VueAppBase.instance_ && LocaleManager.getInstance().i18n && notification.vo) {

                let vo: IDistantVOBase = null;
                if (!!notification.vo) {
                    vo = VOsTypesManager.getInstance().moduleTables_by_voType[notification.vo._type].from_api_version(notification.vo);
                    ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([vo._type]);
                    VueAppBase.instance_.vueInstance.$store.dispatch('VarStore/setVarData', vo);
                }
            }
        });
        // TODO: Handle other notif types
    }
}
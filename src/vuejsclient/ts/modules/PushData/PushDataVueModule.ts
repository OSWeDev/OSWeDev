import { io } from "socket.io-client";
import { SnotifyToast } from 'vue-snotify';
import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import APINotifTypeResultVO from "../../../../shared/modules/PushData/vos/APINotifTypeResultVO";
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueAppBase from '../../../VueAppBase';
import VarsClientController from '../../components/Var/VarsClientController';
import ClientAPIController from "../API/ClientAPIController";
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';
import VueModuleBase from '../VueModuleBase';
import VOEventRegistrationsHandler from "./VOEventRegistrationsHandler";

export default class PushDataVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): PushDataVueModule {
        if (!PushDataVueModule.instance) {
            PushDataVueModule.instance = new PushDataVueModule();
        }

        return PushDataVueModule.instance;
    }

    private static instance: PushDataVueModule = null;

    private static async joinAllRoomsAgain() {
        for (const room_id in VOEventRegistrationsHandler.registered_vo_create_callbacks) {
            const room_fields: string[] = [];
            for (const i in VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id]) {
                const room_vo = JSON.parse(room_id);
                for (const j in room_vo) {
                    room_fields.push(j);
                    room_fields.push(JSON.stringify(room_vo[j]));
                }
            }
            await ModulePushData.getInstance().join_io_room(room_fields);
        }

        for (const room_id in VOEventRegistrationsHandler.registered_vo_update_callbacks) {
            const room_fields: string[] = [];
            for (const i in VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id]) {
                const room_vo = JSON.parse(room_id);
                for (const j in room_vo) {
                    room_fields.push(j);
                    room_fields.push(JSON.stringify(room_vo[j]));
                }
            }
            await ModulePushData.getInstance().join_io_room(room_fields);
        }

        for (const room_id in VOEventRegistrationsHandler.registered_vo_delete_callbacks) {
            const room_fields: string[] = [];
            for (const i in VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id]) {
                const room_vo = JSON.parse(room_id);
                for (const j in room_vo) {
                    room_fields.push(j);
                    room_fields.push(JSON.stringify(room_vo[j]));
                }
            }
            await ModulePushData.getInstance().join_io_room(room_fields);
        }
    }

    public throttled_notifications_handler = ThrottleHelper.declare_throttle_with_stackable_args(
        this.notifications_handler.bind(this), 100, { leading: true, trailing: true });
    protected socket;

    private constructor() {

        super(ModulePushData.getInstance().name);
    }

    public initialize() {
        const self = this;
        let first = true;

        // test suppression base api url this.socket = io.connect(VueAppBase.getInstance().appController.data_base_api_url);
        this.socket = io({
            transportOptions: {
                polling: {
                    extraHeaders: {
                        client_tab_id: AjaxCacheClientController.getInstance().client_tab_id,
                    },
                },
            },
        });
        this.socket.on('disconnect', () => {
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('error', async () => {
            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('connect_error', async () => {
            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('connect_timeout', async () => {
            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('reconnect_error', async () => {
            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('reconnect_failed', async () => {
            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });

        /**
         * Sur une reco on veut rejouer tous les registerParams
         */
        this.socket.on('connect', () => {
            setTimeout(async () => {
                await self.check_version_app();
            }, 1);

            if (!first) {

                setTimeout(async () => {
                    await VarsClientController.getInstance().registerAllParamsAgain();
                    await PushDataVueModule.joinAllRoomsAgain();
                }, 10000);
            }
        });

        this.socket.on('reconnect', () => {
            setTimeout(async () => {
                await self.check_version_app();
            }, 1);

            setTimeout(async () => {
                await VarsClientController.getInstance().registerAllParamsAgain();
                await PushDataVueModule.joinAllRoomsAgain();
            }, 10000);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_SIMPLE], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DAO], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VARDATA], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_APIRESULT], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_TECH], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_PROMPT], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_REDIRECT], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DOWNLOAD_FILE], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_CREATED], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_DELETED], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_UPDATED], async function (notification: NotificationVO) {
            self.throttled_notifications_handler([notification]);
        });

        // TODO: Handle other notif types
    }

    /**
     *
     * @returns Si on a pas la même version entre le front et le back, on recharge la page
     */
    private async check_version_app() {
        const server_app_version: string = await ModulePushData.getInstance().get_app_version();

        if (server_app_version && (EnvHandler.version != server_app_version)) {

            /**
             * Cas du dev local, on checke le timestamp server vs local, si le local est plus récent inutile de recharger
             */
            const server_app_version_timestamp_str: string = server_app_version.split('-')[1];
            const server_app_version_timestamp: number = server_app_version_timestamp_str?.length ? parseInt(server_app_version_timestamp_str) : null;

            const local_app_version_timestamp_str: string = EnvHandler.version.split('-')[1];
            const local_app_version_timestamp: number = local_app_version_timestamp_str?.length ? parseInt(local_app_version_timestamp_str) : null;

            if (server_app_version_timestamp && local_app_version_timestamp && (local_app_version_timestamp > server_app_version_timestamp)) {
                return;
            }

            if (VueAppBase.instance_.vueInstance && VueAppBase.instance_.vueInstance.snotify) {
                VueAppBase.instance_.vueInstance.snotify.warning(
                    VueAppBase.instance_.vueInstance.label("app_version_changed"),
                    { timeout: 3000 },
                );
            }

            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    private async notifications_handler(notifications: NotificationVO[]) {

        if (!(VueAppBase.instance_ && LocaleManager.getInstance().i18n)) {
            return;
        }
        notifications = APIControllerWrapper.try_translate_vos_from_api(notifications);

        /**
         * On regroupe par type pour gérer en bloc ensuite
         */
        const TYPE_NOTIF_SIMPLE: NotificationVO[] = [];
        const TYPE_NOTIF_DAO: NotificationVO[] = [];
        const TYPE_NOTIF_VARDATA: NotificationVO[] = [];
        const TYPE_NOTIF_TECH: NotificationVO[] = [];
        const TYPE_NOTIF_PROMPT: NotificationVO[] = [];
        const TYPE_NOTIF_REDIRECT: NotificationVO[] = [];
        const TYPE_NOTIF_APIRESULT: NotificationVO[] = [];
        const TYPE_NOTIF_DOWNLOAD_FILE: NotificationVO[] = [];
        const TYPE_NOTIF_VO_CREATED: NotificationVO[] = [];
        const TYPE_NOTIF_VO_UPDATED: NotificationVO[] = [];
        const TYPE_NOTIF_VO_DELETED: NotificationVO[] = [];

        for (const i in notifications) {
            const notification = notifications[i];

            switch (notification.notification_type) {
                case NotificationVO.TYPE_NOTIF_SIMPLE:
                    TYPE_NOTIF_SIMPLE.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_DAO:
                    TYPE_NOTIF_DAO.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_VARDATA:
                    TYPE_NOTIF_VARDATA.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_APIRESULT:
                    TYPE_NOTIF_APIRESULT.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_TECH:
                    TYPE_NOTIF_TECH.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_PROMPT:
                    TYPE_NOTIF_PROMPT.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_REDIRECT:
                    TYPE_NOTIF_REDIRECT.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_DOWNLOAD_FILE:
                    TYPE_NOTIF_DOWNLOAD_FILE.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_VO_CREATED:
                    TYPE_NOTIF_VO_CREATED.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_VO_UPDATED:
                    TYPE_NOTIF_VO_UPDATED.push(notification);
                    break;
                case NotificationVO.TYPE_NOTIF_VO_DELETED:
                    TYPE_NOTIF_VO_DELETED.push(notification);
                    break;
            }
        }

        if (TYPE_NOTIF_SIMPLE && TYPE_NOTIF_SIMPLE.length) {
            await this.notifications_handler_TYPE_NOTIF_SIMPLE(TYPE_NOTIF_SIMPLE);
        }

        if (TYPE_NOTIF_DAO && TYPE_NOTIF_DAO.length) {
            await this.notifications_handler_TYPE_NOTIF_DAO(TYPE_NOTIF_DAO);
        }

        if (TYPE_NOTIF_VARDATA && TYPE_NOTIF_VARDATA.length) {
            await this.notifications_handler_TYPE_NOTIF_VARDATA(TYPE_NOTIF_VARDATA);
        }

        if (TYPE_NOTIF_TECH && TYPE_NOTIF_TECH.length) {
            await this.notifications_handler_TYPE_NOTIF_TECH(TYPE_NOTIF_TECH);
        }

        if (TYPE_NOTIF_PROMPT && TYPE_NOTIF_PROMPT.length) {
            await this.notifications_handler_TYPE_NOTIF_PROMPT(TYPE_NOTIF_PROMPT);
        }

        if (TYPE_NOTIF_REDIRECT && TYPE_NOTIF_REDIRECT.length) {
            await this.notifications_handler_TYPE_NOTIF_REDIRECT(TYPE_NOTIF_REDIRECT);
        }

        if (TYPE_NOTIF_DOWNLOAD_FILE && TYPE_NOTIF_DOWNLOAD_FILE.length) {
            await this.notifications_handler_TYPE_NOTIF_DOWNLOAD_FILE(TYPE_NOTIF_DOWNLOAD_FILE);
        }

        if (TYPE_NOTIF_APIRESULT && TYPE_NOTIF_APIRESULT.length) {
            await this.notifications_handler_TYPE_NOTIF_APIRESULT(TYPE_NOTIF_APIRESULT);
        }

        if (TYPE_NOTIF_VO_CREATED && TYPE_NOTIF_VO_CREATED.length) {
            await this.notifications_handler_TYPE_NOTIF_VO_CREATED(TYPE_NOTIF_VO_CREATED);
        }

        if (TYPE_NOTIF_VO_UPDATED && TYPE_NOTIF_VO_UPDATED.length) {
            await this.notifications_handler_TYPE_NOTIF_VO_UPDATED(TYPE_NOTIF_VO_UPDATED);
        }

        if (TYPE_NOTIF_VO_DELETED && TYPE_NOTIF_VO_DELETED.length) {
            await this.notifications_handler_TYPE_NOTIF_VO_DELETED(TYPE_NOTIF_VO_DELETED);
        }
    }

    private async notifications_handler_TYPE_NOTIF_VO_CREATED(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_create_callbacks[notification.room_id]) {
                const vos: IDistantVOBase[] = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos));
                const vo = vos[0];

                VOEventRegistrationsHandler.registered_vo_create_callbacks[notification.room_id][j](vo);
            }
        }
    }

    private async notifications_handler_TYPE_NOTIF_VO_UPDATED(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_update_callbacks[notification.room_id]) {
                const vos: IDistantVOBase[] = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos));
                VOEventRegistrationsHandler.registered_vo_update_callbacks[notification.room_id][j](vos[0], vos[1]);
            }
        }
    }

    private async notifications_handler_TYPE_NOTIF_VO_DELETED(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_delete_callbacks[notification.room_id]) {
                const vos: IDistantVOBase[] = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos));
                VOEventRegistrationsHandler.registered_vo_delete_callbacks[notification.room_id][j](vos[0]);
            }
        }
    }

    private async notifications_handler_TYPE_NOTIF_APIRESULT(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            const api_result: APINotifTypeResultVO = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos))[0];

            if (!api_result) {
                ConsoleHandler.error("API result not found for notification:" + notification);
                continue;
            }

            if (!api_result.api_call_id) {
                ConsoleHandler.error("API result not found for notification:" + notification);
                continue;
            }

            if (!ClientAPIController.api_waiting_for_result_notif_solvers) {
                ClientAPIController.api_waiting_for_result_notif_waiting_for_solvers[api_result.api_call_id] = () => {
                    ClientAPIController.api_waiting_for_result_notif_solvers[api_result.api_call_id](api_result.res);
                };
            } else {
                ClientAPIController.api_waiting_for_result_notif_solvers[api_result.api_call_id](api_result.res);
            }
        }
    }

    private async notifications_handler_TYPE_NOTIF_PROMPT(notifications: NotificationVO[]) {

        const unreads: NotificationVO[] = [];
        for (const i in notifications) {
            const notification = notifications[i];

            const content = notification.simple_notif_json_params ?
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label);
            VueAppBase.instance_.vueInstance.snotify.prompt(content, {
                timeout: 60000,
                buttons: [
                    {
                        text: LocaleManager.getInstance().i18n.t('snotify.prompt.submit.___LABEL___'), action: async (toast: SnotifyToast) => {
                            VueAppBase.instance_.vueInstance.snotify.remove(toast.id);
                            notification.prompt_result = toast.value;
                            await ModulePushData.getInstance().set_prompt_result(notification);
                        }, bold: true,
                    },
                    {
                        text: LocaleManager.getInstance().i18n.t('snotify.prompt.cancel.___LABEL___'), action: async (toast: SnotifyToast) => {
                            VueAppBase.instance_.vueInstance.snotify.remove(toast.id);
                            await ModulePushData.getInstance().set_prompt_result(notification);
                        },
                    },
                ],
            });

            if (!notification.read) {
                unreads.push(notification);
            }
        }
        await VueAppBase.instance_.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
    }


    private async notifications_handler_TYPE_NOTIF_SIMPLE(notifications: NotificationVO[]) {

        const unreads: NotificationVO[] = [];
        for (const i in notifications) {
            const notification = notifications[i];

            const content = notification.simple_notif_json_params ?
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label);
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
                unreads.push(notification);
            }
        }
        await VueAppBase.instance_.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
    }

    private async notifications_handler_TYPE_NOTIF_DOWNLOAD_FILE(notifications: NotificationVO[]) {

        for (const i in notifications) {
            const notification = notifications[i];

            if (!notification.simple_downloadable_link) {
                continue;
            }

            const iframe = $('<iframe style="display:none" src="' + notification.simple_downloadable_link + '"></iframe>');
            $('body').append(iframe);
        }
    }

    private async notifications_handler_TYPE_NOTIF_REDIRECT(notifications: NotificationVO[]) {

        const unreads: NotificationVO[] = [];
        for (const i in notifications) {
            const notification = notifications[i];

            const content = notification.simple_notif_json_params ?
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.getInstance().i18n.t(notification.simple_notif_label);
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
                unreads.push(notification);
            }
        }
        await VueAppBase.instance_.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
    }

    /**
     * TODO à optimiser
     */
    private async notifications_handler_TYPE_NOTIF_DAO(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            switch (notification.dao_notif_type) {
                case NotificationVO.DAO_GET_VO_BY_ID:
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                    const vo: IDistantVOBase = await query(notification.api_type_id).filter_by_id(notification.dao_notif_vo_id).select_vo();
                    await VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeData', vo);
                    console.debug("NotificationVO.DAO_GET_VO_BY_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                    break;
                case NotificationVO.DAO_GET_VOS:
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                    const vos: IDistantVOBase[] = await query(notification.api_type_id).select_vos();
                    await VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/storeDatas', { API_TYPE_ID: notification.api_type_id, vos: vos });
                    console.debug("NotificationVO.DAO_GET_VOS:" + notification.api_type_id);
                    break;
                case NotificationVO.DAO_REMOVE_ID:
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                    await VueAppBase.instance_.vueInstance.$store.dispatch('DAOStore/removeData', {
                        API_TYPE_ID: notification.api_type_id,
                        id: notification.dao_notif_vo_id,
                    });
                    console.debug("NotificationVO.DAO_REMOVE_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                    break;

                default:
            }
        }
    }

    /**
     * On ne s'intéresse que à la dernière notification d'un index donné
     */
    private async notifications_handler_TYPE_NOTIF_VARDATA(notifications: NotificationVO[]) {

        const var_by_indexes: { [index: string]: VarDataValueResVO } = {};
        for (const i in notifications) {
            const notification = notifications[i];

            if (notification.vos) {
                const tmp = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos));
                if (tmp && tmp.length) {
                    for (const j in tmp) {
                        const e: VarDataValueResVO = tmp[j];


                        // On log les notifications sur l'index sélectionné en description actuellement
                        const selectedVarParam: VarDataBaseVO = VueAppBase.instance_.vueInstance.$store.getters['VarStore/getDescSelectedVarParam'];
                        if (selectedVarParam && selectedVarParam.index && (selectedVarParam.index == e.index)) {
                            ConsoleHandler.log('Notification pour var sélectionnée :' +
                                'id:' + e.id + ':' +
                                'value:' + e.value + ':' +
                                'value_type:' + e.value_type + ':' +
                                'value_ts:' + e.value_ts + ':' +
                                'is_computing:' + e.is_computing + ':' +
                                'index:' + e.index + ':',
                            );
                        }

                        // Si on a une notif qui indique une value pas computing et valide, on met à jour pour éviter de relancer un register
                        if ((!e.is_computing) && (e.value_ts) && VarsClientController.getInstance().registered_var_params_to_check_next_time[e.index]) {
                            delete VarsClientController.getInstance().registered_var_params_to_check_next_time[e.index];
                        }

                        // On check les dates aussi
                        if ((!var_by_indexes[e.index]) || (!var_by_indexes[e.index].value_ts)) {
                            var_by_indexes[e.index] = e;
                            continue;
                        }

                        if (!e.value_ts) {
                            continue;
                        }

                        if (var_by_indexes[e.index].value_ts > e.value_ts) {
                            continue;
                        }

                        var_by_indexes[e.index] = e;
                    }
                }
            }
        }

        if (var_by_indexes && ObjectHandler.hasAtLeastOneAttribute(var_by_indexes)) {

            const vos = Object.values(var_by_indexes);

            const types: { [name: string]: boolean } = {};

            if (vos && vos.length) {
                VarsClientController.getInstance().last_notif_received = Dates.now();
            }

            for (const i in vos) {
                const vo = vos[i];

                // ConsoleHandler.log('notif_var:' + vo.index + ':' + vo.value + ':' + vo.value_ts + ':' + vo.value_type + ':' + vo.is_computing);

                // if varData is_computing, on veut écraser un seul champs
                if (vo.is_computing) {

                    const stored_var: VarDataValueResVO = VarsClientController.cached_var_datas[vo.index];

                    // Si on a encore rien reçu, l'info de calcul en cours est inutile
                    if (stored_var) {
                        vo.value = stored_var.value;
                        vo.value_ts = stored_var.value_ts;
                        vo.value_type = stored_var.value_type;
                        vo.id = stored_var.id;
                    }
                }
                VarsClientController.cached_var_datas[vo.index] = vo;

                if (!types[vo._type]) {
                    types[vo._type] = true;
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([vo._type]);
                }
            }

            // VueAppBase.instance_.vueInstance.$store.dispatch('VarStore/setVarsData', vos);
            await VarsClientController.getInstance().notifyCallbacks(vos);
        }
    }


    private async notifications_handler_TYPE_NOTIF_TECH(notifications: NotificationVO[]) {

        for (const i in notifications) {
            const notification = notifications[i];

            if (notification.vos) {
                const tmp = APIControllerWrapper.try_translate_vos_from_api(JSON.parse(notification.vos));
                if (tmp && tmp.length) {
                    for (const j in tmp) {
                        const vo = tmp[j];

                        switch (vo.marker) {
                            case NotificationVO.TECH_DISCONNECT_AND_REDIRECT_HOME:

                                const PARAM_TECH_DISCONNECT_URL: string = await ModuleParams.getInstance().getParamValueAsString(ModulePushData.PARAM_TECH_DISCONNECT_URL);

                                // let content = LocaleManager.getInstance().i18n.t('PushDataServerController.session_invalidated.___LABEL___');
                                // VueAppBase.instance_.vueInstance.snotify.warning(content, {
                                //     timeout: 3000
                                // });

                                // setTimeout(() => {
                                location.href = PARAM_TECH_DISCONNECT_URL;
                                // }, 3000);
                                break;

                            case NotificationVO.TECH_LOGGED_AND_REDIRECT_HOME:

                                // On teste de supprimer les délais pour éviter les appels à des méthodes qui ne sont plus accessibles typiquement lors d'un impersonate...
                                // let content_user_logged = LocaleManager.getInstance().i18n.t('PushDataServerController.user_logged.___LABEL___');
                                // VueAppBase.instance_.vueInstance.snotify.success(content_user_logged, {
                                //     timeout: 3000
                                // });
                                // setTimeout(() => {
                                location.href = '/';
                                // }, 3000);
                                break;

                            case NotificationVO.TECH_RELOAD:
                                const content_reload = LocaleManager.getInstance().i18n.t('PushDataServerController.reload.___LABEL___');
                                VueAppBase.instance_.vueInstance.snotify.warning(content_reload, {
                                    timeout: 3000,
                                });
                                setTimeout(() => {
                                    window.location.reload();
                                }, 3000);
                                break;

                            default:
                                break;
                        }
                    }
                }
            }
        }
    }
}
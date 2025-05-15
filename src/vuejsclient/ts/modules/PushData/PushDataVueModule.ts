import { io } from "socket.io-client";
import { SnotifyToast } from 'vue-snotify';
import Throttle, { PostThrottleParam, PreThrottleParam } from "../../../../shared/annotations/Throttle";
import ModuleAccessPolicy from "../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import ModuleEnvParam from "../../../../shared/modules/EnvParam/ModuleEnvParam";
import EnvParamsVO from "../../../../shared/modules/EnvParam/vos/EnvParamsVO";
import EventifyEventListenerConfVO from "../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import FileVO from "../../../../shared/modules/File/vos/FileVO";
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from "../../../../shared/modules/GPT/ModuleGPT";
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import OseliaController from "../../../../shared/modules/Oselia/OseliaController";
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
import ThreadHandler from "../../../../shared/tools/ThreadHandler";
import VueAppBaseInstanceHolder from "../../../VueAppBaseInstanceHolder";
import VueAppController from "../../../VueAppController";
import VarsClientController from '../../components/Var/VarsClientController';
import ClientAPIController from "../API/ClientAPIController";
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';
import VueModuleBase from '../VueModuleBase';
import VOEventRegistrationsHandler from "./VOEventRegistrationsHandler";

export default class PushDataVueModule extends VueModuleBase {

    private static instance: PushDataVueModule = null;

    public env_params: EnvParamsVO = null;
    public var_debug_notif_id: number = 0;

    protected socket;

    protected snotify_connect_disconnect = null;
    protected snotify_observer_error_no_internet = null;

    private constructor() {

        super(ModulePushData.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): PushDataVueModule {
        if (!PushDataVueModule.instance) {
            PushDataVueModule.instance = new PushDataVueModule();
        }

        return PushDataVueModule.instance;
    }

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


    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
        throttle_ms: 100,
    })
    private async notifications_handler(@PreThrottleParam pre_notifications: NotificationVO[], @PostThrottleParam notifications: NotificationVO[] = null) {

        if (!VueAppBaseInstanceHolder.instance) {
            ConsoleHandler.error("notifications_handler:!VueAppBaseInstanceHolder.instance: Might loose some notifications:" + JSON.stringify(notifications));
            return;
        }
        // notifications = APIControllerWrapper.try_translate_vos_from_api(notifications);
        notifications = ObjectHandler.reapply_prototypes(notifications);

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
                    if (!LocaleManager.i18n) {
                        ConsoleHandler.warn("notifications_handler:LocaleManager.i18n not ready, skipping notification:" + notification);
                        break;
                    }

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
                    if (!LocaleManager.i18n) {
                        ConsoleHandler.warn("notifications_handler:LocaleManager.i18n not ready, skipping notification:" + notification);
                        break;
                    }

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

    public async initializeAsync(): Promise<void> {
        const has_access_to_env_params = await ModuleAccessPolicy.getInstance().testAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS);
        if (has_access_to_env_params) {
            this.env_params = await ModuleEnvParam.getInstance().get_env_params();
        }
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

        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Créer un observateur de performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            this.catch_performance_observers(entries);
        });

        // Commencer à observer les entrées de type 'resource'
        observer.observe({ type: 'resource', buffered: true });


        this.socket.on('disconnect', (reason) => {
            ConsoleHandler.error('Socket : Déconnexion ' + reason);

            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('error', async () => {
            ConsoleHandler.error('Socket : Erreur');

            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('connect_error', async () => {
            ConsoleHandler.error('Socket : Connect erreur');

            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('connect_timeout', async () => {
            ConsoleHandler.error('Socket : Connect timeout');

            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('reconnect_error', async () => {
            ConsoleHandler.error('Socket : Reconnecte erreur');

            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });
        this.socket.on('reconnect_failed', async () => {
            ConsoleHandler.error('Socket : Reccontect failed');

            // On tente une reconnexion toutes les 10 secondes
            setTimeout(() => {
                first = false;
                self.socket.open();
            }, 5000);
        });

        /**
         * Sur une reco on veut rejouer tous les registerParams
         */
        this.socket.on('connect', (socket) => {
            let same_version_app: boolean = true;

            setTimeout(async () => {
                same_version_app = await self.check_version_app();
            }, 1);

            if (!first && same_version_app) {
                setTimeout(async () => {
                    await VarsClientController.getInstance().registerAllParamsAgain();
                    await PushDataVueModule.joinAllRoomsAgain();
                }, 10000);
            }
        });

        this.socket.on('reconnect', () => {
            let same_version_app: boolean = true;

            setTimeout(async () => {
                same_version_app = await self.check_version_app();
            }, 1);

            if (same_version_app) {
                setTimeout(async () => {
                    await VarsClientController.getInstance().registerAllParamsAgain();
                    await PushDataVueModule.joinAllRoomsAgain();
                }, 10000);
            }
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_SIMPLE], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DAO], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VARDATA], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_APIRESULT], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_TECH], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_PROMPT], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_REDIRECT], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DOWNLOAD_FILE], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_CREATED], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_DELETED], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        this.socket.on(NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_VO_UPDATED], async function (notification: NotificationVO) {
            self.notifications_handler([notification]);
        });

        // TODO: Handle other notif types
    }

    // Fonction pour vérifier toutes les ressources qu'on appelle et faire une gestion d'erreur
    public catch_performance_observers(entries) {
        // Si mon navigateur est online, on ne fait rien
        if (navigator.onLine) {
            return;
        }

        // On va parcourir toutes les requêtes pour voir celles qui ont échouées
        entries.forEach((entry) => {
            if (entry.initiatorType !== 'xmlhttprequest' && entry.initiatorType !== 'fetch') {
                // Filtrer les requêtes XHR et Fetch
                return;
            }

            // On a une erreur 0 => panne de réseau
            if (entry.responseStatus === 0) {
                ConsoleHandler.error("Erreur chargement de la ressource : " + entry.name + " => " + entry.responseStatus);

                // On affiche un message d'erreur à l'internaute pour lui dire de recharger sa page
                if (!this.snotify_observer_error_no_internet) {
                    this.snotify_observer_error_no_internet = VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(
                        VueAppBaseInstanceHolder.instance.vueInstance.label("observer_error_no_internet"),
                        { timeout: 0 },
                    );
                }
                return;
            }
        });
    }

    /**
     *
     * @returns Si on a pas la même version entre le front et le back, on recharge la page
     */
    public async check_version_app(): Promise<boolean> {
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

            if (VueAppBaseInstanceHolder.instance.vueInstance && VueAppBaseInstanceHolder.instance.vueInstance.snotify) {
                VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(
                    VueAppBaseInstanceHolder.instance.vueInstance.label("app_version_changed"),
                    { timeout: 3000 },
                );
            }

            setTimeout(() => {
                window.location.reload();
            }, 3000);

            return false;
        }

        return true;
    }

    public async wait_navigator_online(): Promise<boolean> {

        const timer: number = Dates.now();

        // Tant que le navigateur on offline, on attend (maximum 60 secondes) et on recharge la page automatiquement ensuite
        while (!navigator.onLine) {
            await ThreadHandler.sleep(500, 'vueRouter.beforeEach - navigateur not online');

            if ((Dates.diff(Dates.now(), timer, TimeSegment.TYPE_SECOND) >= 60)) {
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return false;
            }
        }

        return PushDataVueModule.getInstance().check_version_app();
    }

    /**
     * Permet de faire un traitement particulier lorsqu'on passe online
     */
    private async handleOnline() {
        ConsoleHandler.error('Connexion internet rétablie');

        if (this.snotify_connect_disconnect) {
            VueAppBaseInstanceHolder.instance.vueInstance.snotify.remove(this.snotify_connect_disconnect.id);
            this.snotify_connect_disconnect = null;
        }

        await PushDataVueModule.getInstance().check_version_app();
    }

    /**
     * Permet de faire un traitement particulier lorsqu'on passe offline
     */
    private handleOffline() {
        ConsoleHandler.error('Perte de la connexion internet');

        this.snotify_connect_disconnect = VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(
            VueAppBaseInstanceHolder.instance.vueInstance.label("no_internet"),
            { timeout: 0 },
        );
    }

    private async notifications_handler_TYPE_NOTIF_VO_CREATED(notifications: NotificationVO[]) {

        // On invalide le cache des vo_type concernés
        const vos_types: { [vo_type_id: string]: boolean } = {};

        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_create_callbacks[notification.room_id]) {
                const vo = notification.vos[0];

                VOEventRegistrationsHandler.registered_vo_create_callbacks[notification.room_id][j](vo);
                vos_types[vo._type] = true;
            }
        }

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(Object.keys(vos_types));
    }

    private async notifications_handler_TYPE_NOTIF_VO_UPDATED(notifications: NotificationVO[]) {
        // On invalide le cache des vo_type concernés
        const vos_types: { [vo_type_id: string]: boolean } = {};

        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_update_callbacks[notification.room_id]) {
                VOEventRegistrationsHandler.registered_vo_update_callbacks[notification.room_id][j](notification.vos[0], notification.vos[1]);
                vos_types[notification.vos[0]._type] = true;
            }
        }

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(Object.keys(vos_types));
    }

    private async notifications_handler_TYPE_NOTIF_VO_DELETED(notifications: NotificationVO[]) {
        // On invalide le cache des vo_type concernés
        const vos_types: { [vo_type_id: string]: boolean } = {};

        for (const i in notifications) {
            const notification = notifications[i];

            for (const j in VOEventRegistrationsHandler.registered_vo_delete_callbacks[notification.room_id]) {
                VOEventRegistrationsHandler.registered_vo_delete_callbacks[notification.room_id][j](notification.vos[0]);
                vos_types[notification.vos[0]._type] = true;
            }
        }

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(Object.keys(vos_types));
    }

    private async notifications_handler_TYPE_NOTIF_APIRESULT(notifications: NotificationVO[]) {
        for (const i in notifications) {
            const notification = notifications[i];

            const api_result: APINotifTypeResultVO = notification.vos[0] as APINotifTypeResultVO;

            if (!api_result) {
                ConsoleHandler.error("API result not found for notification:" + notification);
                continue;
            }

            if (!api_result.api_call_id) {
                ConsoleHandler.error("API result not found for notification:" + notification);
                continue;
            }

            if ((!ClientAPIController.api_waiting_for_result_notif_solvers) || (!ClientAPIController.api_waiting_for_result_notif_solvers[api_result.api_call_id])) {
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
                LocaleManager.i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.i18n.t(notification.simple_notif_label);
            VueAppBaseInstanceHolder.instance.vueInstance.snotify.prompt(content, {
                timeout: 60000,
                buttons: [
                    {
                        text: LocaleManager.i18n.t('snotify.prompt.submit.___LABEL___'), action: async (toast: SnotifyToast) => {
                            VueAppBaseInstanceHolder.instance.vueInstance.snotify.remove(toast.id);
                            notification.prompt_result = toast.value;
                            await ModulePushData.getInstance().set_prompt_result(notification);
                        }, bold: true,
                    },
                    {
                        text: LocaleManager.i18n.t('snotify.prompt.cancel.___LABEL___'), action: async (toast: SnotifyToast) => {
                            VueAppBaseInstanceHolder.instance.vueInstance.snotify.remove(toast.id);
                            await ModulePushData.getInstance().set_prompt_result(notification);
                        },
                    },
                ],
            });

            if (!notification.read) {
                unreads.push(notification);
            }
        }
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
    }


    private async notifications_handler_TYPE_NOTIF_SIMPLE(notifications: NotificationVO[]) {

        const unreads: NotificationVO[] = [];
        for (const i in notifications) {
            const notification = notifications[i];

            const content = notification.simple_notif_json_params ?
                LocaleManager.i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.i18n.t(notification.simple_notif_label);
            switch (notification.simple_notif_type) {
                case NotificationVO.SIMPLE_SUCCESS:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.success(content);
                    break;
                case NotificationVO.SIMPLE_WARN:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(content);
                    break;
                case NotificationVO.SIMPLE_ERROR:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.error(content);
                    break;
                case NotificationVO.SIMPLE_INFO:
                default:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.info(content);
            }

            if (!notification.read) {
                unreads.push(notification);
            }
        }
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
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
                LocaleManager.i18n.t(notification.simple_notif_label, JSON.parse(notification.simple_notif_json_params)) :
                LocaleManager.i18n.t(notification.simple_notif_label);
            switch (notification.simple_notif_type) {
                case NotificationVO.SIMPLE_SUCCESS:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.success(content);
                    break;
                case NotificationVO.SIMPLE_WARN:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(content);
                    break;
                case NotificationVO.SIMPLE_ERROR:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.error(content);
                    break;
                case NotificationVO.SIMPLE_INFO:
                default:
                    VueAppBaseInstanceHolder.instance.vueInstance.snotify.info(content);
            }

            if (!notification.read) {
                unreads.push(notification);
            }
        }
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('NotificationStore/add_notifications', unreads);
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
                    await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('DAOStore/storeData', vo);
                    console.debug("NotificationVO.DAO_GET_VO_BY_ID:" + notification.api_type_id + ":" + notification.dao_notif_vo_id);
                    break;
                case NotificationVO.DAO_GET_VOS:
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                    const vos: IDistantVOBase[] = await query(notification.api_type_id).select_vos();
                    await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('DAOStore/storeDatas', { API_TYPE_ID: notification.api_type_id, vos: vos });
                    console.debug("NotificationVO.DAO_GET_VOS:" + notification.api_type_id);
                    break;
                case NotificationVO.DAO_REMOVE_ID:
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([notification.api_type_id]);
                    await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('DAOStore/removeData', {
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
                if (notification.vos && notification.vos.length) {
                    for (const j in notification.vos) {
                        const e: VarDataValueResVO = notification.vos[j] as VarDataValueResVO;

                        this.var_debug_notif_id++;

                        // On log les notifications sur l'index sélectionné en description actuellement
                        const selectedVarParam: VarDataBaseVO = VueAppBaseInstanceHolder.instance.vueInstance.$store.getters['VarStore/getDescSelectedVarParam'];
                        if (selectedVarParam && selectedVarParam.index && (selectedVarParam.index == e.index)) {
                            ConsoleHandler.log('Notification pour var sélectionnée :' +
                                'id:' + e.id + ':' +
                                'value:' + e.value + ':' +
                                'value_type:' + e.value_type + ':' +
                                'value_ts:' + e.value_ts + ':' +
                                'is_computing:' + e.is_computing + ':' +
                                'index:' + e.index + ':' +
                                'notif_ts:' + e.notif_ts + ':'
                            );
                        }

                        if (this.env_params && this.env_params.debug_vars_notifs) {
                            ConsoleHandler.log('Notification pour var - debug :' +
                                'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                'id:' + e.id + ':' +
                                'value:' + e.value + ':' +
                                'value_type:' + e.value_type + ':' +
                                'value_ts:' + e.value_ts + ':' +
                                'is_computing:' + e.is_computing + ':' +
                                'index:' + e.index + ':' +
                                'notif_ts:' + e.notif_ts + ':'
                            );
                        }

                        // Si on a une notif qui indique une value pas computing et valide, on met à jour pour éviter de relancer un register
                        if ((!e.is_computing) && (e.value_ts) && VarsClientController.getInstance().registered_var_params_to_check_next_time[e.index]) {
                            if (this.env_params && this.env_params.debug_vars_notifs) {
                                ConsoleHandler.log('Notification pour var - debug :' +
                                    'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                    'index:' + e.index + ':' +
                                    'DELETE registered_var_params_to_check_next_time'
                                );
                            }

                            delete VarsClientController.getInstance().registered_var_params_to_check_next_time[e.index];
                        }

                        // On check les dates aussi
                        if ((!var_by_indexes[e.index]) || (!var_by_indexes[e.index].value_ts)) {
                            var_by_indexes[e.index] = e;

                            if (this.env_params && this.env_params.debug_vars_notifs) {
                                ConsoleHandler.log('Notification pour var - debug :' +
                                    'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                    'index:' + e.index + ':' +
                                    'OK - value_ts'
                                );
                            }
                            continue;
                        }

                        if (!e.value_ts) {
                            if (this.env_params && this.env_params.debug_vars_notifs) {
                                ConsoleHandler.log('Notification pour var - debug :' +
                                    'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                    'index:' + e.index + ':' +
                                    'SKIP - value_ts null'
                                );
                            }

                            continue;
                        }

                        if (var_by_indexes[e.index].value_ts > e.value_ts) {
                            if (this.env_params && this.env_params.debug_vars_notifs) {
                                ConsoleHandler.log('Notification pour var - debug :' +
                                    'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                    'index:' + e.index + ':' +
                                    'SKIP - value_ts older'
                                );
                            }

                            continue;
                        }

                        if (var_by_indexes[e.index].value_ts == e.value_ts) {
                            if (var_by_indexes[e.index].notif_ts > e.notif_ts) {
                                if (this.env_params && this.env_params.debug_vars_notifs) {
                                    ConsoleHandler.log('Notification pour var - debug :' +
                                        'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                        'index:' + e.index + ':' +
                                        'SKIP - notif_ts older'
                                    );
                                }

                                continue;
                            }
                        }

                        if (this.env_params && this.env_params.debug_vars_notifs) {
                            ConsoleHandler.log('Notification pour var - debug :' +
                                'var_debug_notif_id:' + this.var_debug_notif_id + ':' +
                                'index:' + e.index + ':' +
                                'OK'
                            );
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
                types[vo._type] = true;

                // if varData is_computing, on veut écraser un seul champs
                if (vo.is_computing) {

                    const stored_var: VarDataValueResVO = VarsClientController.cached_var_datas[vo.index];

                    // Si on a encore rien reçu, l'info de calcul en cours est inutile
                    if (stored_var) {
                        vo.value = stored_var.value;
                        vo.value_ts = stored_var.value_ts;
                        vo.value_type = stored_var.value_type;
                        vo.id = stored_var.id;
                    } else {
                        continue;
                    }
                }
                VarsClientController.cached_var_datas[vo.index] = vo;
            }

            const vo_types = Object.keys(types);
            if (vo_types && vo_types.length) {
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(vo_types);
            }

            // VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('VarStore/setVarsData', vos);
            VarsClientController.getInstance().notifyCallbacks(vos);
        }
    }


    private async notifications_handler_TYPE_NOTIF_TECH(notifications: NotificationVO[]) {

        for (const i in notifications) {
            const notification = notifications[i];

            if (notification.vos) {
                if (notification.vos && notification.vos.length) {
                    for (const j in notification.vos) {
                        const vo = notification.vos[j] as any;

                        switch (vo.marker) {
                            case NotificationVO.TECH_DISCONNECT_AND_REDIRECT_HOME:

                                const PARAM_TECH_DISCONNECT_URL: string = await ModuleParams.getInstance().getParamValueAsString(ModulePushData.PARAM_TECH_DISCONNECT_URL, null, 10000);

                                // let content = LocaleManager.i18n.t('PushDataServerController.session_invalidated.___LABEL___');
                                // VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(content, {
                                //     timeout: 3000
                                // });

                                // setTimeout(() => {
                                location.href = PARAM_TECH_DISCONNECT_URL;
                                // }, 3000);
                                break;

                            case NotificationVO.TECH_LOGGED_AND_REDIRECT:

                                // On teste de supprimer les délais pour éviter les appels à des méthodes qui ne sont plus accessibles typiquement lors d'un impersonate...
                                // let content_user_logged = LocaleManager.i18n.t('PushDataServerController.user_logged.___LABEL___');
                                // VueAppBaseInstanceHolder.instance.vueInstance.snotify.success(content_user_logged, {
                                //     timeout: 3000
                                // });
                                // setTimeout(() => {
                                ConsoleHandler.log('NotificationVO.TECH_LOGGED_AND_REDIRECT:redirect_uri:' + notification.redirect_uri);
                                location.href = notification.redirect_uri ? notification.redirect_uri : '/';
                                // }, 3000);
                                break;

                            case NotificationVO.TECH_RELOAD:
                                const content_reload = LocaleManager.i18n.t('PushDataServerController.reload.___LABEL___');
                                VueAppBaseInstanceHolder.instance.vueInstance.snotify.warning(content_reload, {
                                    timeout: 3000,
                                });
                                setTimeout(() => {
                                    window.location.reload();
                                }, 3000);
                                break;
                            case NotificationVO.TECH_SCREENSHOT:
                                if (vo.gpt_assistant_id == null || vo.gpt_assistant_id == undefined) {
                                    ConsoleHandler.error('No gpt_assistant_id');
                                    return;
                                }
                                if (!vo.gpt_thread_id || vo.gpt_thread_id == null || vo.gpt_thread_id == undefined) {
                                    ConsoleHandler.error('No gpt_thread_id');
                                    return;
                                }
                                const screenshot_content = LocaleManager.i18n.t("oselia.screenshot.notify.___LABEL___");
                                VueAppBaseInstanceHolder.instance.vueInstance.snotify.info(screenshot_content, {
                                    timeout: 3000,
                                });
                                setTimeout(async () => {
                                    const { imgData, new_file, fileName } = await OseliaController.do_take_screenshot();
                                    if (!imgData) {
                                        return;
                                    }
                                    if (!imgData) {
                                        ConsoleHandler.error('No imgData');
                                        return;
                                    }

                                    const formData = new FormData();
                                    formData.append('file', imgData, fileName);
                                    formData.append("originalFilename", fileName);

                                    const res = await AjaxCacheClientController.getInstance().post(
                                        null,
                                        '/ModuleFileServer/upload',
                                        [FileVO.API_TYPE_ID],
                                        formData,
                                        null,
                                        null,
                                        false,
                                        30000);

                                    if (!res) {
                                        return;
                                    }

                                    const message = "Voici le screenshot que tu m'as demandé!";
                                    ModuleGPT.getInstance().ask_assistant(
                                        vo.gpt_assistant_id,
                                        vo.gpt_thread_id,
                                        null,
                                        message,
                                        [new_file],
                                        VueAppController.getInstance().data_user.id,
                                        true
                                    );
                                }, 3000);

                            default:
                                break;
                        }
                    }
                }
            }
        }
    }
}
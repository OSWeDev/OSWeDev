import { io } from "socket.io-client";
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import ContextQueryVO from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import VueAppBase from '../../../VueAppBase';
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';
import VarsClientController from '../../components/Var/VarsClientController';
import VueModuleBase from '../VueModuleBase';
import ModuleLogMonitoring from '../../../../shared/modules/LogMonitoring/ModuleLogMonitoring';
import LogVO from "../../../../shared/modules/LogMonitoring/vos/LogVO";

export default class LogMonitoringVueModule extends VueModuleBase {

    public static getInstance(): LogMonitoringVueModule {
        if (!LogMonitoringVueModule.instance) {
            LogMonitoringVueModule.instance = new LogMonitoringVueModule();
        }

        return LogMonitoringVueModule.instance;
    }

    private static instance: LogMonitoringVueModule = null;

    public server_log_rows_callback: (log_rows: LogVO[]) => void = null; // Logs callback to initialize and handle the logs rows

    protected socket;

    private constructor() {
        super(ModuleLogMonitoring.getInstance().name);
    }

    public initialize() {
        let self = this;
        let first = true;

        // Maybe we should have a single instance of socket for the whole frontend
        this.socket = io({
            transportOptions: {
                polling: {
                    extraHeaders: {
                        client_tab_id: AjaxCacheClientController.getInstance().client_tab_id
                    }
                }
            }
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
                }, 10000);
            }
        });

        this.socket.on('reconnect', () => {
            setTimeout(async () => {
                await self.check_version_app();
            }, 1);

            setTimeout(async () => {
                await VarsClientController.getInstance().registerAllParamsAgain();
            }, 10000);
        });
    }

    /**
     * apply_query_filters
     *
     * @param {ContextQueryVO} context_query
     * @returns {void}
     */
    public apply_query_filters(context_query: ContextQueryVO): void {
        if (!context_query) {
            return;
        }

        if (!context_query.filters) {
            context_query.filters = [];
        }

        // Apply the filters from the active field filters
        this.socket.emit(ModuleLogMonitoring.SOCKET_APINAME_client_logs_query, context_query);
    }

    /**
     * apply_socket_subscriptions
     *
     * @returns {void}
     */
    public apply_socket_subscriptions(
        callback: (items: LogVO[], total_count: number) => void
    ): void {
        // Subscribe to the logs rows socket api
        this.socket.on(ModuleLogMonitoring.SOCKET_APINAME_server_logs_rows, async (data: { items: LogVO[], total_count: number }) => {
            if (typeof callback == 'function') {
                // Send the new logs to the client
                callback(data.items, data.total_count);
            }
        });
    }

    /**
     * check_version_app
     *
     * @returns {Promise<void>} Si on a pas la même version entre le front et le back, on recharge la page
     */
    private async check_version_app(): Promise<void> {
        let server_app_version: string = await ModulePushData.getInstance().get_app_version();

        if (server_app_version && (EnvHandler.VERSION != server_app_version)) {

            /**
             * Cas du dev local, on checke le timestamp server vs local, si le local est plus récent inutile de recharger
             */
            const server_app_version_timestamp_str: string = server_app_version.split('-')[1];
            const server_app_version_timestamp: number = server_app_version_timestamp_str?.length ? parseInt(server_app_version_timestamp_str) : null;

            const local_app_version_timestamp_str: string = EnvHandler.VERSION.split('-')[1];
            const local_app_version_timestamp: number = local_app_version_timestamp_str?.length ? parseInt(local_app_version_timestamp_str) : null;

            if (server_app_version_timestamp && local_app_version_timestamp && (local_app_version_timestamp > server_app_version_timestamp)) {
                return;
            }

            if (VueAppBase.instance_.vueInstance && VueAppBase.instance_.vueInstance.snotify) {
                VueAppBase.instance_.vueInstance.snotify.warning(
                    VueAppBase.instance_.vueInstance.label("app_version_changed"),
                    { timeout: 3000 }
                );
            }

            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

}
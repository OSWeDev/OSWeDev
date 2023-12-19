import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import IServerUserSession from "../../../shared/modules/AccessPolicy/vos/IServerUserSession";
import ModuleLogMonitoring from "../../../shared/modules/LogMonitoring/ModuleLogMonitoring";
import FileVO from "../../../shared/modules/LogMonitoring/vos/FileVO";
import LogVO from "../../../shared/modules/LogMonitoring/vos/LogVO";
import StackContext from "../../StackContext";
import ModuleServerBase from "../ModuleServerBase";
import ModuleLogMonitoringController from "./ModuleLogMonitoringController";
import LogFileScraperService from "./service/LogFileScraperService";
import LogSocketController from "./socket-controller/LogSocketController";

export default class ModuleLogMonitoringServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleLogMonitoringServer.instance) {
            ModuleLogMonitoringServer.instance = new ModuleLogMonitoringServer();
        }

        return ModuleLogMonitoringServer.instance;
    }

    private static instance: ModuleLogMonitoringServer = null;

    private constructor() {
        super(ModuleLogMonitoring.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleLogMonitoring.APINAME_query_log_files, this.query_log_files.bind(this));
    }

    /**
     * initialize
     *
     * @returns {Promise<void>}
     */
    public initialize(): void {
        // TODO: get user_id and client_tab_id (from the socket session)
        let session: IServerUserSession = StackContext.get('SESSION');

        // Subscribing to the log file changes (if any selected filename from the client)
        LogSocketController.getInstance().subscribe_to_logs_changes(async (items: LogVO[], total_count: number) => {
            // Send the new logs to the client
            ModuleLogMonitoringController.getInstance().send_logs_through_socket({
                user_id: session?.uid ?? null,
                client_tab_id: null,
                data: {
                    items,
                    total_count
                }
            });
        });
    }

    /**
     * query_log_files
     *
     * @returns {Promise<FileVO[]>}
     */
    private async query_log_files(): Promise<FileVO[]> {
        return await LogFileScraperService.getInstance().read_logs_directory();
    }
}
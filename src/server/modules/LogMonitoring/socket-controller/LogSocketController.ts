import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import LogVO from "../../../../shared/modules/LogMonitoring/vos/LogVO";
import LogFileScraperService from "../service/LogFileScraperService";

/**
 * LogSocketController
 * - Socket controller for log monitoring
 * - Real time log monitoring (logs are sent to the client as soon - 500ms as they are written)
 *
 * @class LogSocketController
 */
export default class LogSocketController {

    public static getInstance(): LogSocketController {
        if (!LogSocketController.instance) {
            LogSocketController.instance = new LogSocketController();
        }

        return LogSocketController.instance;
    }

    private static instance: LogSocketController = null;

    private _context_query: ContextQueryVO = null; // May change over time (client can change the context, filter, pagination, etc.)

    private constructor() { }

    /**
     * init
     * - Initialize the socket controller
     * - Should be called only once
     * - Subcribe to the log file changes and send the new logs to the client
     *
     * @param {(logs: LogVO[]) => void} callback
     * @returns {Promise<void>}
     */
    public async subscribe_to_logs_changes(
        callback: (items: LogVO[], total_count: number) => void
    ): Promise<void> {
        // Subscribe to the log file changes
        LogFileScraperService.getInstance().subscribe_to_file_changes(this._context_query, async (items: LogVO[], total_count: number) => {
            if (typeof callback == 'function') {
                // Send the new logs to the client
                callback(items, total_count);
            }
        });
    }

    /**
     * subscribe_to_context_query_changes
     * - Subscribe to the context query changes
     * - When the context query changes, we need to reapply the context query to the log file
     * - The log file will be scraped again and the new logs will be sent to the client
     *
     * @param context_query
     * @returns {Promise<void>}
     */
    public async subscribe_to_context_query_changes(context_query: ContextQueryVO): Promise<void> {
        this._context_query = context_query;
    }

}
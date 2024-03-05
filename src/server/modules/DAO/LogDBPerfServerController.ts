import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ConfigurationService from "../../env/ConfigurationService";

export default class LogDBPerfServerController {

    public static log_db_query_perf_start(method_name: string, query_string: string = null, step_name: string = null): number {
        if (ConfigurationService.node_configuration.debug_db_query_perf) {
            const uid = LogDBPerfServerController.log_db_query_perf_uid++;
            LogDBPerfServerController.log_db_query_perf_start_by_uid[uid] = Dates.now_ms();
            const query_s = (query_string ? (ConfigurationService.node_configuration.debug_db_full_query_perf ? query_string : query_string.substring(0, 1000)) : 'N/A');
            // query_s = (query_s ? query_s.replace(/;/g, '') : 'N/A');
            ConsoleHandler.log('log_db_query_perf_start;;ModuleDAOServer;IN;' + uid + ';' + LogDBPerfServerController.log_db_query_perf_start_by_uid[uid] + ';0;' + method_name +
                ';' + (step_name ? step_name : 'N/A') +
                ';' + query_s);
            return uid;
        }

        return null;
    }

    public static log_db_query_perf_end(uid: number, method_name: string, query_string: string = null, step_name: string = null) {
        if (ConfigurationService.node_configuration.debug_db_query_perf && !!LogDBPerfServerController.log_db_query_perf_start_by_uid[uid]) {
            const end_ms = Dates.now_ms();
            const duration = Math.round(end_ms - LogDBPerfServerController.log_db_query_perf_start_by_uid[uid]);
            const query_s = (query_string ? (ConfigurationService.node_configuration.debug_db_full_query_perf ? query_string : query_string.substring(0, 1000)) : 'N/A');
            // query_s = (query_s ? query_s.replace(/;/g, '') : 'N/A');

            if (ConfigurationService.node_configuration.debug_slow_queries &&
                (duration > (10 * ConfigurationService.node_configuration.debug_slow_queries_ms_limit))) {
                ConsoleHandler.error('log_db_query_perf_end;VERYSLOW;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_string);
            } else if (ConfigurationService.node_configuration.debug_slow_queries &&
                (duration > ConfigurationService.node_configuration.debug_slow_queries_ms_limit)) {
                ConsoleHandler.warn('log_db_query_perf_end;SLOW;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_string);
            } else {
                ConsoleHandler.log('log_db_query_perf_end;;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_s);
            }
        }
    }

    private static log_db_query_perf_start_by_uid: { [uid: number]: number } = {};
    private static log_db_query_perf_uid: number = 0;
}
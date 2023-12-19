import ContextFilterVO from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import FileVO from "../../../../shared/modules/LogMonitoring/vos/FileVO";
import LogVO from "../../../../shared/modules/LogMonitoring/vos/LogVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import FileServerController from "../../File/FileServerController";
import fs from 'fs';

/**
 * LogFileScraperService
 * - Should be able to get the list of files to parse
 * - Should be able to parse a file
 * - Should be able to parse a line and return a LogVO
 */
export default class LogFileScraperService {


    public static getInstance(): LogFileScraperService {
        if (!LogFileScraperService.instance) {
            LogFileScraperService.instance = new LogFileScraperService();
        }

        return LogFileScraperService.instance;
    }

    private static instance: LogFileScraperService = null;

    private constructor() { }

    public async getFiles(): Promise<string[]> {
        return [];
    }

    /**
     * read_file
     * - Read the file content and return the list of logs
     * - The file content should be parsed line by line
     * - Each line should be parsed and converted to a LogVO
     * - return the last log line
     *
     * TODO: filter logs by context query (date, log level, message content, etc.)
     *
     * @param {string} file_content
     * @returns {Promise<{ items: LogVO[], total_count: number }>
     */
    public async read_file(file_content: string, context_query: ContextQueryVO): Promise<{ items: LogVO[], total_count: number }> {

        file_content = file_content ?? '';

        const lines = file_content.split('\n');

        let log_tmp: LogVO & { is_complete?: boolean } = new LogVO();
        let logs: LogVO[] = [];

        for (let i in lines) {
            const line = lines[i];
            const next_line = lines[parseInt(i) + 1];

            // Parse the line
            const log = await this.parse_line(log_tmp, line);

            // Check if the line is a complete log line (that mean the next line should start with a log level label or EOF)
            // If the line is not a complete log line, we should consider it as a continuation of the previous line
            if (next_line?.match(/^(DEBUG|INFO|WARN|ERROR|FATAL)/) || next_line == '' || next_line == null) {
                logs.push(log);
                log_tmp = new LogVO();
            }
        }

        const offset = context_query?.query_offset ?? 0;
        const limit = context_query?.query_limit ?? 20;

        logs = logs
            .reverse() // Reverse the logs to get the last logs first
            .slice(offset, offset + limit);

        return {
            items: logs,
            total_count: logs.length
        };
    }

    /**
     * parseLine
     *  - One log line should always start with a log level label (DEBUG, INFO, WARN, ERROR, FATAL)
     *  - If the line does not start with a log level label, it should be considered as a continuation of the previous log line
     * @param {string} line
     */
    public async parse_line(log: LogVO, line: string): Promise<LogVO> {
        if (!log) {
            log = new LogVO();
            log.message = '';
        }

        const with_level_rgx = /^(?<level>\w+) -- (?<file_id>\d+):(?<date>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) - (?<message>.*)/;
        const message_rgx = /(?<message>.*)/;

        const with_level_match = line.match(with_level_rgx);
        const message_match = line.match(message_rgx);

        if (with_level_match) {
            log.level = with_level_match.groups.level;
            log.date = new Date(with_level_match.groups.date).getTime();
            log.message = with_level_match.groups.message;
        } else if (message_match) {
            log.message += message_match.groups.message;
        }

        return log;
    }

    /**
     * subscribe_to_file_changes
     * - Subscribe to the file changes
     * - When a file changes, we need to reapply the context query to the log file
     * - The log file will be scraped again and the new logs will be sent to the client
     *
     * @param {ContextQueryVO} context_query
     * @param {(logs: LogVO[]) => void} callback
     */
    public async subscribe_to_file_changes(
        context_query: ContextQueryVO,
        callback: (items: LogVO[], total_count: number) => void
    ) {
        const directory_path: string = './nodes_logs';

        // Find filenames from the context query
        let filename: string = context_query?.filters?.find(
            (filter: ContextFilterVO) => filter.field_id == field_names<FileVO>().filename
        )?.param_text;

        // Find the last file from the logs directory
        if (!filename) {
            const files = await this.read_logs_directory();

            const sortedFiles = files?.sort((a, b) => {
                return b?.updated_at - a?.updated_at;
            });

            const last_file = (sortedFiles?.length > 0) ? sortedFiles[0] : null;

            filename = last_file?.filename ?? 'dummy_filepath';
        }

        // Find a way to filter logs by content text
        const file_path: string = directory_path + '/' + filename;

        FileServerController.getInstance().watchFile(
            file_path,
            async (curr: fs.Stats, prev: fs.Stats) => {
                if (curr?.mtime?.getTime() != prev?.mtime?.getTime()) {
                    const file_content = await FileServerController.getInstance().readFile(file_path, false);

                    const data = await this.read_file(
                        file_content,
                        context_query
                    );

                    // if isset callback - send data to the callback
                    if (typeof callback == 'function') {
                        callback(data?.items, data?.total_count);
                    }
                }
            },
            500 // 500ms interval
        );
    }

    /**
     * read_logs_directory
     * - Read the logs directory and return the list of log files
     *
     * @returns {Promise<string[]>} a promise that resolves with the list of log files
     */
    public async read_logs_directory(): Promise<FileVO[]> {
        const directory_path: string = './nodes_logs';

        const files = await FileServerController.getInstance().readdir(
            directory_path
        );

        const log_files = await Promise.all(files?.map(async (filename) => {
            const file_stats = await FileServerController.getInstance().fileStat(
                directory_path + '/' + filename
            );

            return new FileVO().from({
                path: directory_path + '/' + filename,
                filename: filename,
                size: file_stats?.size,
                created_at: file_stats?.birthtime.getTime(),
                updated_at: file_stats?.mtime.getTime(),
            });
        })) ?? [];

        return log_files;
    }
}
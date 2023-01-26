/* istanbul ignore file: not a usefull test to write */

import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import ILoggerHandler from './interfaces/ILoggerHandler';

export default class ConsoleHandler {

    public static SEPARATOR: string = ' - ';

    public static logger_handler: ILoggerHandler = null;

    public static init() {
        ConsoleHandler.old_console_log = console.log;
        console.log = function (msg, ...params) {
            ConsoleHandler.log(msg, ...params);
        };

        ConsoleHandler.old_console_warn = console.warn;
        console.warn = function (msg, ...params) {
            ConsoleHandler.warn(msg, ...params);
        };

        ConsoleHandler.old_console_error = console.error;
        console.error = function (msg, ...params) {
            ConsoleHandler.error(msg, ...params);
        };
    }

    public static error(error: string | Error, ...params): void {

        let msg = ConsoleHandler.get_text_msg(error);

        if (!!ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("ERROR -- " + msg, ...params);
        }
        ConsoleHandler.old_console_error(msg, ...params);
    }

    public static warn(error: string | Error, ...params): void {
        let msg = ConsoleHandler.get_text_msg(error);

        if (!!ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("WARN  -- " + msg, ...params);
        }
        ConsoleHandler.old_console_warn(msg, ...params);
    }

    public static log(error: string | Error, ...params): void {
        let msg = ConsoleHandler.get_text_msg(error);

        if (!!ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("DEBUG -- " + msg, ...params);
        }
        ConsoleHandler.old_console_log(msg, ...params);
    }

    private static old_console_log: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_warn: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_error: (message?: any, ...optionalParams: any[]) => void = null;

    private static get_text_msg(error: string | Error): string {
        return ((process && process.pid) ? process.pid + ':' : '') + ConsoleHandler.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? ((error as Error).message ? ((error as Error).message + ':' + (error as Error).stack) : error) : error);
    }

    private static get_timestamp(): string {
        let ms = Math.floor(Dates.now_ms());
        let seconds = Math.floor(ms / 1000);
        ms = ms % 1000;
        return Dates.format(seconds, 'YYYY-MM-DD HH:mm:ss.' + String(ms).padStart(3, '0'), true);
    }
}
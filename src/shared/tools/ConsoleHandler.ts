/* istanbul ignore file: not a usefull test to write */

import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import ThrottleHelper from './ThrottleHelper';
import ILoggerHandler from './interfaces/ILoggerHandler';

export default class ConsoleHandler {

    public static SEPARATOR: string = ' - ';

    public static logger_handler: ILoggerHandler = null;

    public static init() {

        if (!!ConsoleHandler.old_console_log) {
            return;
        }

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
            // On ERROR we flush immediately
            ConsoleHandler.logger_handler.force_flush();
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'error' });
        // On ERROR we flush immediately
        ConsoleHandler.log_to_console();
    }

    public static warn(error: string | Error, ...params): void {
        let msg = ConsoleHandler.get_text_msg(error);

        if (!!ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("WARN  -- " + msg, ...params);
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'warn' });
        ConsoleHandler.log_to_console_throttler();
    }

    public static log(error: string | Error, ...params): void {
        let msg = ConsoleHandler.get_text_msg(error);

        if (!!ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("DEBUG -- " + msg, ...params);
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'log' });
        ConsoleHandler.log_to_console_throttler();
    }

    private static old_console_log: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_warn: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_error: (message?: any, ...optionalParams: any[]) => void = null;

    private static log_to_console_cache: Array<{ msg: string, params: any[], log_type: string }> = [];
    private static log_to_console_throttler = ThrottleHelper.declare_throttle_without_args(this.log_to_console.bind(this), 1000);

    // On throttle pour laisser du temps de calcul, et on indique l'heure d'exécution du throttle pour bien identifier le décalage de temps lié au throttle et la durée de loggage sur la console pour le pack.
    private static log_to_console() {
        let log_to_console = ConsoleHandler.log_to_console_cache;
        ConsoleHandler.log_to_console_cache = [];

        for (let i in log_to_console) {
            let log = log_to_console[i];

            ConsoleHandler['old_console_' + log.log_type]('[LT ' + this.get_timestamp() + '] ' + log.msg, ...log.params);
        }
    }

    private static get_text_msg(error: string | Error): string {
        return (((typeof process !== "undefined") && process.pid) ? process.pid + ':' : '') + ConsoleHandler.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? ((error as Error).message ? ((error as Error).message + ':' + (error as Error).stack) : error) : error);
    }

    private static get_timestamp(): string {
        let ms = Math.floor(Dates.now_ms());
        let seconds = Math.floor(ms / 1000);
        ms = ms % 1000;
        return Dates.format(seconds, 'YYYY-MM-DD HH:mm:ss.' + String(ms).padStart(3, '0'), true);
    }
}
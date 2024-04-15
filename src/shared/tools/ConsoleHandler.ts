/* istanbul ignore file: not a usefull test to write */

import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import ThrottleHelper from './ThrottleHelper';
import ILoggerHandler from './interfaces/ILoggerHandler';

// DO NOT DELETE : USED to debug Promises when there are multiple resolves =>
// Can be used also to debug never ending promises
// class MonitoredPromise<T> extends Promise<T> {
//     constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
//         let hasSettled = false;
//         // Capture la stacktrace lors de la création de la promesse
//         const stackTrace = new Error("Promise created at:").stack;

//         setTimeout(() => {
//             if (!hasSettled) {
//                 ConsoleHandler.error("Promise not settled after 181s", stackTrace);
//             }
//         }, 181000);

//         const wrappedExecutor: typeof executor = (resolve, reject) => {
//             function monitoredResolve(value: T | PromiseLike<T>) {
//                 if (hasSettled) {
//                     emitMultipleResolves("resolved", stackTrace);
//                     return;
//                 }
//                 hasSettled = true;
//                 resolve(value);
//             }

//             function monitoredReject(reason: any) {
//                 if (hasSettled) {
//                     emitMultipleResolves("rejected", stackTrace);
//                     return;
//                 }
//                 hasSettled = true;
//                 reject(reason);
//             }

//             executor(monitoredResolve, monitoredReject);
//         };

//         super(wrappedExecutor);
//     }
// }

// function emitMultipleResolves(action: string, stackTrace) {
//     console.error(`MultipleResolvesError: A promise was already ${action} and was attempted to be ${action} again.`, stackTrace);
//     // Vous pouvez également émettre un événement ou effectuer d'autres actions si nécessaire
// }

// <= DO NOT DELETE - including next line : USED to debug Promises when there are multiple resolves
// tslint:disable-next-line: max-classes-per-file
export default class ConsoleHandler {

    public static SEPARATOR: string = ' - ';

    public static logger_handler: ILoggerHandler = null;

    private static old_console_log: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_warn: (message?: any, ...optionalParams: any[]) => void = null;
    private static old_console_error: (message?: any, ...optionalParams: any[]) => void = null;

    private static log_to_console_cache: Array<{ msg: string, params: any[], log_type: string }> = [];
    private static log_to_console_throttler = ThrottleHelper.declare_throttle_without_args(this.log_to_console.bind(this), 1000);

    private static throttled_logs_counter: { [log: string]: number } = {};

    public static init() {

        if (ConsoleHandler.old_console_log) {
            return;
        }

        // DO NOT DELETE : USED to debug Promises when there are multiple resolves =>
        // (global as any).Promise = MonitoredPromise;
        // <= DO NOT DELETE : USED to debug Promises when there are multiple resolves

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

        const msg = ConsoleHandler.get_text_msg(error);

        if (ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("ERROR -- " + msg, ...params);
            // On ERROR we flush immediately
            ConsoleHandler.logger_handler.force_flush();
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'error' });
        // On ERROR we flush immediately
        ConsoleHandler.log_to_console();
    }

    public static warn(error: string | Error, ...params): void {
        const msg = ConsoleHandler.get_text_msg(error);

        if (ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("WARN  -- " + msg, ...params);
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'warn' });
        ConsoleHandler.log_to_console_throttler();
    }

    public static log(error: string | Error, ...params): void {
        const msg = ConsoleHandler.get_text_msg(error);

        if (ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log("DEBUG -- " + msg, ...params);
        }
        ConsoleHandler.log_to_console_cache.push({ msg: msg, params: params, log_type: 'log' });
        ConsoleHandler.log_to_console_throttler();
    }

    public static throttle_log(log: string): void {
        if (!this.throttled_logs_counter[log]) {
            this.throttled_logs_counter[log] = 0;
        }
        this.throttled_logs_counter[log]++;
        ConsoleHandler.log_to_console_throttler();
    }

    // On throttle pour laisser du temps de calcul, et on indique l'heure d'exécution du throttle pour bien identifier le décalage de temps lié au throttle et la durée de loggage sur la console pour le pack.
    private static log_to_console() {
        const log_to_console = ConsoleHandler.log_to_console_cache;
        ConsoleHandler.log_to_console_cache = [];

        for (const i in log_to_console) {
            const log = log_to_console[i];

            ConsoleHandler['old_console_' + log.log_type]('[LT ' + this.get_timestamp() + '] ' + log.msg, ...log.params);
        }

        // On ajoute aussi les logs throttled
        const throttled_logs_counter = this.throttled_logs_counter;
        this.throttled_logs_counter = {};
        for (const log in throttled_logs_counter) {
            const msg = ConsoleHandler.get_text_msg(log);
            ConsoleHandler.old_console_log('[LT ' + this.get_timestamp() + '] ' + msg + ' (' + throttled_logs_counter[log] + 'x)');

            if (ConsoleHandler.logger_handler) {
                ConsoleHandler.logger_handler.log("DEBUG -- " + msg + ' (' + throttled_logs_counter[log] + 'x)');
            }
        }
    }

    private static get_text_msg(error: string | Error): string {
        return (((typeof process !== "undefined") && process.pid) ? process.pid + ':' : '') + ConsoleHandler.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? ((error as Error).message ? ((error as Error).message + ':' + (error as Error).stack) : error) : error);
    }

    private static get_timestamp(): string {
        let ms = Math.floor(Dates.now_ms());
        const seconds = Math.floor(ms / 1000);
        ms = ms % 1000;
        return Dates.format(seconds, 'YYYY-MM-DD HH:mm:ss.' + String(ms).padStart(3, '0'), true);
    }
}
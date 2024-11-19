/* istanbul ignore file: not a usefull test to write */

import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import ModuleLogger from '../modules/Logger/ModuleLogger';
import LogVO from '../modules/Logger/vos/LogVO';
import ModulesManager from '../modules/ModulesManager';
import ParamsManager from '../modules/Params/ParamsManager';
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
    private static old_console_debug: (message?: any, ...optionalParams: any[]) => void = null;

    private static log_to_console_cache: Array<{ msg: string, date: number, params: any[], log_type: number, url: string }> = [];
    private static log_to_console_throttler = ThrottleHelper.declare_throttle_without_args(this.log_to_console.bind(this), 1000);
    private static add_logs_client_throttler = ThrottleHelper.declare_throttle_without_args(this.add_logs_client.bind(this), 1000, { leading: false, trailing: true });

    private static throttled_logs_counter: { [log: string]: number } = {};
    private static throttled_add_logs_client: LogVO[] = [];

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

        ConsoleHandler.old_console_debug = console.debug;
        console.debug = function (msg, ...params) {
            ConsoleHandler.debug(msg, ...params);
        };
    }

    public static error(error: string | Error, ...params): void {
        ConsoleHandler.log_action(ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR), error, ...params);
    }

    public static warn(error: string | Error, ...params): void {
        ConsoleHandler.log_action(ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN), error, ...params);
    }

    public static log(error: string | Error, ...params): void {
        ConsoleHandler.log_action(ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG), error, ...params);
    }

    public static debug(error: string | Error, ...params): void {
        ConsoleHandler.log_action(ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG), error, ...params);
    }

    public static log_action(log_type: number, error: string | Error, ...params): void {
        const msg = ConsoleHandler.get_text_msg(error);
        const date: number = ConsoleHandler.get_timestamp(Dates.now_ms());

        let url: string = null;

        if (ConsoleHandler.logger_handler) {
            ConsoleHandler.logger_handler.log(log_type, date, msg, ...params);

            if (log_type == ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR)) {
                // On ERROR we flush immediately
                ConsoleHandler.logger_handler.force_flush();
            }
        } else {
            // On est côté client, on récupère l'url
            if (!ModulesManager.isGenerator && !ModulesManager.isServerSide && !ModulesManager.isTest) {
                if ((typeof document != "undefined") && !!document?.location?.href && !!document?.location?.origin) {
                    url = document.location.href.replace(document.location.origin, '');
                }
            }
        }

        ConsoleHandler.log_to_console_cache.push({ msg: msg, date: date, params: params, log_type: log_type, url: url });

        if (log_type == ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR)) {
            // On ERROR we flush immediately
            ConsoleHandler.log_to_console();
        } else {
            ConsoleHandler.log_to_console_throttler();
        }
    }

    public static throttle_log(log: string): void {
        if (!this.throttled_logs_counter[log]) {
            this.throttled_logs_counter[log] = 0;
        }
        this.throttled_logs_counter[log]++;
        ConsoleHandler.log_to_console_throttler();
    }

    public static get_timestamp(date: number): number {
        return Math.floor(date);
    }

    public static get_formatted_timestamp(date: number): string {
        return Dates.format_segment(date, TimeSegment.TYPE_MS, true);
    }

    // On throttle pour laisser du temps de calcul, et on indique l'heure d'exécution du throttle pour bien identifier le décalage de temps lié au throttle et la durée de loggage sur la console pour le pack.
    private static log_to_console() {
        const log_to_console = ConsoleHandler.log_to_console_cache;
        ConsoleHandler.log_to_console_cache = [];

        const logs: LogVO[] = [];

        for (const i in log_to_console) {
            const log = log_to_console[i];

            let msg: string = log.msg;

            for (const j in log.params) {
                msg = msg.replace(/$[Oo]/, log.params[j]);
            }

            if (!msg) {
                continue;
            }

            const log_type_id: number = log.log_type ?? ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG);

            // On va vérifier quel niveau min on doit log
            if (log_type_id <= ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_CLIENT_MAX)) {
                logs.push(LogVO.createNew(
                    (((typeof process !== "undefined") && process.pid) ? process.pid : null),
                    log_type_id,
                    log.date,
                    msg,
                    null,
                    null,
                    log.url,
                ));
            }

            let log_type_str: string = 'log';

            switch (log.log_type) {
                case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR):
                    log_type_str = 'error';
                    break;
                case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN):
                    log_type_str = 'warn';
                    break;
                case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG):
                case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG):
                    log_type_str = 'log';
                    break;
            }

            ConsoleHandler['old_console_' + log_type_str]('[' + log_type_str.toUpperCase() + ' ' + this.get_formatted_timestamp(log.date) + '] ' + log.msg, ...log.params);
        }

        // On ne log pas les logs du generator en BDD, sinon ça plante car tout n'est pas initialisé
        if (!ModulesManager.isGenerator && !ModulesManager.isServerSide && !ModulesManager.isTest && !ConsoleHandler.logger_handler && logs?.length) {
            // Je suis côté client, je vais enregistrer en BDD
            this.throttled_add_logs_client.push(...logs);
            this.add_logs_client_throttler();
        }

        // On ajoute aussi les logs throttled
        const throttled_logs_counter = this.throttled_logs_counter;
        this.throttled_logs_counter = {};
        for (const log in throttled_logs_counter) {
            const msg = ConsoleHandler.get_text_msg(log);
            const date: number = this.get_timestamp(Dates.now_ms());
            ConsoleHandler.old_console_log('[LT ' + this.get_formatted_timestamp(date) + '] ' + msg + ' (' + throttled_logs_counter[log] + 'x)');

            if (ConsoleHandler.logger_handler) {
                ConsoleHandler.logger_handler.log(ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG), date, msg + ' (' + throttled_logs_counter[log] + 'x)');
            }
        }
    }

    private static async add_logs_client() {
        const logs = this.throttled_add_logs_client;
        this.throttled_add_logs_client = [];

        await ModuleLogger.getInstance().addLogsClient(logs);
    }

    private static get_text_msg(error: string | Error): string {
        return (error ? ((error as Error).message ? ((error as Error).message + ':' + (error as Error).stack) : error?.toString()) : error?.toString());
    }
}
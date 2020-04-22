import * as moment from 'moment';
import ConsoleLog from './ConsoleLog';

export default class ConsoleLogLogger {

    public static getInstance(): ConsoleLogLogger {
        if (!ConsoleLogLogger.instance) {
            ConsoleLogLogger.instance = new ConsoleLogLogger();
        }
        return ConsoleLogLogger.instance;
    }

    private static instance: ConsoleLogLogger = null;

    public console_logs: ConsoleLog[] = [];

    // On met une limite en dur, à voir dans le temps mais c'est une sécurité pour éviter de détruire la mémoire du navigateur
    private limit: number = 101;

    private constructor() { }

    public prepare_console_logger() {

        let any_console = console as any;

        if (any_console.ConsoleLogLogger === undefined) {
            any_console.ConsoleLogLogger = 'initialized';

            any_console.defaultLog = any_console.log.bind(any_console);
            any_console.log = function () {
                if (ConsoleLogLogger.getInstance().console_logs.length >= ConsoleLogLogger.getInstance().limit) {
                    ConsoleLogLogger.getInstance().console_logs.shift();
                }
                ConsoleLogLogger.getInstance().console_logs.push(new ConsoleLog("log", moment().utc(true), Array.from(arguments)));
                any_console.defaultLog.apply(any_console, arguments);
            };
            any_console.defaultError = any_console.error.bind(any_console);
            any_console.error = function () {
                if (ConsoleLogLogger.getInstance().console_logs.length >= ConsoleLogLogger.getInstance().limit) {
                    ConsoleLogLogger.getInstance().console_logs.shift();
                }
                ConsoleLogLogger.getInstance().console_logs.push(new ConsoleLog("error", moment().utc(true), Array.from(arguments)));
                any_console.defaultError.apply(any_console, arguments);
            };
            any_console.defaultWarn = any_console.warn.bind(any_console);
            any_console.warn = function () {
                if (ConsoleLogLogger.getInstance().console_logs.length >= ConsoleLogLogger.getInstance().limit) {
                    ConsoleLogLogger.getInstance().console_logs.shift();
                }
                ConsoleLogLogger.getInstance().console_logs.push(new ConsoleLog("warn", moment().utc(true), Array.from(arguments)));
                any_console.defaultWarn.apply(any_console, arguments);
            };
            any_console.defaultDebug = any_console.debug.bind(any_console);
            any_console.debug = function () {
                if (ConsoleLogLogger.getInstance().console_logs.length >= ConsoleLogLogger.getInstance().limit) {
                    ConsoleLogLogger.getInstance().console_logs.shift();
                }
                ConsoleLogLogger.getInstance().console_logs.push(new ConsoleLog("debug", moment().utc(true), Array.from(arguments)));
                any_console.defaultDebug.apply(any_console, arguments);
            };
        }
    }
}


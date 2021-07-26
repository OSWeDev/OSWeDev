/* istanbul ignore file: not a usefull test to write */

import ILoggerHandler from './interfaces/ILoggerHandler';
const moment = require('moment');

export default class ConsoleHandler {

    public static SEPARATOR: string = ' - ';

    public static getInstance(): ConsoleHandler {
        if (!ConsoleHandler.instance) {
            ConsoleHandler.instance = new ConsoleHandler();
        }
        return ConsoleHandler.instance;
    }

    private static instance: ConsoleHandler = null;

    public logger_handler: ILoggerHandler = null;

    private old_console_log: (message?: any, ...optionalParams: any[]) => void = null;
    private old_console_warn: (message?: any, ...optionalParams: any[]) => void = null;
    private old_console_error: (message?: any, ...optionalParams: any[]) => void = null;

    private constructor() {
        this.old_console_log = console.log;
        console.log = function (msg, ...params) {
            ConsoleHandler.getInstance().log(msg, ...params);
        };

        this.old_console_warn = console.warn;
        console.warn = function (msg, ...params) {
            ConsoleHandler.getInstance().warn(msg, ...params);
        };

        this.old_console_error = console.error;
        console.error = function (msg, ...params) {
            ConsoleHandler.getInstance().error(msg, ...params);
        };
    }

    public error(error: string | Error, ...params): void {

        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("ERROR -- " + msg, ...params);
        }
        this.old_console_error(msg, ...params);
    }

    public warn(error: string | Error, ...params): void {
        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("WARN  -- " + msg, ...params);
        }
        this.old_console_warn(msg, ...params);
    }

    public log(error: string | Error, ...params): void {
        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("DEBUG -- " + msg, ...params);
        }
        this.old_console_log(msg, ...params);
    }

    private get_text_msg(error: string | Error): string {
        return ((process && process.pid) ? process.pid + ':' : '') + this.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? ((error as Error).message ? ((error as Error).message + ':' + (error as Error).stack) : error) : error);
    }

    private get_timestamp(): string {
        return moment().utc(true).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
}
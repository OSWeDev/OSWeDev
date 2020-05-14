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

    private constructor() { }

    public error(error: string | Error): void {

        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("ERROR -- " + msg);
        }
        console.error(msg);
    }

    public warn(error: string | Error): void {
        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("WARN  -- " + msg);
        }
        console.warn(msg);
    }

    public log(error: string | Error): void {
        let msg = this.get_text_msg(error);

        if (!!this.logger_handler) {
            this.logger_handler.log("DEBUG -- " + msg);
        }
        console.log(msg);
    }

    private get_text_msg(error: string | Error): string {
        return process.pid + ':' + this.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? (error as Error).message || error : error);
    }

    private get_timestamp(): string {
        return moment().utc(true).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
}
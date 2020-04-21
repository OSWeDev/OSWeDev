const moment = require('moment');

export default class ConsoleHandler {

    public static SEPARATOR: string = ' - ';

    /* istanbul ignore next: not a usefull test to write */
    public static getInstance(): ConsoleHandler {
        if (!ConsoleHandler.instance) {
            ConsoleHandler.instance = new ConsoleHandler();
        }
        return ConsoleHandler.instance;
    }

    private static instance: ConsoleHandler = null;

    private constructor() { }

    /* istanbul ignore next: not a usefull test to write */
    public error(error: string | Error): void {
        console.error(this.get_text_msg(error));
    }

    /* istanbul ignore next: not a usefull test to write */
    public warn(error: string | Error): void {
        console.warn(this.get_text_msg(error));
    }

    /* istanbul ignore next: not a usefull test to write */
    public log(error: string | Error): void {
        console.log(this.get_text_msg(error));
    }

    /* istanbul ignore next: not a usefull test to write */
    private get_text_msg(error: string | Error): string {
        return this.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? (error as Error).message || error : error);
    }

    /* istanbul ignore next: not a usefull test to write */
    private get_timestamp(): string {
        return moment().utc(true).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
}
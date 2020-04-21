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

    private constructor() {
    }

    public error(error: string | Error): void {
        /* istanbul ignore next: not a usefull test to write */
        console.error(this.get_text_msg(error));
    }

    public warn(error: string | Error): void {
        /* istanbul ignore next: not a usefull test to write */
        console.warn(this.get_text_msg(error));
    }

    public log(error: string | Error): void {
        /* istanbul ignore next: not a usefull test to write */
        console.log(this.get_text_msg(error));
    }

    private get_text_msg(error: string | Error): string {
        /* istanbul ignore next: not a usefull test to write */
        return this.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? (error as Error).message || error : error);
    }

    private get_timestamp(): string {
        /* istanbul ignore next: not a usefull test to write */
        return moment().utc(true).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
}
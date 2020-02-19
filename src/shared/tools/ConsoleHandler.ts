import moment = require('moment');

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
        console.error(this.get_text_msg(error));
    }

    public warn(error: string | Error): void {
        console.warn(this.get_text_msg(error));
    }

    public log(error: string | Error): void {
        console.log(this.get_text_msg(error));
    }

    private get_text_msg(error: string | Error): string {
        return this.get_timestamp() + ConsoleHandler.SEPARATOR + (error ? (error as Error).message || error : error);
    }

    private get_timestamp(): string {
        return moment().utc(true).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
}
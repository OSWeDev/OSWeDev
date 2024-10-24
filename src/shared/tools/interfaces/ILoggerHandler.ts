export default interface ILoggerHandler {
    log(log_type: number, date: number, msg: string, ...params);
    force_flush();
}
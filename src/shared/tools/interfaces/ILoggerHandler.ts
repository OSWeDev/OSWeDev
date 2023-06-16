export default interface ILoggerHandler {
    log(msg: string, ...params);
    force_flush();
}
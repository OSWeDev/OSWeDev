import IDistantVOBase from '../../IDistantVOBase';

export default class LogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "logger_log";

    public id: number;
    public _type: string = LogVO.API_TYPE_ID;

    public process_pid: number;
    public log_type_id: number;
    public date: number;
    public msg: string;
    public user_id: number;
    public client_tab_id: string;

    public static createNew(
        process_pid: number,
        log_type_id: number,
        date: number,
        msg: string,
        user_id: number,
        client_tab_id: string,
    ): LogVO {
        const res: LogVO = new LogVO();

        res.process_pid = process_pid;
        res.log_type_id = log_type_id;
        res.date = date;
        res.msg = msg;
        res.user_id = user_id;
        res.client_tab_id = client_tab_id;

        return res;
    }
}
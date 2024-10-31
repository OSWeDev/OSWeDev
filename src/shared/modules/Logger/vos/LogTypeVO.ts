import INamedVO from '../../../interfaces/INamedVO';

export default class LogTypeVO implements INamedVO {
    public static API_TYPE_ID: string = "logger_log_type";

    public id: number;
    public _type: string = LogTypeVO.API_TYPE_ID;

    public name: string;
    public priority: number;

    public static createNew(
        name: string,
        priority: number,
    ): LogTypeVO {
        const res: LogTypeVO = new LogTypeVO();

        res.name = name;
        res.priority = priority;

        return res;
    }
}
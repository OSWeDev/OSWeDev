
import INamedVO from '../../../../interfaces/INamedVO';

export default class ExportLogVO implements INamedVO {

    public static API_TYPE_ID: string = "export_log";

    public static createNew(
        name: string,
        log_time: number,
        user_id: number,
    ): ExportLogVO {
        const res = new ExportLogVO();

        res.name = name;
        res.log_time = log_time;
        res.user_id = user_id;

        return res;
    }

    public _type: string = ExportLogVO.API_TYPE_ID;

    public id: number;

    public name: string;
    public log_time: number;

    public user_id: number;
}
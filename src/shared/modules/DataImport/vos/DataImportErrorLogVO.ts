import IDistantVOBase from "../../IDistantVOBase";

export default class ImportLogsVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "logs";

    public static createNew(
        msg_import: string,
        dih_id: number,
    ): ImportLogsVO {
        let logs: ImportLogsVO = new ImportLogsVO();
        logs.msg_import = msg_import;
        logs.dih_id = dih_id;
        return logs;
    }

    public _type: string = ImportLogsVO.API_TYPE_ID;

    public id: number;

    public msg_import: string;
    public dih_id: number;
}
import IDistantVOBase from "../../IDistantVOBase";

export default class DataImportErrorLogVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "diel";

    public static createNew(
        msg_import: string,
        dih_id: number,
    ): DataImportErrorLogVO {
        let logs: DataImportErrorLogVO = new DataImportErrorLogVO();
        logs.msg_import = msg_import;
        logs.dih_id = dih_id;
        return logs;
    }

    public _type: string = DataImportErrorLogVO.API_TYPE_ID;

    public id: number;

    public msg_import: string;
    public dih_id: number;
}
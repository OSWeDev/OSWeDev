import IDistantVOBase from '../../IDistantVOBase';


export default class ExportHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "export_historic";

    public static EXPORT_STATE_LABELS: string[] = ['EXPORT.EXPORT_STATE.TODO', 'EXPORT.EXPORT_STATE.ERROR', 'EXPORT.EXPORT_STATE.DONE', 'EXPORT.EXPORT_STATE.RUNNING'];
    public static EXPORT_STATE_TODO: number = 0;
    public static EXPORT_STATE_ERROR: number = 1;
    public static EXPORT_STATE_DONE: number = 2;
    public static EXPORT_STATE_RUNNING: number = 3;

    public id: number;
    public _type: string = ExportHistoricVO.API_TYPE_ID;

    public export_type_id: string;

    public export_is_secured: boolean;
    public export_file_access_policy_name: string;

    public export_params_stringified: string;
    public export_to_uid: number;
    public export_to_mails: string[];
    public exported_file_id: number;
    public state: number;

    public creation_date: number;
    public start_date: number;
    public prepare_date: number;
    public export_date: number;
    public sent_date: number;
}
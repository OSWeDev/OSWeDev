import IDistantVOBase from "../../IDistantVOBase";

export default class ArchiveFilesConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "archive_files_conf";

    public static FILTER_TYPE_LABELS: string[] = ['archive_files_conf.FILTER_TYPE.YEAR', 'archive_files_conf.FILTER_TYPE.MONTH', 'archive_files_conf.FILTER_TYPE.DAY'];
    public static FILTER_TYPE_YEAR: number = 0;
    public static FILTER_TYPE_MONTH: number = 1;
    public static FILTER_TYPE_DAY: number = 2;

    public static USE_DATE_TYPE_LABELS: string[] = ['archive_files_conf.USE_DATE_TYPE.CREATION', 'archive_files_conf.USE_DATE_TYPE.UPDATE'];
    public static USE_DATE_TYPE_CREATION: number = 0;
    public static USE_DATE_TYPE_UPDATE: number = 1;

    public id: number;
    public _type: string = ArchiveFilesConfVO.API_TYPE_ID;

    public path_to_check: string;
    public target_achive_folder: string;
    public filter_type: number;

    /**
     * Archive the file if older than this delay (in seconds)
     */
    public archive_delay_sec: number;

    /**
     * Defines the date to use to build the archive folder
     */
    public use_date_type: number;
}
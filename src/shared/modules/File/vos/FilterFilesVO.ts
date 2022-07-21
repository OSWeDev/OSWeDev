import IDistantVOBase from "../../IDistantVOBase";

export default class FilterFilesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "filter_file";

    public static FILTER_TYPE_LABELS: string[] = ['filter_file.FILTER_TYPE.YEAR', 'filter_file.FILTER_TYPE.MONTH'];
    public static FILTER_TYPE_YEAR: number = 0;
    public static FILTER_TYPE_MONTH: number = 1;

    public id: number;
    public _type: string = FilterFilesVO.API_TYPE_ID;

    public path_to_check: string;
    public new_path_saved: string;
    public filter_type: number;
}
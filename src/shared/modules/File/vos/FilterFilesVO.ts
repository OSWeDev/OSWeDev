import IDistantVOBase from "../../IDistantVOBase";

export default class FilterFilesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "filter_file";

    public id: number;
    public _type: string = FilterFilesVO.API_TYPE_ID;

    public path_to_check: string;
    public new_path_saved: string;
    public filter: string;

}
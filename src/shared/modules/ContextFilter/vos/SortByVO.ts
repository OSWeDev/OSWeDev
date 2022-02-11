import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class SortByVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "sort_by";

    public id: number;
    public _type: string = SortByVO.API_TYPE_ID;

    public vo_type: string;
    public field_id: string;

    public sort_asc: boolean;

    public constructor(
        vo_type: string,
        field_id: string,
        sort_asc: boolean
    ) {
        this.vo_type = vo_type;
        this.field_id = field_id;
        this.sort_asc = sort_asc;
    }
}
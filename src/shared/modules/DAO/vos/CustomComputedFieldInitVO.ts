import IDistantVOBase from "../../IDistantVOBase";


export default class CustomComputedFieldInitVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "custom_computed_field_init";

    public static STATE_LABELS: string[] = [
        "CustomComputedFieldInitVO.STATE_TODO",
        "CustomComputedFieldInitVO.STATE_OK",
        "CustomComputedFieldInitVO.STATE_ERROR",
    ];
    public static STATE_TODO: number = 0;
    public static STATE_OK: number = 1;
    public static STATE_ERROR: number = 2;

    public id: number;
    public _type: string = CustomComputedFieldInitVO.API_TYPE_ID;

    public vo_type: string;
    public field_name: string;

    public next_offset: number;
    public next_limit: number;

    public state: number;
    public message: string;
}
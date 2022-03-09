import ICheckPoint from '../interfaces/ICheckPoint';

export default class CheckPointVO implements ICheckPoint {
    public static API_TYPE_ID: string = "checkpoint";

    public static STATE_DISABLED: number = 0;
    public static STATE_TODO: number = 1;
    public static STATE_ERROR: number = 2;
    public static STATE_WARN: number = 3;
    public static STATE_OK: number = 4;

    public id: number;
    public _type: string = CheckPointVO.API_TYPE_ID;

    public name: string;
    public explaination: string;
    public item_fields_tooltip: string;

    public checklist_id: number;

    public item_field_ids: string[];

    public weight: number;
}
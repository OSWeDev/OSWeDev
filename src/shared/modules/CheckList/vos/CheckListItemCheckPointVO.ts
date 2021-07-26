import ICheckListItemCheckPoints from '../interfaces/ICheckListItemCheckPoints';

export default class CheckListItemCheckPointVO implements ICheckListItemCheckPoints {
    public static API_TYPE_ID: string = "chcklst_itms_pnts";

    public id: number;
    public _type: string = CheckListItemCheckPointVO.API_TYPE_ID;

    public checklistitem_id: number;
    public checkpoint_id: number;
}
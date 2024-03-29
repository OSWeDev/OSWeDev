import ICheckList from '../interfaces/ICheckList';

export default class CheckListVO implements ICheckList {
    public static API_TYPE_ID: string = "checklist";

    public id: number;
    public _type: string = CheckListVO.API_TYPE_ID;

    public name: string;
    public limit_affichage: number;
    public hide_item_description: boolean;
    public show_legend: boolean;
    public show_finalized_btn: boolean;
}
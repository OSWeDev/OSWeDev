import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckListItemCheckPoints extends IDistantVOBase {
    checklistitem_id: number;
    checkpoint_id: number;
}
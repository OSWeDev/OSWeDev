import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckListItem extends IDistantVOBase {
    name: string;
    explaination: string;

    checklist_id: number;

    archived: boolean;
}
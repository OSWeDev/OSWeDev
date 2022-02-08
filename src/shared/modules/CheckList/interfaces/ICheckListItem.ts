import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default interface ICheckListItem extends IDistantVOBase, IVersionedVO {
    name: string;
    explaination: string;

    checklist_id: number;

    archived: boolean;
}
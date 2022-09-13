import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default interface ICheckListItem extends IVersionedVO {
    name: string;
    explaination: string;

    checklist_id: number;

    archived: boolean;

    finalized: boolean;
}
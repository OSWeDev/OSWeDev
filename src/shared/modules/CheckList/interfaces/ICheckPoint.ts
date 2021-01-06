import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckPoint extends IDistantVOBase {
    name: string;
    shortname: string;
    explaination: string;

    checklist_id: number;

    /**
     * Liste ordonnée des champs utiles à cette étape (en affichage et en édition)
     */
    item_field_ids: string[];

    weight: number;
}
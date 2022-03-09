import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckPoint extends IDistantVOBase {
    name: string;
    explaination: string;
    item_fields_tooltip: string;

    checklist_id: number;

    /**
     * Liste ordonnée des champs utiles à cette étape (en affichage et en édition)
     */
    item_field_ids: string[];

    weight: number;
}
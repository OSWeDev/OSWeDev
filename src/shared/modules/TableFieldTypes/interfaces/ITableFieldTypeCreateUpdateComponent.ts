import SimpleDatatableFieldVO from '../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Nécessite d'envoyer l'évènement @input lors du changement de contenu pour validation du champ
 */
export default interface ITableFieldTypeCreateUpdateComponent {
    vo: IDistantVOBase;
    field: SimpleDatatableFieldVO<any, any>;
    required: boolean;
    disabled: boolean;
}
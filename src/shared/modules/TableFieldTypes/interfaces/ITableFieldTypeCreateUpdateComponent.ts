import SimpleDatatableField from '../../DAO/vos/datatable/SimpleDatatableField';
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Nécessite d'envoyer l'évènement @input lors du changement de contenu pour validation du champ
 */
export default interface ITableFieldTypeCreateUpdateComponent {
    vo: IDistantVOBase;
    field: SimpleDatatableField<any, any>;
    required: boolean;
    disabled: boolean;
}
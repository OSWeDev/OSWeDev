import IDistantVOBase from '../../IDistantVOBase';
import SimpleDatatableField from '../../../../vuejsclient/ts/components/datatable/vos/SimpleDatatableField';

/**
 * Nécessite d'envoyer l'évènement @input lors du changement de contenu pour validation du champ
 */
export default interface ITableFieldTypeCreateUpdateComponent {
    vo: IDistantVOBase;
    field: SimpleDatatableField<any, any>;
    required: boolean;
    disabled: boolean;
}
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import VOFieldRefVO from '../vos/VOFieldRefVO';

/**
 * IReadableFieldFilters
 */
export default interface IReadableFieldFilters {

    /**
     * The actual field_filter label
     */
    label: string;

    /**
     * @deprecated use readable_context_filters instead
     */
    readable_field_filters: string;

    /**
     * The readable context filters
     */
    readable_context_filters?: string;

    /**
     * The context filter
     */
    context_filter: ContextFilterVO;

    /**
     * Says if the filter is hidden
     */
    is_filter_hidden: boolean;

    /**
     * The field_ref
     *  - where api_type_id is the api_type_id of the field
     *  - and field_id is the field_id of the field
     */
    vo_field_ref: VOFieldRefVO;
}
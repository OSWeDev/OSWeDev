import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * @interface IReadableActiveFieldFilters
 */
export default interface IReadableActiveFieldFilters {
    readable_field_filters: string;
    context_filter: ContextFilterVO;
    vo_field_ref: { api_type_id: string, field_id: string };
}
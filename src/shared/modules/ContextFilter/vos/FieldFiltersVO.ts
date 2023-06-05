import ContextFilterVO from "./ContextFilterVO";

/**
 * FieldFiltersVO
 *  - Used to describe api_field_filters of dashboard and dashboard_pages
 *  - api_field_filters is a JSON object of field filters
 *  - the actual api_type_id key may be a custom api_type_id (e.g. field_filters of dates)
 */
export default class FieldFiltersVO {
    [api_type_id: string]: { [field_id: string]: ContextFilterVO }
}
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * IDefaultFiltersParams
 *  - Filters params that provide required properties for xlsx export data calculation
 */
export interface IDefaultFiltersParams {
    fields_filters?: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    // We may have custom widget property by type e.g. valuetable | fieldvaluefilter | monthfilter
    // And for "monthfilter" we may have "option_prop" e.g. relative preselect date
    widget_options?: { [type: string]: { [option_prop: string]: any } };
}
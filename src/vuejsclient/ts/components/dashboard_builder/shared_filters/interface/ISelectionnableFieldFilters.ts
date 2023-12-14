import IReadableFieldFilters from "../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters";
import FieldFiltersVO from "../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";

/**
 * ISelectionnableFieldFilters
 *  - This interface is used to display the sharable_field_filters_by_page_ids
 */
export default interface ISelectionnableFieldFilters {
    field_filters: FieldFiltersVO;
    readable_field_filters: { [label: string]: IReadableFieldFilters };
}
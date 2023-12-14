import IReadableFieldFilters from "../interfaces/IReadableFieldFilters";
import AbstractVO from "../../VO/abstract/AbstractVO";
import FieldFiltersVO from "./FieldFiltersVO";

/**
 * DashboardPageFieldFiltersVO
 *  - This used to display the field_filters options for selection
 */
export default class DashboardPageFieldFiltersVO extends AbstractVO {

    // The id of the dashboard page
    public dashboard_page_id?: number;

    // The readable_field_filters of the dashboard page
    public readable_field_filters: { [label: string]: IReadableFieldFilters }; // We can refind the field_filters by its vo_field_ref

    // The field_filters of the dashboard page
    public field_filters: FieldFiltersVO;
}
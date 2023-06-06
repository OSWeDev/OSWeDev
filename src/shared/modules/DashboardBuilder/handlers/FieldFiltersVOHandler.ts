import FieldFiltersVO from "../vos/FieldFiltersVO";
import VOFieldRefVO from '../vos/VOFieldRefVO';

/**
 * FieldFiltersVOHandler
 *  - Used to handle|check FieldFiltersVO
 */
export default class FieldFiltersVOHandler {

    /**
     * Is field_filters empty
     *  - The aim of this function is to check if the given field_filters is empty
     *
     * @param {any} widget_options
     * @param {FieldFiltersVO} active_field_filters
     * @returns boolean
     */
    public static is_field_filters_empty(
        vo_field_ref: VOFieldRefVO,
        active_field_filters: FieldFiltersVO
    ): boolean {

        if (!vo_field_ref) {
            return true;
        }

        const api_type_id_filters = active_field_filters[vo_field_ref.api_type_id];

        if (!api_type_id_filters) {
            return true;
        }

        const has_field_filters = !!(api_type_id_filters[vo_field_ref.field_id]);

        return !(has_field_filters);
    }
}
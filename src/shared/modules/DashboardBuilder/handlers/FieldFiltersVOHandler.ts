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
     *  - Cannot be checked without a valid vo_field_ref
     *
     * @param {VOFieldRefVO} vo_field_ref
     * @param {FieldFiltersVO} active_field_filters
     * @returns boolean
     */
    public static is_field_filters_empty(
        vo_field_ref: VOFieldRefVO,
        active_field_filters: FieldFiltersVO
    ): boolean {

        // Check if vo_field_ref is valid
        if (!vo_field_ref?.api_type_id || !vo_field_ref?.field_id) {
            throw new Error(
                `FieldFiltersVOHandler.is_field_filters_empty: ` +
                `vo_field_ref.api_type_id or vo_field_ref.field_id is missing`
            );
        }

        const api_type_id_filters = active_field_filters[vo_field_ref.api_type_id];

        if (!api_type_id_filters) {
            return true;
        }

        const has_field_filters = !!(api_type_id_filters[vo_field_ref.field_id]);

        return !(has_field_filters);
    }
}
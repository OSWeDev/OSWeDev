import YearFilterWidgetManager from "../manager/YearFilterWidgetManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * YearFilterWidgetHandler
 *  - Handles the YearFilterWidget component
 */
export default class YearFilterWidgetHandler {

    /**
     * has_selectected_years_changed
     * - Check if selected years has changed
     *
     * @param {ContextFilterVO} context_filter
     * @param {{ [year: number]: boolean }} selected_years
     * @param {string[]} available_years
     * @returns {boolean}
     */
    public static has_selectected_years_changed(
        context_filter: ContextFilterVO,
        selected_years: { [year: number]: boolean },
        available_years: string[],
    ): boolean {
        let has_changed = false;

        if (!context_filter) {
            return false;
        }

        const selected_years_from_context_filter = YearFilterWidgetManager.get_selected_years_from_context_filter(
            context_filter,
            available_years
        );

        for (const year in selected_years) {
            if (selected_years[year] != selected_years_from_context_filter[year]) {
                has_changed = true;
                break;
            }
        }

        return has_changed;
    }

}
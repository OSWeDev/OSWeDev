import MonthFilterWidgetManager from "../manager/MonthFilterWidgetManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * MonthFilterWidgetHandler
 *  - Handles the MonthFilterWidget component
 */
export default class MonthFilterWidgetHandler {

    /**
     * has_selectected_months_changed
     * - Check if selected months has changed
     *
     * @param {ContextFilterVO} context_filter
     * @param {{ [month: number]: boolean }} selected_months
     * @param {string[]} available_months
     * @returns {boolean}
     */
    public static has_selectected_months_changed(
        context_filter: ContextFilterVO,
        selected_months: { [month: number]: boolean },
        available_months: string[],
    ): boolean {
        let has_changed = false;

        if (!context_filter) {
            return false;
        }

        const selected_months_from_context_filter = MonthFilterWidgetManager.get_selected_months_from_context_filter(
            context_filter,
            available_months
        );

        for (let month in selected_months) {
            if (selected_months[month] != selected_months_from_context_filter[month]) {
                has_changed = true;
                break;
            }
        }

        return has_changed;
    }

}
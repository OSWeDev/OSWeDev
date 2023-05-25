import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";

/**
 * Dashboard Builder Data Filter Manager
 */
export default class DashboardBuilderDataFilterManager {


    public static async load_data_filtersfrom_widget_options() {

    }

    /**
     * get_required_api_type_ids_from_widget_options
     *  - Get the required api_type_id from the given widget_options to perform the expected request
     *
     * @param {FieldValueFilterWidgetOptionsVO} widget_options
     * @param {options.active_api_type_ids} options.active_api_type_ids
     * @param {options.query_api_type_ids} options.query_api_type_ids
     * @returns {string[]}
     */
    public static get_required_api_type_ids_from_widget_options(
        widget_options: FieldValueFilterWidgetOptionsVO,
        options?: {
            active_api_type_ids?: string[]; // Setted on user selection (select option) to specify query on specified vos api_type_ids
            query_api_type_ids?: string[]; // Setted in (supervision) widget_options to have custom|default query on specified vos api_type_ids
        }
    ): string[] {
        const vo_field_ref = widget_options?.vo_field_ref;

        let api_type_ids: string[] = [];

        // TODO: Load available api type ids from the dashboard
        if (widget_options.has_other_ref_api_type_id && widget_options.other_ref_api_type_id) {
            api_type_ids = [widget_options.other_ref_api_type_id];
        } else {
            // Default api_type_id whould be the vo_field_ref.api_type_id
            api_type_ids = [vo_field_ref?.api_type_id];
        }

        // Active api_type_ids (that have actually been selected by the user)
        // Should always be prioritized over query_api_type_ids
        if (options?.active_api_type_ids?.length > 0) {
            // Get selected api type ids (e.g. from supervision widget options)
            api_type_ids = options?.active_api_type_ids;

        } else if (options?.query_api_type_ids?.length > 0 && widget_options.force_filter_by_all_api_type_ids) {
            // Get default api type ids (e.g. from supervision widget_options)
            api_type_ids = options?.query_api_type_ids;
        }

        return api_type_ids;
    }

    constructor() { }

    public load(): void {
    }

}
import ObjectHandler from "../../../tools/ObjectHandler";
import IReadableFieldFilters from "../interfaces/IReadableFieldFilters";
import DashboardPageFieldFiltersVO from "../vos/DashboardPageFieldFiltersVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import DashboardPageVOManager from "./DashboardPageVOManager";
import FieldFiltersVOManager from "./FieldFiltersVOManager";

/**
 * DashboardPageFieldFiltersVOManager
 */
export default class DashboardPageFieldFiltersVOManager {

    /**
     * find_dashboard_pages_field_filters_by_dashboard_ids
     *
     * @param {number[]} dashboard_ids
     * @returns {Promise<{ [page_id: number]: FieldFiltersVO }>}
     */
    public static async find_dashboard_pages_field_filters_by_dashboard_ids(
        dashboard_ids: number[],
    ): Promise<DashboardPageFieldFiltersVO[]> {
        const dashboard_pages_field_filters_map: DashboardPageFieldFiltersVO[] = [];

        for (const key in dashboard_ids) {
            const dashboard_id = dashboard_ids[key];

            const dashboard_pages_field_filters = await DashboardPageFieldFiltersVOManager.find_dashboard_pages_field_filters_by_dashboard_id(
                dashboard_id,
            );

            dashboard_pages_field_filters_map.push(
                ...dashboard_pages_field_filters
            );
        }

        return dashboard_pages_field_filters_map;
    }

    /**
     * find_dashboard_pages_field_filters_by_dashboard_id
     * - This method is responsible for loading the field_filters of each dashboard_page
     * - The field_filters are the default field_filters which exists on the dashboard_page
     *
     * @param {number} dashboard_id
     * @returns {Promise<{ [page_id: number]: FieldFiltersVO }>}
     */
    public static async find_dashboard_pages_field_filters_by_dashboard_id(
        dashboard_id: number,
    ): Promise<DashboardPageFieldFiltersVO[]> {

        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_id(
            dashboard_id,
        );

        const dashboard_pages_field_filters_map: DashboardPageFieldFiltersVO[] = [];

        for (const key in dashboard_pages) {
            const dashboard_page = dashboard_pages[key];

            // Get default field_filters of dashboard_page
            const default_page_field_filters = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
                dashboard_page.id,
                {
                    keep_empty_context_filter: true
                }
            );

            // Create readable field_filters of dashboard_page
            const readable_field_filters = await FieldFiltersVOManager.create_readable_filters_text_from_field_filters(
                default_page_field_filters,
                dashboard_page.id,
            );

            // Create dashboard_page_field_filters
            const dashboard_page_field_filters = new DashboardPageFieldFiltersVO().from({
                field_filters: default_page_field_filters,
                dashboard_page_id: dashboard_page.id,
                readable_field_filters,
            });

            dashboard_pages_field_filters_map.push(
                dashboard_page_field_filters
            );
        }

        return dashboard_pages_field_filters_map;
    }

    /**
     * merge_all_dashboard_pages_field_filters
     * - Merge all given dashboard_pages_field_filters_map
     * - This method is used to create the single dashboard_pages_field_filters
     *   by combining (Union) all dashboard_pages_field_filters_map
     *
     * @param {DashboardPageFieldFiltersVO[]} dashboard_pages_field_filters_map
     * @returns {DashboardPageFieldFiltersVO}
     */
    public static merge_all_dashboard_pages_field_filters(
        dashboard_pages_field_filters_map: DashboardPageFieldFiltersVO[]
    ): DashboardPageFieldFiltersVO {

        let readable_field_filters: { [label: string]: IReadableFieldFilters } = {};
        let field_filters: FieldFiltersVO = {};

        for (const i in dashboard_pages_field_filters_map) {
            const field_filters_metadata = dashboard_pages_field_filters_map[i];

            field_filters = FieldFiltersVOManager.merge_field_filters(
                field_filters,
                field_filters_metadata.field_filters,
                { keep_empty_context_filter: true }
            );

            readable_field_filters = FieldFiltersVOManager.merge_readable_field_filters(
                readable_field_filters,
                field_filters_metadata.readable_field_filters
            );
        }

        return new DashboardPageFieldFiltersVO().from({
            readable_field_filters: ObjectHandler.sort_by_key(readable_field_filters),
            field_filters: ObjectHandler.sort_by_key(field_filters),
        });
    }

    /**
     * merge_all_dashboard_pages_field_filters
     * - Merge all given dashboard_pages_field_filters_map
     * - This method is used to create the single dashboard_pages_field_filters
     *   by combining (INTERSECTION) all dashboard_pages_field_filters_map
     *
     * @param {DashboardPageFieldFiltersVO[]} dashboard_pages_field_filters_map
     * @returns {DashboardPageFieldFiltersVO}
     */
    public static get_INTERSECTION_all_dashboard_pages_field_filters(
        dashboard_pages_field_filters_map: DashboardPageFieldFiltersVO[]
    ): DashboardPageFieldFiltersVO {

        if (!dashboard_pages_field_filters_map || !dashboard_pages_field_filters_map.length) {
            return null;
        }

        let readable_field_filters: { [label: string]: IReadableFieldFilters } = Object.assign({}, dashboard_pages_field_filters_map[0].readable_field_filters);
        let field_filters: FieldFiltersVO = Object.assign({}, dashboard_pages_field_filters_map[0].field_filters);

        for (let i in dashboard_pages_field_filters_map) {
            if (i == '0') {
                continue;
            }

            const field_filters_metadata = dashboard_pages_field_filters_map[i];

            field_filters = FieldFiltersVOManager.get_INTERSECTION_field_filters(
                field_filters,
                field_filters_metadata.field_filters
            ) as FieldFiltersVO;

            readable_field_filters = FieldFiltersVOManager.get_INTERSECTION_field_filters(
                readable_field_filters,
                field_filters_metadata.readable_field_filters
            ) as { [label: string]: IReadableFieldFilters };
        }

        return new DashboardPageFieldFiltersVO().from({
            readable_field_filters: ObjectHandler.sort_by_key(readable_field_filters),
            field_filters: ObjectHandler.sort_by_key(field_filters),
        });
    }



}
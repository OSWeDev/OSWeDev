import EnvHandler from "../../../tools/EnvHandler";
import PromisePipeline from "../../../tools/PromisePipeline/PromisePipeline";
import DashboardVO from "../vos/DashboardVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import ModuleTable from "../../ModuleTable";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import FieldValueFilterWidgetManager from './FieldValueFilterWidgetManager';
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import DashboardBuilderBoardManager from "./DashboardBuilderBoardManager";
import FieldFilterManager from "../../ContextFilter/manager/FieldFilterManager";
import DashboardBuilderDataFilterManager from "./DashboardBuilderDataFilterManager";

/**
 * FieldValueFilterEnumWidgetManager
 */
export default class FieldValueFilterEnumWidgetManager {

    /**
     * Load enum data filters from widget options
     *  - Load enum data filters from database by using the given dashboard and widget_options properties
     *
     * TODO: - while using different active_field_filters on the same dashboard, it overwrite the previous one
     *
     * @param {DashboardVO} dashboard  the actual dashboard
     * @param {FieldValueFilterWidgetOptionsVO} widget_options the actual widget options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters Active field filters (from the user selection) from the actual dashboard
     * @param {options.force_filter_by_active_api_type_ids} options.force_filter_by_active_api_type_ids
     * @param {options.active_api_type_ids} options.active_api_type_ids
     * @param {options.query_api_type_ids} options.query_api_type_ids
     * @returns {Promise<DataFilterOption[]>}
     */
    public static async find_enum_data_filters_from_widget_options(
        dashboard: DashboardVO,
        widget_options: FieldValueFilterWidgetOptionsVO,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }, // Active field filters from the actual dashboard
        options?: {
            active_api_type_ids?: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
            query_api_type_ids?: string[]; // Setted from widget options to have custom|default query on specified vos api ids
        }
    ): Promise<DataFilterOption[]> {

        let added_data_filter: { [numeric_value: number]: boolean } = {};
        let data_filters: DataFilterOption[] = [];

        let actual_query: string = null;

        // TODO: May be had class-validator to check if widget_options is a FieldValueFilterWidgetOptionsVO
        // https://github.com/typestack/class-validator
        if (!(widget_options instanceof FieldValueFilterWidgetOptionsVO)) {
            widget_options = new FieldValueFilterWidgetOptionsVO().from(widget_options);
        }

        const vo_field_ref = widget_options?.vo_field_ref;

        const discarded_field_paths = await DashboardBuilderBoardManager.find_discarded_field_paths({ id: dashboard.id } as DashboardVO);

        const available_api_type_ids: string[] = DashboardBuilderDataFilterManager.get_required_api_type_id_from_widget_options(widget_options, options);

        if (!widget_options.no_inter_filter) {
            // active_field_filters = FieldFilterManager.clean_field_filters_for_request(
            //     active_field_filters,
            //     { should_restrict_to_api_type_id: true }
            // );
        }

        const active_field_filters_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            available_api_type_ids,
            options.query_api_type_ids
        );

        const limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(limit);

        for (const i in available_api_type_ids) {
            const query_api_type_id: string = available_api_type_ids[i];

            const active_field_filters_for_request = active_field_filters_by_api_type_id[query_api_type_id];

            const filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                active_field_filters_for_request
            );

            if (widget_options.force_filter_by_all_api_type_ids) {
                vo_field_ref.api_type_id = query_api_type_id;
            }

            let _query = query(query_api_type_id)
                .field(vo_field_ref.field_id, 'label', vo_field_ref.api_type_id)
                .add_filters(filters)
                .set_limit(widget_options.max_visible_options)
                .using(dashboard.api_type_ids);

            FieldValueFilterWidgetManager.add_discarded_field_paths(_query, discarded_field_paths);

            _query.filters = ContextFilterVOHandler.getInstance().add_context_filters_exclude_values(
                widget_options.get_exclude_values(),
                vo_field_ref,
                _query.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[_query.base_api_type_id];

            if (
                base_table &&
                base_table.is_segmented
            ) {
                if (
                    !base_table.table_segmented_field ||
                    !base_table.table_segmented_field.manyToOne_target_moduletable ||
                    !active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type] ||
                    !Object.keys(active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]).length
                ) {
                    return;
                }

                let has_filter: boolean = false;

                for (let field_id in active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]) {
                    if (active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type][field_id]) {
                        has_filter = true;
                        break;
                    }
                }

                if (!has_filter) {
                    return;
                }
            } else {
                const overflowing_api_type_id = await FieldValueFilterWidgetManager.get_overflowing_segmented_options_api_type_id_from_dashboard(dashboard, _query, true);

                if (overflowing_api_type_id?.length > 0) {
                    _query = FieldValueFilterWidgetManager.remove_overflowing_api_type_id_from_context_query(_query, overflowing_api_type_id, discarded_field_paths);
                }
            }

            await promise_pipeline.push(async () => {
                const visible_data_filters: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
                    _query,
                    actual_query
                );

                for (const j in visible_data_filters) {
                    const visible_data_filter = visible_data_filters[j];

                    if (!added_data_filter[visible_data_filter.numeric_value]) {
                        added_data_filter[visible_data_filter.numeric_value] = true;
                        data_filters.push(visible_data_filter);
                    }
                }
            });
        }

        await promise_pipeline.end();

        return data_filters;
    }

    /**
     * get_required_api_type_id_from_widget_options
     *  - Get the required api_type_id from the given widget_options to perform the expected request
     *
     * @param {FieldValueFilterWidgetOptionsVO} widget_options
     * @param {options.active_api_type_ids} options.active_api_type_ids
     * @param {options.query_api_type_ids} options.query_api_type_ids
     * @returns {string[]}
     */
    public static get_required_api_type_id_from_widget_options(
        widget_options: FieldValueFilterWidgetOptionsVO,
        options?: {
            active_api_type_ids?: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
            query_api_type_ids?: string[]; // Setted from widget options to have custom|default query on specified vos api ids
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

        if (options.active_api_type_ids?.length > 0) {
            // Get selected api type ids (e.g. from supervision widget options)
            api_type_ids = options.active_api_type_ids;

        } else if (options.query_api_type_ids.length > 0 && widget_options.force_filter_by_all_api_type_ids) {
            // Get default api type ids (e.g. from supervision widget_options)
            api_type_ids = options.query_api_type_ids;
        }

        return api_type_ids;
    }

    constructor() { }

    public load(): void {
    }

}
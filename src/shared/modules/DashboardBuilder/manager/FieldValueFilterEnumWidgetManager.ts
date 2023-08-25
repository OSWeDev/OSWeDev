import PromisePipeline from "../../../tools/PromisePipeline/PromisePipeline";
import DashboardVO from "../vos/DashboardVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import ModuleTable from "../../ModuleTable";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO, { query } from "../../ContextFilter/vos/ContextQueryVO";
import FieldValueFilterWidgetManager from './FieldValueFilterWidgetManager';
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import DashboardBuilderBoardManager from "./DashboardBuilderBoardManager";
import FieldFilterManager from "./FieldFilterManager";
import DashboardBuilderDataFilterManager from "./DashboardBuilderDataFilterManager";
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * FieldValueFilterEnumWidgetManager
 */
export default class FieldValueFilterEnumWidgetManager {

    /**
     * Load enum data filters from widget options
     *  - Load enum data filters from database by using the given dashboard and widget_options properties
     *
     * @param {DashboardVO} dashboard  the actual dashboard
     * @param {FieldValueFilterWidgetOptionsVO} widget_options the actual widget options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters Active field filters (from the user selection) from the actual dashboard
     * @param {options.active_api_type_ids} options.active_api_type_ids - Setted on user selection (select option) to specify query on specified vos api ids
     * @param {options.query_api_type_ids} options.query_api_type_ids - Setted from widget options to have custom|default query on specified vos api ids
     * @param {options.with_count} options.with_count - Setted from widget options to have count on each data_filter
     * @returns {Promise<DataFilterOption[]>}
     */
    public static async find_enum_data_filters_from_widget_options(
        dashboard: DashboardVO,
        widget_options: FieldValueFilterWidgetOptionsVO,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }, // Active field filters from the actual dashboard
        options?: {
            active_api_type_ids?: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
            query_api_type_ids?: string[]; // Setted from widget options to have custom|default query on specified vos api ids
            with_count?: boolean; // Setted from widget options to have count on each data_filter
        }
    ): Promise<DataFilterOption[]> {

        let added_data_filter: { [numeric_value: number]: boolean } = {};
        let enum_data_filters: DataFilterOption[] = [];

        let actual_query: string = null;

        // TODO: May be had class-validator to check if widget_options is a FieldValueFilterWidgetOptionsVO
        // https://github.com/typestack/class-validator
        if (!(widget_options instanceof FieldValueFilterWidgetOptionsVO)) {
            widget_options = new FieldValueFilterWidgetOptionsVO().from(widget_options);
        }

        const vo_field_ref = widget_options?.vo_field_ref;

        const discarded_field_paths = await DashboardBuilderBoardManager.find_discarded_field_paths({ id: dashboard.id } as DashboardVO);

        const available_api_type_ids: string[] = DashboardBuilderDataFilterManager.get_required_api_type_ids_from_widget_options(
            widget_options,
            options
        );

        const pipeline_limit = available_api_type_ids.length;
        let promise_pipeline = new PromisePipeline(pipeline_limit, 'FieldValueFilterEnumWidgetManager.find_enum_data_filters_from_widget_options');

        const allowed_api_type_ids: string[] = [];

        for (const key in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key];

            await promise_pipeline.push(async () => {
                const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
                const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

                if (!has_access) {
                    return;
                }

                allowed_api_type_ids.push(api_type_id);
            });
        }

        await promise_pipeline.end();

        promise_pipeline = new PromisePipeline(pipeline_limit, 'FieldValueFilterEnumWidgetManager.find_enum_data_filters_from_widget_options');

        // In some case we may need to only filter on required_api_type_ids
        // (each api_type_id will have its own filter or vo_type)
        const field_filters_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            allowed_api_type_ids,
            options.query_api_type_ids
        );

        // In some case we may need to filter on other api_type_ids than required_api_type_ids
        // (each api_type_id will filter on other api_type_ids or vo_type)
        const other_field_filter = FieldFilterManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            options.query_api_type_ids ?? []
        );

        let context_query: ContextQueryVO = null;

        for (const key in allowed_api_type_ids) {
            const api_type_id: string = allowed_api_type_ids[key];

            const api_type_field_filters = field_filters_by_api_type_id[api_type_id];

            const api_type_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                api_type_field_filters
            );

            // TODO: May be add widget_options boolean to enable/disable keep_other_context_filters (or specify api_type_ids to keep)
            const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                other_field_filter,
            );

            if (widget_options.force_filter_by_all_api_type_ids) {
                vo_field_ref.api_type_id = api_type_id;
            }

            const context_filters: ContextFilterVO[] = [
                ...api_type_context_filters,
                ...other_context_filters,
            ];

            let api_type_context_query = query(api_type_id)
                .using(dashboard.api_type_ids)
                .field(vo_field_ref.field_id, 'label', vo_field_ref.api_type_id)
                .add_filters(context_filters)
                .set_limit(widget_options.max_visible_options)
                .set_query_distinct();

            FieldValueFilterWidgetManager.add_discarded_field_paths(
                api_type_context_query,
                discarded_field_paths
            );

            api_type_context_query.filters = ContextFilterVOHandler.add_context_filters_exclude_values(
                widget_options.get_exclude_values(),
                vo_field_ref,
                api_type_context_query.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_context_query.base_api_type_id];

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
                const overflowing_api_type_id = await FieldValueFilterWidgetManager.get_overflowing_segmented_options_api_type_id_from_dashboard(
                    dashboard,
                    api_type_context_query,
                    true
                );

                if (overflowing_api_type_id?.length > 0) {
                    api_type_context_query = FieldValueFilterWidgetManager.remove_overflowing_api_type_id_from_context_query(
                        api_type_context_query,
                        overflowing_api_type_id,
                        discarded_field_paths
                    );
                }
            }

            if (!context_query) {
                // Main first query
                context_query = api_type_context_query;
            } else {
                // Union query to be able to select all vos of each api_type_id
                context_query.union(api_type_context_query);
            }
        }

        if (!context_query) {
            return enum_data_filters;
        }

        promise_pipeline.push(async () => {

            let data_filters: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
                context_query,
                actual_query
            );

            for (const j in data_filters) {
                const visible_data_filter = data_filters[j];

                if (!added_data_filter[visible_data_filter.numeric_value]) {
                    added_data_filter[visible_data_filter.numeric_value] = true;

                    enum_data_filters.push(visible_data_filter);
                }
            }
        });

        await promise_pipeline.end();

        // We should always have the same sort order
        // - Sort enum_data_filters by numeric_value
        enum_data_filters = enum_data_filters?.sort((a: DataFilterOption, b: DataFilterOption) => {
            return a.numeric_value - b.numeric_value;
        });

        return enum_data_filters;
    }

    /**
     * find_enum_data_filters_count_from_widget_options
     *
     * @param {DashboardVO} dashboard  the actual dashboard
     * @param {FieldValueFilterWidgetOptionsVO} widget_options the actual widget options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters Active field filters (from the user selection) from the actual dashboard
     * @param {options.active_api_type_ids} options.active_api_type_ids - Setted on user selection (select option) to specify query on specified vos api ids
     * @param {options.query_api_type_ids} options.query_api_type_ids - Setted from widget options to have custom|default query on specified vos api ids
     * @param {options.with_count} options.with_count - Setted from widget options to have count on each data_filter
     * @returns {Promise<{ [enum_value: number]: number }>}
     */
    public static async find_enum_data_filters_count_from_widget_options(
        dashboard: DashboardVO,
        widget_options: FieldValueFilterWidgetOptionsVO,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }, // Active field filters from the actual dashboard
        enum_data_filters: DataFilterOption[], // Enum data filters from the actual dashboard
        options?: {
            active_api_type_ids?: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
            query_api_type_ids?: string[]; // Setted from widget options to have custom|default query on specified vos api ids
            with_count?: boolean; // Setted from widget options to have count on each data_filter
        }
    ): Promise<{ [enum_value: number]: number }> {
        let count_by_enum_data_filter: { [enum_value: number]: number } = {};

        // We should set all enum count to 0
        for (const key in enum_data_filters) {
            const enum_data_filter = enum_data_filters[key];

            count_by_enum_data_filter[enum_data_filter.numeric_value] = 0;
        }

        // TODO: May be had class-validator to check if widget_options is a FieldValueFilterWidgetOptionsVO
        // https://github.com/typestack/class-validator
        if (!(widget_options instanceof FieldValueFilterWidgetOptionsVO)) {
            widget_options = new FieldValueFilterWidgetOptionsVO().from(widget_options);
        }

        const vo_field_ref = widget_options?.vo_field_ref;

        const discarded_field_paths = await DashboardBuilderBoardManager.find_discarded_field_paths(
            { id: dashboard.id } as DashboardVO
        );

        const available_api_type_ids: string[] = DashboardBuilderDataFilterManager.get_required_api_type_ids_from_widget_options(
            widget_options,
            {
                active_api_type_ids: options?.active_api_type_ids,
                query_api_type_ids: options?.query_api_type_ids,
            }
        );

        const pipeline_limit = available_api_type_ids.length; // One query|request by api_type_id
        let promise_pipeline = new PromisePipeline(pipeline_limit, 'FieldValueFilterEnumWidgetManager.find_enum_data_filters_count_from_widget_options');

        const allowed_api_type_ids: string[] = [];

        // We must do it in two separate states (with promise_pipeline)
        // The first one is to check access and build the query
        // The second one is to perform the query and get the count
        for (const key in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key];

            // We must check access on each api_type_id
            await promise_pipeline.push(async () => {

                const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
                const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

                if (!has_access) {
                    return;
                }

                allowed_api_type_ids.push(api_type_id);
            });
        }

        await promise_pipeline.end();

        promise_pipeline = new PromisePipeline(pipeline_limit, 'FieldValueFilterEnumWidgetManager.find_enum_data_filters_count_from_widget_options');

        // In some case we may need to only filter on required_api_type_ids
        // (each api_type_id will have its own filter or vo_type)
        const field_filters_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            allowed_api_type_ids,
            options.query_api_type_ids,
        );

        // In some case we may need to filter on other api_type_ids than required_api_type_ids
        // (each api_type_id will filter on other api_type_ids or vo_type)
        const other_field_filter = FieldFilterManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            options.query_api_type_ids ?? []
        );

        // TODO: May be add widget_options boolean to enable/disable keep_other_context_filters (or specify api_type_ids to keep)
        const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            other_field_filter,
        );

        for (const enum_data_key in enum_data_filters) {
            const filter_opt: DataFilterOption = enum_data_filters[enum_data_key];

            if (!filter_opt) {
                continue;
            }

            let context_query: ContextQueryVO = null;

            for (const key in allowed_api_type_ids) {
                const api_type_id: string = allowed_api_type_ids[key];

                const api_type_field_filters = field_filters_by_api_type_id[api_type_id];

                const api_type_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    api_type_field_filters
                );

                const enum_context_filter = ContextFilterVOManager.get_context_filter_from_data_filter_option(
                    filter_opt,
                    null,
                    VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref),
                    vo_field_ref,
                );

                if (widget_options.force_filter_by_all_api_type_ids) {
                    // Filter on this iterated api_type_id
                    enum_context_filter.vo_type = api_type_id;
                }

                const context_filters: ContextFilterVO[] = [
                    ...api_type_context_filters,
                    ...other_context_filters,
                    enum_context_filter,
                ];

                const api_type_context_query = query(api_type_id)
                    .using(dashboard.api_type_ids)
                    .add_filters(context_filters);

                FieldValueFilterWidgetManager.add_discarded_field_paths(
                    api_type_context_query,
                    discarded_field_paths
                );

                // Avoid load from cache
                if (!context_query) {
                    // Main first query
                    context_query = api_type_context_query;
                } else {
                    // Union query to be able to select all vos of each api_type_id
                    context_query.union(api_type_context_query);
                }
            }

            await promise_pipeline.push(async () => {
                const count: number = await context_query.select_count();

                if (count >= 0) {
                    count_by_enum_data_filter[filter_opt.numeric_value] = count;
                }
            });
        }

        await promise_pipeline.end();

        return count_by_enum_data_filter;
    }

    /**
     * get_required_api_type_ids_from_widget_options
     *  - Get the required api_type_id from the given widget_options to perform the expected request
     *
     * TODO: Is it specific to FieldValueFilterEnumWidgetManager ?
     *
     * @param {FieldValueFilterWidgetOptionsVO} widget_options
     * @param {options.active_api_type_ids} options.active_api_type_ids
     * @param {options.query_api_type_ids} options.query_api_type_ids
     * @returns {string[]}
     */
    public static get_required_api_type_ids_from_widget_options(
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
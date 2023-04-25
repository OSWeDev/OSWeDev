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

        const available_api_type_ids: string[] = DashboardBuilderDataFilterManager.get_required_api_type_ids_from_widget_options(widget_options, options);

        // In some case we may need to only filter on required_api_type_ids
        // (each api_type_id will have its own filter or vo_type)
        const field_filters_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            available_api_type_ids,
            options.query_api_type_ids
        );

        // In some case we may need to filter on other api_type_ids than required_api_type_ids
        // (each api_type_id will filter on other api_type_ids or vo_type)
        const other_field_filter = FieldFilterManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            options.query_api_type_ids ?? []
        );

        const pipeline_limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(pipeline_limit);

        for (const i in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[i];

            const api_type_field_filters = field_filters_by_api_type_id[api_type_id];

            const api_type_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                api_type_field_filters
            );

            // TODO: May be add widget_options boolean to enable/disable keep_other_context_filters (or specify api_type_ids to keep)
            const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                other_field_filter,
            );

            const context_filters: ContextFilterVO[] = [
                ...api_type_context_filters,
                ...other_context_filters
            ];

            if (widget_options.force_filter_by_all_api_type_ids) {
                vo_field_ref.api_type_id = api_type_id;
            }

            let qb = query(api_type_id)
                .field(vo_field_ref.field_id, 'label', vo_field_ref.api_type_id)
                .add_filters(context_filters)
                .set_limit(widget_options.max_visible_options)
                .using(dashboard.api_type_ids);

            FieldValueFilterWidgetManager.add_discarded_field_paths(qb, discarded_field_paths);

            qb.filters = ContextFilterVOHandler.getInstance().add_context_filters_exclude_values(
                widget_options.get_exclude_values(),
                vo_field_ref,
                qb.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[qb.base_api_type_id];

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
                const overflowing_api_type_id = await FieldValueFilterWidgetManager.get_overflowing_segmented_options_api_type_id_from_dashboard(dashboard, qb, true);

                if (overflowing_api_type_id?.length > 0) {
                    qb = FieldValueFilterWidgetManager.remove_overflowing_api_type_id_from_context_query(qb, overflowing_api_type_id, discarded_field_paths);
                }
            }

            await promise_pipeline.push(async () => {
                const data_filters: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
                    qb,
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
        }

        await promise_pipeline.end();

        return enum_data_filters;
    }

    /**
     * find_enum_data_filters_count_from_widget_options
     *
     * TODO: when filter actif and count result is 0, the filter shall stay visible
     *
     * @returns TODO vérifier car pas certains que ça fonctionnent dans tous les cas...
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

        // TODO: May be had class-validator to check if widget_options is a FieldValueFilterWidgetOptionsVO
        // https://github.com/typestack/class-validator
        if (!(widget_options instanceof FieldValueFilterWidgetOptionsVO)) {
            widget_options = new FieldValueFilterWidgetOptionsVO().from(widget_options);
        }

        const vo_field_ref = widget_options?.vo_field_ref;

        const discarded_field_paths = await DashboardBuilderBoardManager.find_discarded_field_paths({ id: dashboard.id } as DashboardVO);

        const available_api_type_ids: string[] = DashboardBuilderDataFilterManager.get_required_api_type_ids_from_widget_options(
            widget_options,
            {
                active_api_type_ids: options?.active_api_type_ids,
                query_api_type_ids: options?.query_api_type_ids,
            }
        );

        // In some case we may need to only filter on required_api_type_ids
        // (each api_type_id will have its own filter or vo_type)
        const field_filters_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            available_api_type_ids,
            available_api_type_ids
        );

        // In some case we may need to filter on other api_type_ids than required_api_type_ids
        // (each api_type_id will filter on other api_type_ids or vo_type)
        const other_field_filter = FieldFilterManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            options.query_api_type_ids ?? []
        );

        const pipeline_limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(pipeline_limit);

        for (const key in enum_data_filters) {
            const filter_opt: DataFilterOption = enum_data_filters[key];

            if (!filter_opt) {
                continue;
            }

            // On RAZ le champ
            count_by_enum_data_filter[filter_opt.numeric_value] = 0;

            for (const i in available_api_type_ids) {
                const api_type_id: string = available_api_type_ids[i];

                const api_type_field_filters = field_filters_by_api_type_id[api_type_id];

                const api_type_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    api_type_field_filters
                );

                // TODO: May be add widget_options boolean to enable/disable keep_other_context_filters (or specify api_type_ids to keep)
                const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    other_field_filter,
                );

                const enum_context_filter = ContextFilterVOManager.get_context_filter_from_data_filter_option(
                    filter_opt,
                    null,
                    VOsTypesManager.get_field_from_vo_field_ref(vo_field_ref),
                    vo_field_ref,
                );

                if (widget_options.force_filter_by_all_api_type_ids) {
                    enum_context_filter.vo_type = api_type_id;
                }

                const context_filters: ContextFilterVO[] = [
                    ...api_type_context_filters,
                    ...other_context_filters,
                    enum_context_filter,
                ];

                await promise_pipeline.push(async () => {

                    const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
                    const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

                    if (!has_access) {
                        return;
                    }

                    const qb = query(api_type_id)
                        .using(dashboard.api_type_ids)
                        .add_filters(context_filters);

                    FieldValueFilterWidgetManager.add_discarded_field_paths(qb, discarded_field_paths);

                    const count: number = await qb.select_count();

                    if (count >= 0) {
                        count_by_enum_data_filter[filter_opt.numeric_value] += count;
                    }
                });
            }
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
import { cloneDeep } from "lodash";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import VOFieldRefVO from '../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import IReadableActiveFieldFilters from "../interfaces/IReadableActiveFieldFilters";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import VOFieldRefVOManager from "./VOFieldRefVOManager";
import ModuleTableField from "../../ModuleTableField";
import ModuleTable from "../../ModuleTable";


/**
 * @class FieldFilterManager
 *  - Must likely alter and return field filters like { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
 */
export default class FieldFilterManager {

    /**
     * Create Readable Filters Text From Field Filters
     *  - For each field filters get as Human readable filters
     *
     * @return {{ [translatable_field_filters_code: string]: IReadableActiveFieldFilters }}
     */
    public static create_readable_filters_text_from_field_filters(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
    ): { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } {

        let human_readable_field_filters: { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } = {};

        active_field_filters = cloneDeep(active_field_filters);

        for (const api_type_id in active_field_filters) {
            const filters = active_field_filters[api_type_id];

            for (const field_id in filters) {
                // The actual context_filter
                const context_filter = filters[field_id];

                // Path to find the actual filter
                const vo_field_ref: VOFieldRefVO = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                    { vo_field_ref: { api_type_id, field_id } },
                );

                // The actual label
                const label: string = VOFieldRefVOManager.create_readable_vo_field_ref_label(
                    { field_id, api_type_id }
                );

                // Get HMI readable active field filters
                const readable_field_filters = ContextFilterVOHandler.context_filter_to_readable_ihm(context_filter);

                human_readable_field_filters[label] = {
                    readable_field_filters,
                    context_filter,
                    vo_field_ref,
                };
            }
        }

        return human_readable_field_filters;
    }

    /**
     * clean_field_filters_for_request
     *  - Clone and remove custom_filters
     *
     * @returns {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static clean_field_filters_for_request(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        options?: { should_restrict_to_api_type_id: boolean },
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        let field_filter: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(active_field_filters);

        if (field_filter) {
            delete field_filter[ContextFilterVO.CUSTOM_FILTERS_TYPE];
        }

        if (options?.should_restrict_to_api_type_id) {
            // On ajoute un filtrage des filtres incompatibles avec la requête classique
            // Avoid to have context_filter query on other api_type_id
            field_filter = FieldFilterManager.filter_field_filters_by_it_own_api_type_id(field_filter);
        }

        return field_filter;
    }

    /**
     * Merge Field Filters With Context Filters
     *
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} from_field_filters
     * @param {{ field_id: string, api_type_id: string }} vo_field_ref
     * @param {ContextFilterVO} context_filter
     * @returns {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static merge_field_filters_with_context_filter(
        from_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        vo_field_ref: { field_id: string, api_type_id: string },
        context_filter: ContextFilterVO,
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        let field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(from_field_filters);

        if (field_filters[vo_field_ref.api_type_id]) {
            if (field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id]) {
                // We must combine context_filter with each other when needed
                // e.g. For date Year and Month widget (this widgets have the same api_type_id and field_id)
                const new_context_filter = ContextFilterVOHandler.add_context_filter_to_tree(
                    field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id],
                    context_filter
                );
                field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = new_context_filter;
            } else {
                field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = context_filter;
            }
        } else {
            field_filters[vo_field_ref.api_type_id] = {};
            field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = context_filter;
        }

        return field_filters;
    }

    /**
     * Merge Field Filters
     * - Merge field filters with each other
     *
     * @param { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } from_field_filters
     * @param { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } with_field_filters
     * @returns {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static merge_field_filters(
        from_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        with_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO; }; } {

        let field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(from_field_filters);

        for (const api_type_id in with_field_filters) {
            const filters = with_field_filters[api_type_id];

            for (const field_id in filters) {
                const context_filter = filters[field_id];

                if (!context_filter) {
                    continue;
                }

                // Add default context filters
                field_filters = FieldFilterManager.overwrite_field_filters_with_context_filter(
                    field_filters,
                    { api_type_id, field_id },
                    context_filter,
                );
            }
        }

        return field_filters;
    }

    /**
     * Overwrite Filters With Context Filters
     * - Overwrite or add context_filter of the given field_filters with the given context_filter
     *
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} from_field_filters
     * @param {{ field_id: string, api_type_id: string }} vo_field_ref
     * @param {ContextFilterVO} context_filter
     * @returns {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static overwrite_field_filters_with_context_filter(
        from_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        vo_field_ref: { field_id: string, api_type_id: string },
        context_filter: ContextFilterVO
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        let field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(from_field_filters);

        field_filters[vo_field_ref.api_type_id] = field_filters[vo_field_ref.api_type_id] ?? {};
        field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = context_filter;

        return field_filters;
    }

    /**
     * Update field_filters by required api type ids
     * - The aim of this function is to update and return field_filters for each given api_type_id
     * - /!\ Updating is not filtering, in this way we are actually updating the context_filter.vo_type with the required api_type_id
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} required_api_type_ids - The api_type_ids that are required for the current widget
     * @param {string[]} all_possible_api_type_ids  - The api_type_ids that are possible to update for the current widget
     * @returns {{ [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } }}
     */
    public static update_field_filters_for_required_api_type_ids(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        required_api_type_ids: string[],
        all_possible_api_type_ids: string[],
        options?: {},
    ): { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } {

        active_field_filters = cloneDeep(active_field_filters);

        let field_filters_by_api_type_ids: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = {};

        // Remove unwanted field_filters (e.g. "__custom_filters__")
        const field_filters_for_request: {
            [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        } = FieldFilterManager.clean_field_filters_for_request(
            active_field_filters,
            { should_restrict_to_api_type_id: !widget_options.no_inter_filter }
        );

        // Check whether the given field_filters_for_request are compatible with the all_possible_api_type_ids
        // If not, we must reject the field_filters_for_request
        // At least one of the all_possible_api_type_ids must be present in the field_filters_for_request
        const api_type_ids_for_request = Object.keys(field_filters_for_request).filter((api_type_id: string) => {
            return all_possible_api_type_ids.includes(api_type_id);
        });

        for (const key_i in api_type_ids_for_request) {

            // We must apply the context_filters of the actual filtering on this api_type_id
            // to all of the all_possible_api_type_ids
            const api_type_id_for_request: string = api_type_ids_for_request[key_i];

            const field_filter_for_request = field_filters_for_request[api_type_id_for_request];

            for (let key_j in required_api_type_ids) {
                const api_type_id: string = required_api_type_ids[key_j];

                const field_filters: {
                    [field_id: string]: ContextFilterVO
                } = cloneDeep(field_filter_for_request);

                for (const field_id in field_filters) {
                    const context_filter: ContextFilterVO = field_filters[field_id];

                    if (!context_filter) { continue; }

                    if (!field_filters_by_api_type_ids[api_type_id]) {
                        // We must create an empty field_filters for the given api_type_id if it does not exist
                        const empty_field_filters = {};

                        empty_field_filters[api_type_id] = {};

                        field_filters_by_api_type_ids[api_type_id] = empty_field_filters;
                    }

                    // We must update the vo_type of the context_filter
                    // /!\ Updating is not filtering
                    if (context_filter.vo_type) {
                        context_filter.vo_type = api_type_id;
                    } else if (ContextFilterVOHandler.is_conditional_context_filter(context_filter)) {
                        // TODO: to be continued
                        // TODO: - Maybe we should update deeply the whole context_filter tree for the given api_type_id (or vo_type)
                    }

                    // Check if the api_type_id (or vo_type) actually have the field_id to filter on
                    const base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];
                    const base_table_fields: Array<ModuleTableField<any>> = base_table.get_fields();

                    const has_context_filter_field: boolean = base_table_fields.find((field: ModuleTableField<any>) => {
                        return field.field_id == context_filter.field_id;
                    }) != null;

                    if (!has_context_filter_field) {
                        continue;
                    }

                    if (field_filters_by_api_type_ids[api_type_id][api_type_id]) {
                        // In this case the field_filters are already set for this api_type_id
                        // We must merge the two field_filters
                        field_filters_by_api_type_ids[api_type_id] = FieldFilterManager.merge_field_filters_with_context_filter(
                            field_filters_by_api_type_ids[api_type_id],
                            { api_type_id, field_id },
                            context_filter
                        );
                    } else {
                        field_filters_by_api_type_ids[api_type_id][api_type_id] = field_filters;
                    }
                }
            }
        }

        return field_filters_by_api_type_ids;
    }

    /**
     * Filter field_filters by api_type_id to exclude
     * - The aim of this function is to filter_field_filters by excluding the given api_type_ids_to_exclude (or vo_type)
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} api_type_ids_to_exclude  - The api_type_ids to exclude from the active_field_filters
     * @returns { { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static filter_field_filters_by_api_type_ids_to_exlude(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        api_type_ids_to_exclude: string[],
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        active_field_filters = cloneDeep(active_field_filters);

        let excluded_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};

        // Remove unwanted field_filters (e.g. "__custom_filters__")
        const field_filters_for_request: {
            [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        } = FieldFilterManager.clean_field_filters_for_request(
            active_field_filters,
            { should_restrict_to_api_type_id: !widget_options.no_inter_filter }
        );

        // Get api_type_ids from field_filters_for_request that are not in api_type_ids_to_exclude
        const api_type_ids_to_keep_for_request = Object.keys(field_filters_for_request).filter((api_type_id: string) => {
            return !api_type_ids_to_exclude.includes(api_type_id);
        });

        for (const key in api_type_ids_to_keep_for_request) {
            const api_type_id_to_keep: string = api_type_ids_to_keep_for_request[key];

            excluded_field_filters[api_type_id_to_keep] = cloneDeep(field_filters_for_request[api_type_id_to_keep]);
        }

        return excluded_field_filters;
    }

    /**
     * filter_field_filter_by_type$
     *  - The aim of this function is to filter the given field_filters to only keep context_filters related to each api_type_id
     *
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @returns { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
     */
    public static filter_field_filters_by_it_own_api_type_id(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        for (let api_type_id in active_field_filters) {

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            let field_filters = active_field_filters[api_type_id];
            for (let field_id in field_filters) {
                const context_filter = field_filters[field_id];

                if (!context_filter) {
                    continue;
                }

                field_filters[field_id] = ContextFilterVOManager.filter_context_filter_tree_by_vo_type(context_filter, api_type_id);
            }
        }

        return active_field_filters;
    }

    /**
     * Filter field_filters by api_type_id
     * - The aim of this function is to filter_field_filters by api_type_id (or vo_type)
     * - We should olso only keep all context_filters that actually filter on the given api_type_id (or vo_type)
     *
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} available_api_type_ids all available api type ids
     * @param {string} api_type_id API type id (or vo_type)
     * @returns { { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static filter_field_filters_by_api_type_id(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        available_api_type_ids: string[],
        api_type_id: string
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        if (!active_field_filters) {
            return;
        }

        active_field_filters = cloneDeep(active_field_filters);

        // Get api_type_ids from active_field_filters that are in available_api_type_ids
        const reachable_api_type_ids = Object.keys(active_field_filters).filter((active_api_type_id: string) => {
            return available_api_type_ids.includes(active_api_type_id);
        });

        for (const i in reachable_api_type_ids) {
            const reachable_api_type_id = reachable_api_type_ids[i];

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            if (reachable_api_type_id != api_type_id) {
                delete active_field_filters[reachable_api_type_id];
            }

            if (!active_field_filters[reachable_api_type_id]) {
                continue;
            }

            const field_filters = active_field_filters[reachable_api_type_id];
            for (const field_id in field_filters) {

                if (!field_filters[field_id]) {
                    continue;
                }

                // We should olso only keep context_filters that actually filter on the given api_type_id (or vo_type)
                field_filters[field_id] = ContextFilterVOManager.filter_context_filter_tree_by_vo_type(
                    field_filters[field_id],
                    api_type_id,
                    available_api_type_ids
                );
            }
        }

        return active_field_filters;
    }

    /**
     * Filter visible field_filters
     *  - The aim of this function is to filter the given field_filters to only keep visible context_filters
     *
     * @param {any} widgets_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @returns {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     */
    public static filter_visible_field_filters(
        widgets_options: any[],
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        active_field_filters = cloneDeep(active_field_filters);

        for (const key in widgets_options) {
            const options = widgets_options[key];

            const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(options);

            if (!vo_field_ref?.api_type_id || !vo_field_ref?.field_id) {
                continue;
            }

            if (options.hide_filter) {
                if (!FieldFilterManager.is_field_filters_empty(options, active_field_filters)) {
                    delete active_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];
                }
            }
        }

        return active_field_filters;
    }

    /**
     * Is field_filters empty
     *  - The aim of this function is to check if the given field_filters is empty
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @returns boolean
     */
    public static is_field_filters_empty(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
    ): boolean {

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(widget_options);

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
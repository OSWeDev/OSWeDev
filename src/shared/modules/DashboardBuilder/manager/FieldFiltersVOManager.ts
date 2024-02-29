import { cloneDeep } from "lodash";
import ObjectHandler from "../../../tools/ObjectHandler";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ModuleTableController from "../../DAO/ModuleTableController";
import ModuleTableFieldVO from "../../DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../DAO/vos/ModuleTableVO";
import TranslationManager from "../../Translation/manager/TranslationManager";
import FieldFiltersVOHandler from "../handlers/FieldFiltersVOHandler";
import IReadableFieldFilters from "../interfaces/IReadableFieldFilters";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import TableColumnDescVO from "../vos/TableColumnDescVO";
import VOFieldRefVO from '../vos/VOFieldRefVO';
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import VOFieldRefVOManager from "./VOFieldRefVOManager";
import WidgetOptionsVOManager from "./WidgetOptionsVOManager";

/**
 * FieldFiltersVOManager
 *  - Must likely alter and return field filters like FieldFiltersVO
 */
export default class FieldFiltersVOManager {

    public static get_INTERSECTION_field_filters(
        field_filters: FieldFiltersVO | { [label: string]: IReadableFieldFilters },
        field_filters_to_intersect: FieldFiltersVO | { [label: string]: IReadableFieldFilters }): FieldFiltersVO | { [label: string]: IReadableFieldFilters } {

        const res: FieldFiltersVO | { [label: string]: IReadableFieldFilters } = {};

        for (const api_type_id in field_filters) {
            if (!field_filters_to_intersect[api_type_id]) {
                continue;
            }

            const fields = {};

            for (const field_id in field_filters[api_type_id]) {
                if (typeof field_filters_to_intersect[api_type_id][field_id] === 'undefined') {
                    continue;
                }

                fields[field_id] = field_filters[api_type_id][field_id];
            }

            if (Object.keys(fields).length > 0) {
                res[api_type_id] = fields;
            }
        }

        return res;
    }

    /**
     * find_default_field_filters_by_dashboard_page_id
     * - This method is responsible for loading the default field_filters of the given dashboard_page id
     * - Default field_filters are the field_filters of each page_widget_options that have been preconfigured by the admin user
     *
     * @param {number} dashboard_page_id
     * @param options
     * @returns {Promise<FieldFiltersVO>}
     */
    public static async find_default_field_filters_by_dashboard_page_id(
        dashboard_page_id: number,
        options?: {
            refresh?: boolean,
            keep_empty_context_filter?: boolean,
        }
    ): Promise<FieldFiltersVO> {
        // const self = DashboardPageVOManager.getInstance();

        // Default field_filters from each page widget_options
        let default_field_filters: FieldFiltersVO = {};

        // Get widgets of the given favorites filters page
        const page_widgets: DashboardPageWidgetVO[] = await DashboardPageWidgetVOManager.find_page_widgets_by_page_id(
            dashboard_page_id,
            { refresh: options?.refresh }
        );

        // Get all widgets_types
        const widgets_types = await WidgetOptionsVOManager.find_all_sorted_widgets_types();

        // Create Default FieldFilters from each page_widget
        for (const key in widgets_types) {
            const widget = widgets_types[key];

            // Get Default fields filters
            page_widgets.filter((page_widget: DashboardPageWidgetVO) => {
                // page_widget must have json_options to continue
                const has_json_options = page_widget.json_options?.length > 0;
                const has_widget_id = page_widget.widget_id === widget.id;

                return has_widget_id && has_json_options;
            }).map((page_widget: DashboardPageWidgetVO) => {
                const json_options = JSON.parse(page_widget.json_options ?? '{}');

                let widget_options: any = null;

                try {
                    widget_options = WidgetOptionsVOManager.create_widget_options_vo_by_name(
                        widget.name,
                        json_options
                    );
                } catch (e) {

                }

                // We must have widget_options to keep proceed
                if (!widget_options) {
                    return;
                }

                const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                    widget_options
                );

                // context_filter must be a ContextFilterVO
                // context_filter will be null if the widget_options does not have prefilled default options
                const context_filter: ContextFilterVO = WidgetOptionsVOManager.create_context_filter_from_widget_options(
                    widget.name,
                    widget_options
                );

                // We must transform this ContextFilterVO into FieldFiltersVO
                if (
                    vo_field_ref &&
                    (context_filter || options?.keep_empty_context_filter)
                ) {
                    default_field_filters = FieldFiltersVOManager.merge_field_filters_with_context_filter(
                        default_field_filters,
                        vo_field_ref,
                        context_filter
                    );
                }
            });
        }

        return ObjectHandler.sort_by_key<FieldFiltersVO>(
            default_field_filters
        );
    }

    /**
     * Create Readable Filters Text From Field Filters
     *  - For each field filters get as Human readable filters
     *
     * @return {{ [translatable_label_code: string]: IReadableFieldFilters }}
     */
    public static async create_readable_filters_text_from_field_filters(
        field_filters: FieldFiltersVO,
        page_id?: number // Case when we need to be specific to a page (TODO: should always be specific)
    ): Promise<{ [translatable_label_code: string]: IReadableFieldFilters }> {

        field_filters = cloneDeep(field_filters);

        const translations = await TranslationManager.get_all_flat_locale_translations();

        // Get all required filters props from widgets_options
        let field_filters_porps: Array<{ is_filter_hidden: boolean, vo_field_ref: VOFieldRefVO }> = [];

        const human_readable_field_filters: {
            [translatable_label_code: string]: IReadableFieldFilters
        } = {};

        if (page_id != null) {
            // Get all widgets_options of the given dashboard_page id
            const widgets_options = await DashboardPageWidgetVOManager.find_all_widgets_options_by_page_id(
                page_id
            );

            // Get all field_filters_porps from widgets_options
            field_filters_porps = widgets_options.map((widget_options) => {
                const vo_field_ref: VOFieldRefVO = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                    widget_options,
                );

                return {
                    is_filter_hidden: widget_options.hide_filter ?? false,
                    vo_field_ref,
                };
            });
        }

        for (const api_type_id in field_filters) {
            const filters = field_filters[api_type_id];

            for (const field_id in filters) {
                // The actual context_filter
                const context_filter = filters[field_id];

                let vo_field_ref: VOFieldRefVO = null;
                let is_filter_hidden: boolean = false;

                // Path to find the actual filter
                if (field_filters_porps?.length > 0) {

                    // Find vo_field_ref_vo from vo_field_ref_vos
                    const field_filters_prop = field_filters_porps.find((props) => {
                        const _vo_field_ref = props.vo_field_ref;

                        const has_api_type_id = _vo_field_ref?.api_type_id == api_type_id;
                        const has_field_id = _vo_field_ref?.field_id == field_id;

                        return has_api_type_id && has_field_id;
                    });

                    is_filter_hidden = field_filters_prop?.is_filter_hidden ?? false;
                    vo_field_ref = field_filters_prop?.vo_field_ref ?? null;
                }

                if (!vo_field_ref) {
                    vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                        { vo_field_ref: { api_type_id, field_id } }
                    );
                }

                // The actual label of the filter
                const label_code_text: string = await VOFieldRefVOManager.create_readable_vo_field_ref_label(
                    vo_field_ref,
                    page_id
                );

                const label: string = translations[label_code_text] ?? label_code_text;

                // Get HMI readable active field filters
                const readable_context_filters = ContextFilterVOHandler.context_filter_to_readable_ihm(
                    context_filter
                );
                const readable_field_filters = readable_context_filters;

                human_readable_field_filters[label] = {
                    readable_field_filters, // TODO: to be removed (deprecated)
                    readable_context_filters,
                    is_filter_hidden,
                    label_code_text,
                    context_filter,
                    vo_field_ref,
                    label,
                };
            }
        }

        // Sort by label (alphabetical order)
        return ObjectHandler.sort_by_key<{ [translatable_label_code: string]: IReadableFieldFilters }>(
            human_readable_field_filters
        );
    }

    /**
     * merge_readable_field_filters
     * - Merge readable_field_filters with each other
     *
     * @param {{ [translatable_label_code: string]: IReadableFieldFilters }} from_readable_field_filters
     * @param {{ [translatable_label_code: string]: IReadableFieldFilters }} with_readable_field_filters
     * @returns {{ [translatable_label_code: string]: IReadableFieldFilters }}
     */
    public static merge_readable_field_filters(
        from_readable_field_filters: { [translatable_label_code: string]: IReadableFieldFilters },
        with_readable_field_filters: { [translatable_label_code: string]: IReadableFieldFilters }
    ): { [translatable_label_code: string]: IReadableFieldFilters } {

        const readable_field_filters: {
            [translatable_label_code: string]: IReadableFieldFilters
        } = cloneDeep(from_readable_field_filters);

        for (const label in with_readable_field_filters) {
            const readable_filters = readable_field_filters[label];

            if (!readable_filters) {
                readable_field_filters[label] = with_readable_field_filters[label];
            }
        }

        return readable_field_filters;
    }

    /**
     * clean_field_filters_for_request
     *  - Clone and remove custom_filters
     *
     * @returns {FieldFiltersVO}
     */
    public static clean_field_filters_for_request(
        field_filters: FieldFiltersVO,
        options?: { should_restrict_to_api_type_id: boolean },
    ): FieldFiltersVO {

        const field_filter: FieldFiltersVO = cloneDeep(field_filters);

        if (field_filter) {
            delete field_filter[ContextFilterVO.CUSTOM_FILTERS_TYPE];
        }

        // if (options?.should_restrict_to_api_type_id) {
        //     // On ajoute un filtrage des filtres incompatibles avec la requête classique
        //     // Avoid to have context_filter query on other api_type_id
        //     field_filter = FieldFiltersVOManager.filter_field_filters_by_it_own_api_type_id(field_filter);
        // }

        return field_filter;
    }

    /**
     * Merge Field Filters With Context Filters
     *
     * @param {FieldFiltersVO} from_field_filters
     * @param {{ field_id: string, api_type_id: string }} vo_field_ref
     * @param {ContextFilterVO} context_filter
     * @returns {FieldFiltersVO}
     */
    public static merge_field_filters_with_context_filter(
        from_field_filters: FieldFiltersVO,
        vo_field_ref: { field_id: string, api_type_id: string },
        context_filter: ContextFilterVO,
        options?: {
            keep_empty_context_filter?: boolean
        }
    ): FieldFiltersVO {

        const field_filters: FieldFiltersVO = cloneDeep(from_field_filters);

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
     * @param {FieldFiltersVO} from_field_filters
     * @param {FieldFiltersVO} with_field_filters
     * @returns {FieldFiltersVO}
     */
    public static merge_field_filters(
        from_field_filters: FieldFiltersVO,
        with_field_filters: FieldFiltersVO,
        options?: {
            keep_empty_context_filter?: boolean
        }
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO; }; } {

        let field_filters: FieldFiltersVO = cloneDeep(from_field_filters);

        for (const api_type_id in with_field_filters) {
            const filters = with_field_filters[api_type_id];

            for (const field_id in filters) {
                const context_filter = filters[field_id];

                if (!context_filter && !options?.keep_empty_context_filter) {
                    continue;
                }

                // Add default context filters
                field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
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
     * @param {FieldFiltersVO} from_field_filters
     * @param {{ field_id: string, api_type_id: string }} vo_field_ref
     * @param {ContextFilterVO} context_filter
     * @returns {FieldFiltersVO}
     */
    public static overwrite_field_filters_with_context_filter(
        from_field_filters: FieldFiltersVO,
        vo_field_ref: { field_id: string, api_type_id: string },
        context_filter: ContextFilterVO
    ): FieldFiltersVO {

        const field_filters: FieldFiltersVO = cloneDeep(from_field_filters);

        field_filters[vo_field_ref.api_type_id] = field_filters[vo_field_ref.api_type_id] ?? {};
        field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = context_filter;

        return field_filters;
    }

    /**
     * get_context_filter_from_field_filters
     * - Get the context_filter from the given field_filters
     *
     * @TODO: I would rather use it in ContextFilterVOManager
     *
     * @param {FieldFiltersVO} field_filters
     * @param {VOFieldRefVO} vo_field_ref
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_field_filters(
        vo_field_ref: VOFieldRefVO,
        field_filters: FieldFiltersVO,
    ): ContextFilterVO {

        let context_filter: ContextFilterVO = null;

        const is_field_filters_empty = FieldFiltersVOHandler.is_field_filters_empty(
            vo_field_ref,
            field_filters
        );

        if (!is_field_filters_empty) {
            const api_type_id = vo_field_ref.api_type_id;
            const field_id = vo_field_ref.field_id;

            context_filter = field_filters[api_type_id][field_id];
        }

        return context_filter;
    }

    /**
     * get_context_filter_by_widget_options_from_field_filters
     *
     * @param {any} widget_options
     * @param {FieldFiltersVO} field_filters
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_by_widget_options_from_field_filters(
        widget_options: any,
        field_filters: FieldFiltersVO,
    ): ContextFilterVO {

        if (!widget_options) {
            return null;
        }

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            widget_options
        );

        const context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_from_field_filters(
            vo_field_ref,
            field_filters
        );

        return context_filter;
    }

    /**
     * Update field_filters by required api type ids
     * - The aim of this function is to update and return field_filters for each given api_type_id
     * - /!\ Updating is not filtering, in this way we are actually updating the context_filter.vo_type with the required api_type_id
     *
     * @param {any} widget_options
     * @param {FieldFiltersVO} active_field_filters
     * @param {string[]} required_api_type_ids - The api_type_ids that are required for the current widget
     * @param {string[]} all_possible_api_type_ids  - The api_type_ids that are possible to update for the current widget
     * @returns {{ [api_type_id: string]: FieldFiltersVO}
     */
    public static update_field_filters_for_required_api_type_ids(
        widget_options: any,
        active_field_filters: FieldFiltersVO,
        required_api_type_ids: string[],
        all_possible_api_type_ids: string[],
        options?: {},
    ): { [api_type_id: string]: FieldFiltersVO } {

        active_field_filters = cloneDeep(active_field_filters);

        const field_filters_by_api_type_ids: {
            [api_type_id: string]: FieldFiltersVO
        } = {};

        // Remove unwanted field_filters (e.g. "__custom_filters__")
        const field_filters_for_request: {
            [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        } = FieldFiltersVOManager.clean_field_filters_for_request(
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

            for (const key_j in required_api_type_ids) {
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
                    const base_table: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[api_type_id];
                    const base_table_fields: ModuleTableFieldVO[] = base_table.get_fields();

                    const has_context_filter_field: boolean = base_table_fields.find((field: ModuleTableFieldVO) => {
                        return field.field_id == context_filter.field_name;
                    }) != null;

                    if (!has_context_filter_field) {
                        continue;
                    }

                    if (field_filters_by_api_type_ids[api_type_id][api_type_id]) {
                        // In this case the field_filters are already set for this api_type_id
                        // We must merge the two field_filters
                        field_filters_by_api_type_ids[api_type_id] = FieldFiltersVOManager.merge_field_filters_with_context_filter(
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
     * @param {FieldFiltersVO} active_field_filters
     * @param {string[]} api_type_ids_to_exclude  - The api_type_ids to exclude from the active_field_filters
     * @returns { FieldFiltersVO}
     */
    public static filter_field_filters_by_api_type_ids_to_exlude(
        widget_options: any,
        active_field_filters: FieldFiltersVO,
        api_type_ids_to_exclude: string[],
    ): FieldFiltersVO {

        active_field_filters = cloneDeep(active_field_filters);

        const excluded_field_filters: FieldFiltersVO = {};

        // Remove unwanted field_filters (e.g. "__custom_filters__")
        const field_filters_for_request: {
            [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        } = FieldFiltersVOManager.clean_field_filters_for_request(
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
     * @param {FieldFiltersVO} active_field_filters
     * @returns FieldFiltersVO
     */
    public static filter_field_filters_by_it_own_api_type_id(
        active_field_filters: FieldFiltersVO
    ): FieldFiltersVO {

        for (const api_type_id in active_field_filters) {

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            const field_filters = active_field_filters[api_type_id];
            for (const field_id in field_filters) {
                const context_filter = field_filters[field_id];

                if (!context_filter) {
                    continue;
                }

                field_filters[field_id] = ContextFilterVOManager.filter_context_filter_tree_by_vo_type(
                    context_filter,
                    api_type_id
                );
            }
        }

        return active_field_filters;
    }

    /**
     * Filter field_filters by api_type_id
     * - The aim of this function is to filter_field_filters by api_type_id (or vo_type)
     * - We should olso only keep all context_filters that actually filter on the given api_type_id (or vo_type)
     *
     * @param {FieldFiltersVO} active_field_filters
     * @param {string[]} available_api_type_ids all available api type ids
     * @param {string} api_type_id API type id (or vo_type)
     * @returns { FieldFiltersVO}
     */
    public static filter_field_filters_by_api_type_id(
        active_field_filters: FieldFiltersVO,
        available_api_type_ids: string[],
        api_type_id: string
    ): FieldFiltersVO {

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
     * @param {FieldFiltersVO} active_field_filters
     * @returns {FieldFiltersVO}
     */
    public static filter_visible_field_filters(
        widgets_options: any[],
        active_field_filters: FieldFiltersVO,
    ): FieldFiltersVO {

        active_field_filters = cloneDeep(active_field_filters);

        for (const key in widgets_options) {
            const options = widgets_options[key];

            const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                options
            );

            if (!vo_field_ref?.api_type_id || !vo_field_ref?.field_id) {
                continue;
            }

            if (options.hide_filter) {
                if (!FieldFiltersVOManager.is_field_filters_empty(options, active_field_filters)) {
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
     * @deprecated use FieldFiltersVOHandler.is_field_filters_empty instead
     *  TODO: checking have to in the FieldFiltersVOHandler
     *        but create_vo_field_ref_vo_from_widget_options have to be in the VOFieldRefVOManager
     *        It may have a circular dependency between FieldFiltersVOHandler and VOFieldRefVOManager
     *        So we have to find a way to avoid this circular dependency
     *
     * @param {any} widget_options
     * @param {FieldFiltersVO} active_field_filters
     * @returns boolean
     */
    public static is_field_filters_empty(
        widget_options: any,
        active_field_filters: FieldFiltersVO
    ): boolean {

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            widget_options
        );

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

    /**
     * Filtrage des colonnes en fonction des filtrages actuels et de l'utilisateur actuel
     * @param column
     * @returns true if the column is filtered (invalid - should not be used)
     */
    public static is_column_filtered(
        column: TableColumnDescVO,
        filter_by_access_cache: { [access_name: string]: boolean },
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }): boolean {

        /**
         * Gestion du check des droits
         */
        if (column.filter_by_access && !filter_by_access_cache[column.filter_by_access]) {
            return true;
        }

        /**
         * Gestion du check de présence d'un filtrage
         */
        if (column.show_if_any_filter_active && column.show_if_any_filter_active.length) {

            let activated = false;
            for (const j in column.show_if_any_filter_active) {
                const page_filter_id = column.show_if_any_filter_active[j];

                const page_widget = all_page_widgets_by_id[page_filter_id];
                if (!page_widget) {
                    column.show_if_any_filter_active = [];
                    break;
                }
                const page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                if ((!active_field_filters) ||
                    (!active_field_filters[page_widget_options.vo_field_ref.api_type_id]) ||
                    (!active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id])) {
                    continue;
                }

                activated = true;
            }

            if (!activated) {
                return true;
            }
        }

        /**
         * Gestion du check d'absence d'un filtrage
         */
        if (column.hide_if_any_filter_active && column.hide_if_any_filter_active.length) {

            let activated = false;
            for (const j in column.hide_if_any_filter_active) {
                const page_filter_id = column.hide_if_any_filter_active[j];

                const page_widget = all_page_widgets_by_id[page_filter_id];
                if (!page_widget) {
                    column.hide_if_any_filter_active = [];
                    break;
                }
                const page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                if ((!active_field_filters) ||
                    (!active_field_filters[page_widget_options.vo_field_ref.api_type_id]) ||
                    (!active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id])) {
                    continue;
                }

                activated = true;
            }

            if (activated) {
                return true;
            }
        }

        return false;
    }
}
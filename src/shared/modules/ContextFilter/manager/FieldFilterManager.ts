import { cloneDeep } from "lodash";
import { ContextFilterVOHandler } from "../handler/ContextFilterVOHandler";
import { ContextFilterVOManager } from "./ContextFilterVOManager";
import ContextFilterVO from "../vos/ContextFilterVO";


/**
 * @class FieldFilterManager
 *  - Must likely alter and return field filters like { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
 */
export class FieldFilterManager {

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
     * Overwrite Filters With Context Filters
     *
     * @deprecated I would rather user ObjectHandler.deepmerge
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
     * /!\ Updating is not filtering, in this way we are actually updating the context_filter.vo_type with the required api_type_id
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} available_api_type_ids - The api_type_ids that are available for the current widget
     * @param {string[]} required_api_type_ids  - The api_type_ids that are required for the current widget
     * @returns {{ [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } }}
     */
    public static update_field_filters_for_required_api_type_ids(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        available_api_type_ids: string[],
        required_api_type_ids: string[],
    ): { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } {

        let field_filters_by_api_type_ids: {
            [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
        } = {};

        if (!widget_options.no_inter_filter) {
            active_field_filters = FieldFilterManager.clean_field_filters_for_request(
                active_field_filters,
                { should_restrict_to_api_type_id: true }
            );
        }

        // Remove unwanted field_filters (e.g. "__custom_filters__")
        const field_filters_for_request: {
            [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        } = FieldFilterManager.clean_field_filters_for_request(
            active_field_filters
        );

        // Check whether the given field_filters_for_request are compatible with the required_api_type_ids
        // If not, we must reject the field_filters_for_request
        // At least one of the required_api_type_ids must be present in the field_filters_for_request
        const api_type_ids_for_request = Object.keys(field_filters_for_request).filter((api_type_id: string) => {
            return required_api_type_ids.includes(api_type_id);
        });

        for (const key in api_type_ids_for_request) {

            // We must apply the context_filters of the actual filtering on this api_type_id
            // to all of the required_api_type_ids
            const api_type_id_for_request: string = api_type_ids_for_request[key];

            for (let i in available_api_type_ids) {
                const api_type_id: string = available_api_type_ids[i];

                const field_filters: { [field_id: string]: ContextFilterVO } = cloneDeep(field_filters_for_request[api_type_id_for_request]);

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


                    if (field_filters_by_api_type_ids[api_type_id][api_type_id]) {
                        // In this case the field_filters are already set for this api_type_id
                        // We must merge the two field_filters
                        // TODO: - Merge the two field_filters
                        // TODO: - Check if the api_type_id (or vo_type) actually have the field_id to filter on
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
     * - The aim of this function is to filter field filters by api_type_id (or vo_type)
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

        for (const i in available_api_type_ids) {
            const available_api_type_id = available_api_type_ids[i];

            if (available_api_type_id != api_type_id) {
                delete active_field_filters[available_api_type_id];
            }

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            const field_filters = active_field_filters[available_api_type_id];
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
}
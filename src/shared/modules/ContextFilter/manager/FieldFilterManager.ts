import { cloneDeep } from "lodash";
import ContextFilterVOHandler from "../handler/ContextFilterVOHandler";
import ContextFilterVOManager from "./ContextFilterVOManager";
import ContextFilterVO from "../vos/ContextFilterVO";


/**
 * @class FieldFilterManager
 *  - Must likely alter and return field filters like { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
 */
export default class FieldFilterManager {

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
     * Create field filters from available api type ids
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} required_api_type_ids
     * @param {boolean} [options.switch_current_field]
     * @param {string[]} [options.query_api_type_ids]
     * @returns {{ [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } }}
     */
    public static get_field_filters_by_required_api_type_ids(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        required_api_type_ids: string[],
        options?: {
            switch_current_field?: boolean,
            query_api_type_ids?: string[],
        }
    ): { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } {

        let field_filter: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = {};

        if (!widget_options.no_inter_filter) {
            active_field_filters = active_field_filters;
        }

        let context_filters_for_request: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = ContextFilterVOManager.clean_field_filters_for_request(
            active_field_filters
        );

        for (let api_type_id in context_filters_for_request) {

            for (let i in required_api_type_ids) {
                let api_type_id_sup: string = required_api_type_ids[i];

                if (!field_filter[api_type_id_sup]) {
                    field_filter[api_type_id_sup] = {};
                }

                if (!options?.query_api_type_ids?.includes(api_type_id)) {
                    field_filter[api_type_id_sup][api_type_id] = context_filters_for_request[api_type_id];
                    continue;
                }

                let new_api_type_id: string = api_type_id_sup;

                if (widget_options.force_filter_by_all_api_type_ids) {
                    new_api_type_id = api_type_id;
                }

                field_filter[api_type_id_sup][new_api_type_id] = cloneDeep(context_filters_for_request[api_type_id]);

                for (let field_id in field_filter[api_type_id_sup][new_api_type_id]) {
                    // Si je suis sur le field de la requête, je ne le prend pas en compte, il sera fait plus loin
                    if (options?.switch_current_field && (field_id == widget_options.vo_field_ref?.field_id)) {
                        field_filter[api_type_id_sup][new_api_type_id][field_id] = null;
                        continue;
                    }

                    if (!field_filter[api_type_id_sup][new_api_type_id][field_id]) {
                        continue;
                    }

                    field_filter[api_type_id_sup][new_api_type_id][field_id].vo_type = api_type_id_sup;
                }
            }
        }

        return field_filter;
    }
}
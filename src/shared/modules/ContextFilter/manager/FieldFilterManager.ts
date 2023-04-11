import { cloneDeep } from "lodash";
import ContextFilterHandler from "../ContextFilterHandler";
import ContextFilterVO from "../vos/ContextFilterVO";


/**
 * @class FieldFilterManager
 *  - Must likely alter and return field filters like { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
 */
export class FieldFilterManager {

    /**
     * Create custom active field filters from available api type ids
     *
     * @param {any} widget_options
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} available_api_type_ids
     * @param {boolean} [options.switch_current_field]
     * @param {string[]} [options.query_api_type_ids]
     * @returns {{ [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } }}
     */
    public static create_custom_active_field_filters_from_available_api_type_ids(
        widget_options: any,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        available_api_type_ids: string[],
        options?: {
            switch_current_field?: boolean,
            query_api_type_ids?: string[],
        }
    ): { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } {
        let field_filter: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = {};

        if (!widget_options.no_inter_filter) {
            active_field_filters = active_field_filters;
        }

        let context_filters_for_request: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = ContextFilterHandler.getInstance().clean_context_filters_for_request(
            active_field_filters
        );

        for (let api_type_id in context_filters_for_request) {

            for (let i in available_api_type_ids) {
                let api_type_id_sup: string = available_api_type_ids[i];

                if (!field_filter[api_type_id_sup]) {
                    field_filter[api_type_id_sup] = {};
                }

                if (!options?.query_api_type_ids?.includes(api_type_id)) {
                    field_filter[api_type_id_sup][api_type_id] = context_filters_for_request[api_type_id];
                    continue;
                }

                let new_api_type_id: string = api_type_id_sup;

                if (widget_options.force_filter_all_api_type_ids) {
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
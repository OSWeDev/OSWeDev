import { cloneDeep } from "lodash";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO, { filter } from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO, { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import ModuleVar from "../../Var/ModuleVar";
import VarsController from "../../Var/VarsController";
import VarDataBaseVO from "../../Var/vos/VarDataBaseVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import VarLineChartWidgetOptionsVO from "../vos/VarLineChartWidgetOptionsVO";
import VarPieChartWidgetOptionsVO from "../vos/VarPieChartWidgetOptionsVO";
import FieldFiltersVOManager from "./FieldFiltersVOManager";
import FieldValueFilterWidgetManager from "./FieldValueFilterWidgetManager";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import { all_promises } from "../../../tools/PromiseTools";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import RangeHandler from "../../../tools/RangeHandler";
import Dates from "../../FormatDatesNombres/Dates/Dates";


export default class VarChartWidgetManager {

    /**
     * When dimension is a vo_field_ref, we need to get the var params for each dimension value
     *  - Load the dimension values from the database
     *
     * @param dashboard_api_type_ids
     * @param field_filters
     * @param var_custom_filters
     * @param widget_options
     * @param discarded_field_paths
     * @returns {Promise<{var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO }, ordered_dimension: number[], label_by_index: { [index: string]: string }}>}
     */
    public static async get_var_params_by_dimension_when_is_vo_field_ref_dimension(
        dashboard_api_type_ids: string[],
        field_filters: FieldFiltersVO,
        var_custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        widget_options: VarLineChartWidgetOptionsVO | VarPieChartWidgetOptionsVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ): Promise<{
        var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO },
        ordered_dimension: number[],
        label_by_index: { [index: string]: string }
    }> {

        if ((!widget_options.var_id_1) || !VarsController.var_conf_by_id[widget_options.var_id_1]) {
            return null;
        }

        const var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

        /**
         * Si la dimension est un champ de référence, on va chercher les valeurs possibles du champs en fonction des filtres actifs
         */
        const context_query: ContextQueryVO = query(widget_options.dimension_vo_field_ref.api_type_id)
            .set_limit(widget_options.max_dimension_values)
            .using(dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, discarded_field_paths);

        if (widget_options.sort_dimension_by_vo_field_ref) {
            context_query.set_sort(new SortByVO(
                widget_options.sort_dimension_by_vo_field_ref.api_type_id,
                widget_options.sort_dimension_by_vo_field_ref.field_id,
                widget_options.sort_dimension_by_asc
            ));
        }

        const dimensions = await context_query.select_vos(); // on query tout l'objet pour pouvoir faire les labels des dimensions si besoin .field(widget_options.dimension_vo_field_ref.field_id)

        const label_by_index: { [index: string]: string } = {};
        const ordered_dimension: number[] = [];
        const promises = [];

        const dimension_table = (widget_options.dimension_is_vo_field_ref && widget_options.dimension_vo_field_ref.api_type_id) ?
            VOsTypesManager.moduleTables_by_voType[widget_options.dimension_vo_field_ref.api_type_id] : null;

        for (let i in dimensions) {
            const dimension: any = dimensions[i];
            const dimension_value: number = dimension[widget_options.dimension_vo_field_ref.field_id];

            ordered_dimension.push(dimension_value);

            promises.push((async () => {

                /**
                 * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
                 */
                let active_field_filters = cloneDeep(field_filters);
                if (!active_field_filters) {
                    active_field_filters = {};
                }

                if (!active_field_filters[widget_options.dimension_vo_field_ref.api_type_id]) {
                    active_field_filters[widget_options.dimension_vo_field_ref.api_type_id] = {};
                }

                active_field_filters[widget_options.dimension_vo_field_ref.api_type_id][widget_options.dimension_vo_field_ref.field_id] = filter(
                    widget_options.dimension_vo_field_ref.api_type_id, widget_options.dimension_vo_field_ref.field_id
                ).by_num_has([dimension_value]);

                var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[widget_options.var_id_1].name,
                    active_field_filters,
                    var_custom_filters,
                    dashboard_api_type_ids,
                    discarded_field_paths
                );

                if (!var_params_by_dimension[dimension_value]) {
                    // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                    ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                    return;
                }

                let label = null;

                if (dimension_table && dimension_table.default_label_field) {
                    label = dimension[dimension_table.default_label_field.field_id];
                } else if (dimension_table && dimension_table.table_label_function) {
                    label = dimension_table.table_label_function(dimension);
                }

                label_by_index[var_params_by_dimension[dimension_value].index] = label;

            })());
        }

        await all_promises(promises);

        return {
            var_params_by_dimension,
            ordered_dimension,
            label_by_index,
        };
    }

    /**
     * When dimension is a custom filter, we need to get the var params for each dimension value
     *  - The custom filter is must likely a date filter
     *
     * @param {{ [var_param_field_name: string]: ContextFilterVO }} var_custom_filters
     * @returns {Promise<{[dimension_value: number]: VarDataBaseVO}>}
     */
    public static async get_var_params_by_dimension_when_is_custom_filter_dimension(
        dashboard_api_type_ids: string[],
        field_filters: FieldFiltersVO,
        var_custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        widget_options: VarLineChartWidgetOptionsVO | VarPieChartWidgetOptionsVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ): Promise<{
        var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO },
        ordered_dimension: number[],
        label_by_index: { [index: string]: string }
    }> {

        if ((!widget_options.var_id_1) || !VarsController.var_conf_by_id[widget_options.var_id_1]) {
            return null;
        }

        let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

        /**
         * Sinon on se base sur la liste des valeurs possibles pour la dimension segmentée
         */
        if (!widget_options.dimension_custom_filter_name) {
            return null;
        }

        if (!widget_options.filter_custom_field_filters_1) {
            return null;
        }

        /**
         * On checke qu'on a bien une dimension de la var dont la correspondance en filtrage spécifique est le filtre de dimension
         */
        let found: boolean = false;
        for (let field_id in widget_options.filter_custom_field_filters_1) {
            let custom_filter_1 = widget_options.filter_custom_field_filters_1[field_id];

            if (custom_filter_1 == widget_options.dimension_custom_filter_name) {
                found = true;
                break;
            }
        }

        if (!found) {
            return null;
        }

        /**
         * On défini ensuite la liste des valeurs possibles pour la dimension
         *  on est sur des dates, donc on cherche à savoir les dates valides suivant les filtrages actuels (les ranges valides)
         *  puis on itère sur ces ranges en fonction de la segmentation sélectionnée
         *  en limitant au nombre max de valeurs de dimension
         */
        const dimension_values: number[] = VarChartWidgetManager.get_dimension_values_from_field_filter(
            widget_options,
            field_filters,
        );

        const label_by_index: { [index: string]: string } = {};
        const ordered_dimension = dimension_values;
        const promises = [];

        for (let i in dimension_values) {
            const dimension_value: number = dimension_values[i];

            promises.push((async () => {

                /**
                 * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
                 */
                const active_field_filters = cloneDeep(field_filters);

                active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][widget_options.dimension_custom_filter_name] = filter(
                    ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    widget_options.dimension_custom_filter_name
                ).by_date_x_ranges([RangeHandler.create_single_elt_TSRange(dimension_value, widget_options.dimension_custom_filter_segment_type)]);

                let update_var_custom_filters = cloneDeep(var_custom_filters);
                if (field_filters && field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] &&
                    field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][widget_options.dimension_custom_filter_name]) {

                    for (const field_name in widget_options.filter_custom_field_filters_1) {

                        const custom_filter_name = widget_options.filter_custom_field_filters_1[field_name];

                        if (custom_filter_name == widget_options.dimension_custom_filter_name) {
                            if (!update_var_custom_filters) {
                                update_var_custom_filters = {};
                            }
                            update_var_custom_filters[field_name] = active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][widget_options.dimension_custom_filter_name];
                        }
                    }
                }

                var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[widget_options.var_id_1].name,
                    active_field_filters,
                    update_var_custom_filters,
                    dashboard_api_type_ids,
                    discarded_field_paths
                );

                if (!var_params_by_dimension[dimension_value]) {
                    // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                    ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                    return;
                }

                label_by_index[var_params_by_dimension[dimension_value].index] = Dates.format_segment(dimension_value, widget_options.dimension_custom_filter_segment_type);
            })());
        }

        await all_promises(promises);

        return {
            var_params_by_dimension,
            ordered_dimension,
            label_by_index,
        };
    }

    /**
     * A voir si c'est la bonne méthode pas évident.
     *  Pour le moment on prend les filtres potentiels en diminuant la granularité petit à petit
     *  on est sur du custom filter
     *
     * @returns {number[]}
     */
    public static get_dimension_values_from_field_filter(
        widget_options: VarLineChartWidgetOptionsVO | VarPieChartWidgetOptionsVO,
        field_filter: FieldFiltersVO,
    ): number[] {

        // On récupère le root du filtrage
        let root_context_filter: ContextFilterVO = null;
        if (!widget_options.dimension_custom_filter_name) {
            return null;
        }

        root_context_filter = field_filter[ContextFilterVO.CUSTOM_FILTERS_TYPE] ?
            field_filter[ContextFilterVO.CUSTOM_FILTERS_TYPE][widget_options.dimension_custom_filter_name] : null;

        /** Si on a pas de filtre, on peut pas connaître les bornes, donc on refuse */
        if (!root_context_filter) {
            return null;
        }

        const ts_ranges = ContextFilterVOHandler.get_ts_ranges_from_context_filter_root(
            root_context_filter,
            widget_options.dimension_custom_filter_segment_type,
            widget_options.max_dimension_values,
            widget_options.sort_dimension_by_asc
        );

        const dimension_values: number[] = [];

        RangeHandler.foreach_ranges_sync(ts_ranges, (d: number) => {
            dimension_values.push(d);
        }, widget_options.dimension_custom_filter_segment_type, null, null, !widget_options.sort_dimension_by_asc);

        return dimension_values;
    }
}
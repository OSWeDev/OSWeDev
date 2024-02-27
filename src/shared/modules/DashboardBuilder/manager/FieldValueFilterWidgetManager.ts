import ConsoleHandler from "../../../tools/ConsoleHandler";
import RangeHandler from "../../../tools/RangeHandler";
import TypesHandler from "../../../tools/TypesHandler";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVOHandler from "../../ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../ContextFilter/vos/ContextQueryVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import ModuleTableVO from "../../ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../ModuleTableFieldVO";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import VOFieldRefVOHandler from "../handlers/VOFieldRefVOHandler";
import BooleanFilterModel from "../models/BooleanFilterModel";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import VOFieldRefVO from "../vos/VOFieldRefVO";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";

/**
 * FieldValueFilterWidgetManager
 *  - This class is used to manage the field value filter widget
 */
export default class FieldValueFilterWidgetManager {

    /**
     * Create Context Filter From Field Value Filter Widget Options
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(
        widget_options: FieldValueFilterWidgetOptionsVO,
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        let vo_field_ref = widget_options?.vo_field_ref;

        if (VOFieldRefVOHandler.is_type_boolean(vo_field_ref)) {
            const default_filters_options = widget_options?.default_boolean_values;
            context_filter = FieldValueFilterWidgetManager.create_context_filter_from_boolean_filter_types(
                vo_field_ref,
                default_filters_options
            );
        }

        if (VOFieldRefVOHandler.is_type_date(vo_field_ref)) {
            let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
            let field = moduletable.get_field_by_id(vo_field_ref.field_id);

            const default_filters_options = widget_options?.default_ts_range_values;

            context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                null,
                default_filters_options,
                field,
                vo_field_ref
            );
        }

        if (VOFieldRefVOHandler.is_type_enum(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = FieldValueFilterWidgetManager.create_context_filter_from_enum_filter_types(
                vo_field_ref,
                default_filters_options
            );
        }

        if (VOFieldRefVOHandler.is_type_number(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = FieldValueFilterWidgetManager.create_context_filter_from_number_filter_types(
                vo_field_ref,
                default_filters_options
            );
        }

        if (VOFieldRefVOHandler.is_type_string(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = FieldValueFilterWidgetManager.create_context_filter_from_string_filter_options(
                vo_field_ref,
                default_filters_options,
                { vo_field_ref }
            );
        }

        return context_filter;
    }

    /**
     * Create Context Filter From Boolean Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [boolean_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_boolean_filter_types(
        vo_field_ref: VOFieldRefVO,
        boolean_filter_options: number[]
    ): ContextFilterVO {
        let filter = null;

        for (let i in boolean_filter_options) {
            let boolean_filter_type = boolean_filter_options[i];

            let this_filter = new ContextFilterVO();
            this_filter.field_id = vo_field_ref.field_id;
            this_filter.vo_type = vo_field_ref.api_type_id;

            if (boolean_filter_type == BooleanFilterModel.FILTER_TYPE_TRUE) {
                this_filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY;

            } else if (boolean_filter_type == BooleanFilterModel.FILTER_TYPE_FALSE) {
                this_filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY;

            } else if (boolean_filter_type == BooleanFilterModel.FILTER_TYPE_VIDE) {
                this_filter.filter_type = ContextFilterVO.TYPE_NULL_ANY;
            }

            if (!filter) {
                filter = this_filter;
            } else {
                let or = new ContextFilterVO();
                or.field_id = vo_field_ref.field_id;
                or.vo_type = vo_field_ref.api_type_id;
                or.filter_type = ContextFilterVO.TYPE_FILTER_OR;
                or.left_hook = filter;
                or.right_hook = this_filter;

                filter = or;
            }
        }

        return filter;
    }

    /**
     * Create Context Filter From Enum Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [enum_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_enum_filter_types(
        vo_field_ref: VOFieldRefVO,
        enum_filter_options: DataFilterOption[]
    ): ContextFilterVO {

        let context_filter: ContextFilterVO = null;
        let locale_enum_filter_options = null;

        if (TypesHandler.getInstance().isArray(enum_filter_options)) {
            locale_enum_filter_options = enum_filter_options;
        } else {
            if (enum_filter_options != null) {
                locale_enum_filter_options = [enum_filter_options];
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);
        let has_null_value: boolean = false;

        for (let i in locale_enum_filter_options) {
            let active_option: DataFilterOption = locale_enum_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                active_option,
                null,
                field,
                vo_field_ref
            );

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterVOHandler.merge_context_filter_vos(
                    context_filter,
                    new_context_filter
                );
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();
            cf_null_value.field_id = vo_field_ref.field_id;
            cf_null_value.vo_type = vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!context_filter) {
                context_filter = cf_null_value;
            } else {
                context_filter = ContextFilterVO.or([cf_null_value, context_filter]);
            }
        }

        return context_filter;
    }

    /**
     * Create Context Filter From Number Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [number_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_number_filter_types(
        vo_field_ref: VOFieldRefVO,
        number_filter_options: DataFilterOption[]
    ): ContextFilterVO {

        let context_filter: ContextFilterVO = null;
        let locale_number_filter_options = null;

        if (TypesHandler.getInstance().isArray(number_filter_options)) {
            locale_number_filter_options = number_filter_options;
        } else {
            if (number_filter_options != null) {
                locale_number_filter_options = [number_filter_options];
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);
        let has_null_value: boolean = false;

        for (let i in locale_number_filter_options) {
            let active_option = locale_number_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                active_option,
                null,
                field,
                vo_field_ref
            );

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterVOHandler.merge_context_filter_vos(
                    context_filter,
                    new_context_filter
                );
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();

            cf_null_value.field_id = vo_field_ref.field_id;
            cf_null_value.vo_type = vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!context_filter) {
                context_filter = cf_null_value;
            } else {
                context_filter = ContextFilterVO.or([cf_null_value, context_filter]);
            }
        }

        return context_filter;
    }

    /**
     * Create Context Filter From Ref Field Filter Options
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {DataFilterOption[]} [ref_field_filter_options]
     * @param {VOFieldRefVO[]} [options.vo_field_ref_multiple]
     * @param {VOFieldRefVO} [options.vo_field_ref]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_ref_field_filter_options(
        vo_field_ref: VOFieldRefVO,
        ref_field_filter_options: DataFilterOption[],
        options?: {
            vo_field_ref_multiple?: VOFieldRefVO[],
            vo_field_ref?: VOFieldRefVO,
        }
    ): ContextFilterVO {
        let context_filter: ContextFilterVO[] = [];

        let locale_ref_field_filter_options: DataFilterOption[] = null;

        if (TypesHandler.getInstance().isArray(ref_field_filter_options)) {
            locale_ref_field_filter_options = ref_field_filter_options;
        } else {
            if (ref_field_filter_options != null) {
                locale_ref_field_filter_options = ref_field_filter_options;
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);

        if (options?.vo_field_ref_multiple?.length > 0) {
            for (let i in options.vo_field_ref_multiple) {
                let moduletable_multiple = VOsTypesManager.moduleTables_by_voType[options.vo_field_ref_multiple[i].api_type_id];
                let field_multiple = moduletable_multiple.get_field_by_id(options.vo_field_ref_multiple[i].field_id);
                let context_filter_multiple: ContextFilterVO = null;

                let has_null_value_multiple: boolean = false;

                for (let j in locale_ref_field_filter_options) {
                    let active_option = locale_ref_field_filter_options[j];

                    if (active_option.id == RangeHandler.MIN_INT) {
                        has_null_value_multiple = true;
                        continue;
                    }

                    let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                        active_option,
                        null,
                        field_multiple,
                        options.vo_field_ref_multiple[i]
                    );

                    if (!new_context_filter) {
                        continue;
                    }

                    if (!context_filter_multiple) {
                        context_filter_multiple = new_context_filter;
                    } else {
                        context_filter_multiple = ContextFilterVOHandler.merge_context_filter_vos(
                            context_filter_multiple,
                            new_context_filter
                        );
                    }
                }

                if (has_null_value_multiple) {
                    let cf_null_value: ContextFilterVO = new ContextFilterVO();
                    cf_null_value.field_id = options.vo_field_ref_multiple[i].field_id;
                    cf_null_value.vo_type = options.vo_field_ref_multiple[i].api_type_id;
                    cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

                    if (!context_filter_multiple) {
                        context_filter_multiple = cf_null_value;
                    } else {
                        context_filter_multiple = ContextFilterVO.or([cf_null_value, context_filter_multiple]);
                    }
                }

                if (context_filter_multiple) {
                    context_filter.push(context_filter_multiple);
                }
            }
        }

        let context_filter_simple: ContextFilterVO = null;
        let has_null_value: boolean = false;

        for (let i in locale_ref_field_filter_options) {
            let active_option = locale_ref_field_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter_simple = new_context_filter;
            } else {
                context_filter_simple = ContextFilterVOHandler.merge_context_filter_vos(context_filter_simple, new_context_filter);
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();

            cf_null_value.field_id = options.vo_field_ref.field_id;
            cf_null_value.vo_type = options.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!context_filter_simple) {
                context_filter_simple = cf_null_value;
            } else {
                context_filter_simple = ContextFilterVO.or([cf_null_value, context_filter_simple]);
            }
        }

        if (context_filter_simple) {
            context_filter.push(context_filter_simple);
        }

        return ContextFilterVO.or(context_filter);
    }

    /**
     * Create Context Filter From String Filter Options
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {DataFilterOption[]} [string_filter_options]
     * @param {VOFieldRefVO[]} [options.vo_field_ref_multiple]
     * @param {VOFieldRefVO} [options.vo_field_ref]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_string_filter_options(
        vo_field_ref: VOFieldRefVO,
        string_filter_options: DataFilterOption[],
        options?: {
            vo_field_ref_multiple?: VOFieldRefVO[],
            vo_field_ref?: VOFieldRefVO,
        }
    ): ContextFilterVO {
        let context_filter: ContextFilterVO[] = [];

        let locale_string_filter_options: DataFilterOption[] = null;

        if (TypesHandler.getInstance().isArray(string_filter_options)) {
            locale_string_filter_options = string_filter_options;
        } else {
            if (string_filter_options != null) {
                locale_string_filter_options = string_filter_options;
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);

        if (options?.vo_field_ref_multiple?.length > 0) {
            for (let i in options.vo_field_ref_multiple) {
                let moduletable_multiple = VOsTypesManager.moduleTables_by_voType[options.vo_field_ref_multiple[i].api_type_id];
                let field_multiple = moduletable_multiple.get_field_by_id(options.vo_field_ref_multiple[i].field_id);
                let context_filter_multiple: ContextFilterVO = null;

                let has_null_value_multiple: boolean = false;

                for (let j in locale_string_filter_options) {
                    let active_option = locale_string_filter_options[j];

                    if (active_option.id == RangeHandler.MIN_INT) {
                        has_null_value_multiple = true;
                        continue;
                    }

                    let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                        active_option,
                        null,
                        field_multiple,
                        options.vo_field_ref_multiple[i]
                    );

                    if (!new_context_filter) {
                        continue;
                    }

                    if (!context_filter_multiple) {
                        context_filter_multiple = new_context_filter;
                    } else {
                        context_filter_multiple = ContextFilterVOHandler.merge_context_filter_vos(
                            context_filter_multiple,
                            new_context_filter
                        );
                    }
                }

                if (has_null_value_multiple) {
                    let cf_null_value: ContextFilterVO = new ContextFilterVO();
                    cf_null_value.field_id = options.vo_field_ref_multiple[i].field_id;
                    cf_null_value.vo_type = options.vo_field_ref_multiple[i].api_type_id;
                    cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

                    if (!context_filter_multiple) {
                        context_filter_multiple = cf_null_value;
                    } else {
                        context_filter_multiple = ContextFilterVO.or([cf_null_value, context_filter_multiple]);
                    }
                }

                if (context_filter_multiple) {
                    context_filter.push(context_filter_multiple);
                }
            }
        }

        let context_filter_simple: ContextFilterVO = null;
        let has_null_value: boolean = false;

        for (let i in locale_string_filter_options) {
            let active_option = locale_string_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter_simple = new_context_filter;
            } else {
                context_filter_simple = ContextFilterVOHandler.merge_context_filter_vos(context_filter_simple, new_context_filter);
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();

            cf_null_value.field_id = options.vo_field_ref.field_id;
            cf_null_value.vo_type = options.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!context_filter_simple) {
                context_filter_simple = cf_null_value;
            } else {
                context_filter_simple = ContextFilterVO.or([cf_null_value, context_filter_simple]);
            }
        }

        if (context_filter_simple) {
            context_filter.push(context_filter_simple);
        }

        return ContextFilterVO.or(context_filter);
    }

    /**
     * Get Field Value Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_field_value_filters_widgets_options_metadata(
        dashboard_page_id: number,
    ): Promise<
        {
            [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        }
    > {

        const valuetable_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name([dashboard_page_id], 'fieldvaluefilter');

        const res: {
            [title_name_code: string]: {
                widget_options: FieldValueFilterWidgetOptionsVO,
                widget_name: string,
                dashboard_page_id: number,
                page_widget_id: number
            }
        } = {};

        for (const key in valuetable_page_widgets) {
            const options = valuetable_page_widgets[key];

            const widget_options = new FieldValueFilterWidgetOptionsVO().from(options.widget_options);
            const name = widget_options.get_placeholder_name_code_text(options.page_widget_id);

            res[name] = {
                dashboard_page_id: options.dashboard_page_id,
                page_widget_id: options.page_widget_id,
                widget_name: options.widget_name,
                widget_options: widget_options
            };
        }

        return res;
    }

    /**
     * Add the discarded field paths to the context query
     *
     * @param {ContextQueryVO} context_query
     * @param {{ [vo_type: string]: { [field_id: string]: boolean } }} discarded_field_paths
     * @returns {ContextQueryVO}
     */
    public static add_discarded_field_paths(
        context_query: ContextQueryVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }
    ): ContextQueryVO {

        //On évite les jointures supprimées.
        for (const vo_type in discarded_field_paths) {
            const discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (const field_id in discarded_field_paths_vo_type) {
                context_query.set_discarded_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        return context_query;
    }

    /**
     *
     * @param api_type_ids Il s'agit des api_type_ids sur DB, qu'on a chargé en même temps que les discarded_field_paths du dashboard dans la fonction appelante
     * @param context_query_with_discarded_field_paths ATTENTION : on doit bien avoir pré-intégré les discarded fields_paths dans le context_query
     * @param ignore_self_filter
     */
    public static async get_overflowing_segmented_options_api_type_id_from_dashboard(
        api_type_ids: string[],
        context_query_with_discarded_field_paths: ContextQueryVO,
        ignore_self_filter: boolean = true
    ): Promise<string> {

        /**
         * Si on est pas segmenté, mais qu'on a dans les active_api_type_ids un type segmenté, on check que le nombre d'option est faible pour la table segmentée,
         *  sinon on supprime les filtrages sur la table segmentée et on discard les fields, et on supprime du active_api_type_ids
         */
        let has_segmented: boolean = false;
        let overflowing_api_type_id: string = null;

        for (let i in api_type_ids) {
            let api_type_id: string = api_type_ids[i];
            let module_table: ModuleTableVO = VOsTypesManager.moduleTables_by_voType[api_type_id];

            if (module_table && module_table.is_segmented) {

                // On ne devrait pas avoir plus d'une table segmentée dans les api_type_ids sinon not implemented
                if (has_segmented) {
                    throw new Error('On ne peut pas avoir plusieurs tables segmentées dans un dashboard');
                }

                has_segmented = true;

                let count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(
                    api_type_id,
                    context_query_with_discarded_field_paths,
                    ignore_self_filter
                );

                if (count_segmentations > ModuleContextFilter.MAX_SEGMENTATION_OPTIONS) {
                    ConsoleHandler.warn('On a trop d\'options (' + count_segmentations + '/' + ModuleContextFilter.MAX_SEGMENTATION_OPTIONS + ') pour la table segmentée ' + overflowing_api_type_id + ', on ne filtre pas sur cette table');
                    overflowing_api_type_id = api_type_id;
                }
            }
        }

        return overflowing_api_type_id;
    }

    public static remove_overflowing_api_type_id_from_context_query(
        context_query: ContextQueryVO,
        api_type_id: string,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ) {

        if (api_type_id?.length > 0) {
            let new_filters = [];

            for (let i in context_query.filters) {
                const context_filter: ContextFilterVO = context_query.filters[i];

                if (context_filter.vo_type == api_type_id) {
                    continue;
                }

                new_filters.push(context_filter);
            }

            context_query.filters = new_filters;

            context_query.active_api_type_ids = context_query.active_api_type_ids.filter((_api_type_id: string) => {
                return api_type_id != _api_type_id;
            });

            FieldValueFilterWidgetManager.add_discarded_field_paths(
                context_query,
                discarded_field_paths
            );

            let segmented_moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];
            let fields = segmented_moduletable.get_fields();

            for (let i in fields) {
                let field: ModuleTableFieldVO = fields[i];

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                context_query.set_discarded_field_path(api_type_id, field.field_id);
            }
        }

        return context_query;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FieldValueFilterWidgetManager {
        if (!this.instance) {
            this.instance = new FieldValueFilterWidgetManager();
        }

        return this.instance;
    }

    protected static instance = null;

    constructor() { }
}
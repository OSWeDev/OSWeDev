import RangeHandler from "../../../tools/RangeHandler";
import TypesHandler from "../../../tools/TypesHandler";
import { VOFieldRefVOTypeHandler } from "../../DashboardBuilder/handlers/VOFieldRefVOTypeHandler";
import { BooleanFilterModel } from "../../DashboardBuilder/models/BooleanFilterModel";
import DashboardWidgetVO from "../../DashboardBuilder/vos/DashboardWidgetVO";
import VOFieldRefVO from "../../DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import NumRange from "../../DataRender/vos/NumRange";
import NumSegment from "../../DataRender/vos/NumSegment";
import TSRange from "../../DataRender/vos/TSRange";
import Dates from "../../FormatDatesNombres/Dates/Dates";
import ModuleTableField from "../../ModuleTableField";
import VOsTypesManager from "../../VOsTypesManager";
import ContextFilterVO from "../vos/ContextFilterVO";
import FieldValueFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import MonthFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import YearFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import ContextFilterHandler from "../ContextFilterHandler";

/**
 * ContextFilterFactory
 *  - Create ContextFilterVO depending on all possible given properties
 */
export default class ContextFilterFactory {

    /**
     * Create Context Filter From Widget Options
     *
     * @param {string} [widget_name]
     * @param {any} [widget_options] TODO: we must create a AbstractWidgetOptionsVO
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(widget_name: string, widget_options: any): ContextFilterVO {
        switch (widget_name) {
            case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                return ContextFilterFactory.create_context_filter_from_field_value_filter_widget_options(widget_options);
            case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                return ContextFilterFactory.create_context_filter_from_month_filter_widget_options(widget_options);
            case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                return ContextFilterFactory.create_context_filter_from_year_filter_widget_options(widget_options);
            default:
                throw new Error(
                    `ContextFilter for the given WidgetOptionsVO ` +
                    `name: "${widget_name}" is not implemented yet!`
                );
        }
    }

    /**
     * Create Context Filter From Field Value Filter Widget Options
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_field_value_filter_widget_options(
        widget_options: FieldValueFilterWidgetOptionsVO,
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        let vo_field_ref = widget_options?.vo_field_ref;

        if (VOFieldRefVOTypeHandler.is_type_boolean(vo_field_ref)) {
            const default_filters_options = widget_options?.default_boolean_values;
            context_filter = ContextFilterFactory.create_context_filter_from_boolean_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_date(vo_field_ref)) {
            let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
            let field = moduletable.get_field_by_id(vo_field_ref.field_id);

            const default_filters_options = widget_options?.default_ts_range_values;

            context_filter = ContextFilterFactory.create_context_filter_from_data_filter_option(null, default_filters_options, field, vo_field_ref);
        }

        if (VOFieldRefVOTypeHandler.is_type_enum(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterFactory.create_context_filter_from_enum_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_number(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterFactory.create_context_filter_from_number_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_string(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterFactory.create_context_filter_from_string_filter_options(vo_field_ref, default_filters_options, { vo_field_ref });
        }

        return context_filter;
    }

    /**
     * Create Context Filter From Month Filter Widget Options
     *
     * @param {MonthFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_month_filter_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        const vo_field_ref = widget_options.vo_field_ref ?? null;
        const default_selected_months: any = {};
        const months = [];

        if (widget_options.month_relative_mode) {
            const current_month = Dates.month(Dates.now()) + 1;

            for (let i = current_month + widget_options.min_month; i <= current_month + widget_options.max_month; i++) {
                months.push(i.toString());
            }
        } else {
            for (let i = widget_options.min_month; i <= widget_options.max_month; i++) {
                months.push(i.toString());
            }
        }


        for (const i in months) {
            const month = months[i];

            if (widget_options.auto_select_month) {

                if ((widget_options.auto_select_month_min == null) || (widget_options.auto_select_month_max == null)) {
                    continue;
                }

                if (widget_options.auto_select_month_relative_mode) {
                    let current_month = Dates.month(Dates.now()) + 1;
                    let month_int = parseInt(month);
                    if ((month_int >= (current_month + widget_options.auto_select_month_min)) &&
                        (month_int <= (current_month + widget_options.auto_select_month_max))) {
                        default_selected_months[month] = true;
                        continue;
                    }
                } else {
                    let month_int = parseInt(month);
                    if ((month_int >= widget_options.auto_select_month_min) &&
                        (month_int <= widget_options.auto_select_month_max)) {
                        default_selected_months[month] = true;
                        continue;
                    }
                }
            }

            default_selected_months[month] = false;
        }

        let months_ranges: NumRange[] = [];
        for (let i in default_selected_months) {
            if (!default_selected_months[i]) {
                continue;
            }
            months_ranges.push(RangeHandler.create_single_elt_NumRange(parseInt(i.toString()), NumSegment.TYPE_INT));
        }
        months_ranges = RangeHandler.getRangesUnion(months_ranges);

        context_filter = new ContextFilterVO();
        context_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        context_filter.param_numranges = months_ranges;

        if (widget_options.is_vo_field_ref) {
            context_filter.vo_type = vo_field_ref.api_type_id;
            context_filter.field_id = vo_field_ref.field_id;
        } else {
            context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
            context_filter.field_id = widget_options.custom_filter_name;
        }

        return context_filter;
    }

    /**
     * Create Context Filter From Year Filter Widget Options
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_year_filter_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        const vo_field_ref = widget_options.vo_field_ref ?? null;
        const default_selected_years: any = {};
        const years = [];

        if (widget_options.year_relative_mode) {
            const current_year = Dates.year(Dates.now());
            for (let i = current_year + widget_options.min_year; i <= current_year + widget_options.max_year; i++) {
                years.push(i.toString());
            }
        } else {
            for (let i = widget_options.min_year; i <= widget_options.max_year; i++) {
                years.push(i.toString());
            }
        }

        for (const key in years) {
            const year = years[key];

            if (widget_options.auto_select_year) {

                if ((widget_options.auto_select_year_min == null) || (widget_options.auto_select_year_max == null)) {
                    continue;
                }

                if (widget_options.auto_select_year_relative_mode) {
                    let current_year = Dates.year(Dates.now());
                    let year_int = parseInt(year);
                    if ((year_int >= (current_year + widget_options.auto_select_year_min)) &&
                        (year_int <= (current_year + widget_options.auto_select_year_max))) {
                        default_selected_years[year] = true;
                        continue;
                    }
                } else {
                    let year_int = parseInt(year);
                    if ((year_int >= widget_options.auto_select_year_min) &&
                        (year_int <= widget_options.auto_select_year_max)) {
                        default_selected_years[year] = true;
                        continue;
                    }
                }
            }

            default_selected_years[year] = false;
        }

        let years_ranges: NumRange[] = [];
        for (let key in default_selected_years) {
            if (!default_selected_years[key]) {
                continue;
            }
            years_ranges.push(RangeHandler.create_single_elt_NumRange(parseInt(key.toString()), NumSegment.TYPE_INT));
        }
        years_ranges = RangeHandler.getRangesUnion(years_ranges);

        context_filter = new ContextFilterVO();
        context_filter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        context_filter.param_numranges = years_ranges;

        if (widget_options.is_vo_field_ref) {
            context_filter.vo_type = vo_field_ref.api_type_id;
            context_filter.field_id = vo_field_ref.field_id;
        } else {
            context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
            context_filter.field_id = widget_options.custom_filter_name;
        }

        return context_filter;
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

                    let new_context_filter = ContextFilterFactory.create_context_filter_from_data_filter_option(active_option, null, field_multiple, options.vo_field_ref_multiple[i]);

                    if (!new_context_filter) {
                        continue;
                    }

                    if (!context_filter_multiple) {
                        context_filter_multiple = new_context_filter;
                    } else {
                        context_filter_multiple = ContextFilterHandler.merge_context_filter_vos(context_filter_multiple, new_context_filter);
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

            let new_context_filter = ContextFilterFactory.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter_simple = new_context_filter;
            } else {
                context_filter_simple = ContextFilterHandler.merge_context_filter_vos(context_filter_simple, new_context_filter);
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

            let new_context_filter = ContextFilterFactory.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterHandler.merge_context_filter_vos(context_filter, new_context_filter);
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

            let new_context_filter = ContextFilterFactory.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterHandler.merge_context_filter_vos(context_filter, new_context_filter);
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
     * Create Context Filter From Data Filter Option
     *
     * @param active_option
     * @param ts_range
     * @param field
     * @param vo_field_ref
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_data_filter_option(
        active_option: DataFilterOption,
        ts_range: TSRange,
        field: ModuleTableField<any>,
        vo_field_ref: VOFieldRefVO
    ): ContextFilterVO {
        let context_filter = new ContextFilterVO();

        context_filter.field_id = vo_field_ref.field_id;
        context_filter.vo_type = vo_field_ref.api_type_id;

        let field_type = null;

        if ((!field) && (vo_field_ref.field_id == 'id')) {
            field_type = ModuleTableField.FIELD_TYPE_int;
        } else {
            field_type = field.field_type;
        }

        switch (field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
                context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                context_filter.param_numranges = RangeHandler.get_ids_ranges_from_list([active_option.numeric_value]);
                break;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                context_filter.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                context_filter.param_textarray = [active_option.string_value];
                break;

            case ModuleTableField.FIELD_TYPE_enum:
                context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                context_filter.param_numranges = [RangeHandler.create_single_elt_NumRange(active_option.numeric_value, NumSegment.TYPE_INT)];
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
                context_filter.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
                context_filter.param_tsranges = [ts_range];
                break;

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');


            default:
                throw new Error('Not Implemented');
        }

        return context_filter;
    }

    public static getInstance(): ContextFilterFactory {
        if (!ContextFilterFactory.instance) {
            ContextFilterFactory.instance = new ContextFilterFactory();
        }
        return ContextFilterFactory.instance;
    }

    private static instance: ContextFilterFactory = null;

    private constructor() { }

}
import { cloneDeep, isArray } from "lodash";
import ConsoleHandler from "../../tools/ConsoleHandler";
import LocaleManager from "../../tools/LocaleManager";
import { all_promises } from "../../tools/PromiseTools";
import RangeHandler from "../../tools/RangeHandler";
import TypesHandler from "../../tools/TypesHandler";
import DatatableField from "../DAO/vos/datatable/DatatableField";
import ManyToManyReferenceDatatableFieldVO from "../DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO";
import ManyToOneReferenceDatatableFieldVO from "../DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO";
import OneToManyReferenceDatatableFieldVO from "../DAO/vos/datatable/OneToManyReferenceDatatableFieldVO";
import RefRangesReferenceDatatableFieldVO from "../DAO/vos/datatable/RefRangesReferenceDatatableFieldVO";
import SimpleDatatableFieldVO from "../DAO/vos/datatable/SimpleDatatableFieldVO";
import { VOFieldRefVOTypeHandler } from "../DashboardBuilder/handlers/VOFieldRefVOTypeHandler";
import { BooleanFilterModel } from "../DashboardBuilder/models/BooleanFilterModel";
import VOFieldRefVO from "../DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../DataRender/vos/DataFilterOption";
import NumSegment from "../DataRender/vos/NumSegment";
import TSRange from "../DataRender/vos/TSRange";
import IDistantVOBase from "../IDistantVOBase";
import ModuleTableField from "../ModuleTableField";
import VOsTypesManager from "../VOsTypesManager";
import ContextFilterVO from "./vos/ContextFilterVO";
import { query } from "./vos/ContextQueryVO";

export default class ContextFilterHandler {
    // MONTHS MIXIN
    public static readonly MONTHS_LABELS = [
        "label.month.janvier",
        "label.month.fevrier",
        "label.month.mars",
        "label.month.avril",
        "label.month.mai",
        "label.month.juin",
        "label.month.juillet",
        "label.month.aout",
        "label.month.septembre",
        "label.month.octobre",
        "label.month.novembre",
        "label.month.decembre"
    ];

    public static readonly DAYS_LABELS = [
        "label.day.dimanche",
        "label.day.lundi",
        "label.day.mardi",
        "label.day.mercredi",
        "label.day.jeudi",
        "label.day.vendredi",
        "label.day.samedi"
    ];

    /**
     * Context Filter To Readable Ihm
     *  - Human readable context filters
     *
     * @param context_filter {ContextFilterVO}
     */
    public static context_filter_to_readable_ihm(context_filter: ContextFilterVO) {
        switch (context_filter?.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                let unique_set = new Set<string>();
                let res: string = '';

                // case when AND
                const left_hook = context_filter.left_hook;
                const rigth_hook = context_filter.right_hook;

                let ihm_left_hook = ContextFilterHandler.context_filter_to_readable_ihm(left_hook);
                let ihm_right_hook = ContextFilterHandler.context_filter_to_readable_ihm(rigth_hook);

                // Add dynamic regex checker
                const rgx = RegExp(ihm_right_hook, 'g');
                // Case when iteration may has already been done
                if (rgx.test(ihm_left_hook)) {
                    ihm_right_hook = null;
                }

                unique_set.add(ihm_left_hook);
                if (ihm_right_hook?.length > 0) {
                    unique_set.add(ihm_right_hook);
                }

                const data = Array.from(unique_set);

                res = data.join(' - ');

                return res;

            case ContextFilterVO.TYPE_DATE_MONTH:
                const months_selection: string[] = [];

                // param_numranges of months is e.g. [1, ..., 12]
                RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (month: number) => {
                    months_selection.push(ContextFilterHandler.MONTHS_LABELS[month - 1]);
                });

                return months_selection
                    .map((month_label) => LocaleManager.getInstance().label(month_label))
                    .join(', ');

            case ContextFilterVO.TYPE_DATE_YEAR:
                const years_selection: number[] = [];

                // param_numranges of years is e.g. [..., 2020, ..., 2023, ...]
                RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year: number) => {
                    years_selection.push(year);
                });

                return years_selection.join(', ');

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                // param_textarray of any string is e.g. [..., one_text_1, ..., one_text_2, ...]
                return context_filter.param_textarray?.join(', ');
        }
    }

    /**
     * Get Context Filter From Widget Options
     *
     * @param {any} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_widget_options(widget_options: any): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        let vo_field_ref = widget_options?.vo_field_ref ?? null;

        if (widget_options?.is_vo_field_ref != null) {
            vo_field_ref = widget_options?.is_vo_field_ref ? vo_field_ref : {
                api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE,
                field_id: widget_options.custom_filter_name,
            };
        }

        if (VOFieldRefVOTypeHandler.is_type_boolean(vo_field_ref)) {
            const default_filters_options = widget_options?.default_boolean_values;
            context_filter = ContextFilterHandler.get_context_filter_from_boolean_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_date(vo_field_ref)) {
            let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
            let field = moduletable.get_field_by_id(vo_field_ref.field_id);

            const default_filters_options = widget_options?.default_ts_range_values;

            context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(null, default_filters_options, field, vo_field_ref);
        }

        if (VOFieldRefVOTypeHandler.is_type_enum(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterHandler.get_context_filter_from_enum_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_number(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterHandler.get_context_filter_from_number_filter_types(vo_field_ref, default_filters_options);
        }

        if (VOFieldRefVOTypeHandler.is_type_string(vo_field_ref)) {
            let default_filters_options: DataFilterOption[] = [];

            for (let i in widget_options?.default_filter_opt_values) {
                const props = widget_options.default_filter_opt_values[i];
                const data_filter_option = new DataFilterOption().from(props);
                default_filters_options.push(data_filter_option);
            }

            context_filter = ContextFilterHandler.get_context_filter_from_string_filter_options(vo_field_ref, default_filters_options, { vo_field_ref });
        }

        return context_filter;
    }

    /**
     * Get Context Filter From String Filter Options
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {DataFilterOption[]} [string_filter_options]
     * @param {VOFieldRefVO[]} [options.vo_field_ref_multiple]
     * @param {VOFieldRefVO} [options.vo_field_ref]
     *
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_string_filter_options(
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

                    let new_context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field_multiple, options.vo_field_ref_multiple[i]);

                    if (!new_context_filter) {
                        continue;
                    }

                    if (!context_filter_multiple) {
                        context_filter_multiple = new_context_filter;
                    } else {
                        context_filter_multiple = ContextFilterHandler.getInstance().merge_ContextFilterVOs(context_filter_multiple, new_context_filter);
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

        let res_a: ContextFilterVO = null;
        let has_null_value: boolean = false;

        for (let i in locale_string_filter_options) {
            let active_option = locale_string_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                res_a = new_context_filter;
            } else {
                res_a = ContextFilterHandler.getInstance().merge_ContextFilterVOs(res_a, new_context_filter);
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();

            cf_null_value.field_id = options.vo_field_ref.field_id;
            cf_null_value.vo_type = options.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!res_a) {
                res_a = cf_null_value;
            } else {
                res_a = ContextFilterVO.or([cf_null_value, res_a]);
            }
        }

        if (res_a) {
            context_filter.push(res_a);
        }

        return ContextFilterVO.or(context_filter);
    }

    /**
     * Get Context Filter From Boolean Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [boolean_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_boolean_filter_types(
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
     * Get Context Filter From Enum Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [enum_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_enum_filter_types(
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

            let new_context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterHandler.getInstance().merge_ContextFilterVOs(context_filter, new_context_filter);
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
     * Get Context Filter From Number Filter Types
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @param {number[]} [number_filter_options]
     *
     * @returns {ContextFilterVO}
     */
    public static get_context_filter_from_number_filter_types(
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

            let new_context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterHandler.getInstance().merge_ContextFilterVOs(context_filter, new_context_filter);
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

    public static getInstance(): ContextFilterHandler {
        if (!ContextFilterHandler.instance) {
            ContextFilterHandler.instance = new ContextFilterHandler();
        }
        return ContextFilterHandler.instance;
    }

    private static instance: ContextFilterHandler = null;

    private constructor() { }

    public async get_datatable_row_field_data_async(
        raw_data: IDistantVOBase, resData: any, field: DatatableField<any, any>
    ): Promise<any> {

        try {

            switch (field.type) {

                case DatatableField.CRUD_ACTIONS_FIELD_TYPE:
                    resData[field.datatable_field_uid] = raw_data[field.datatable_field_uid];
                    break;

                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField: SimpleDatatableFieldVO<any, any> = (field) as SimpleDatatableFieldVO<any, any>;
                    let module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        simpleField.moduleTableField.module_table.vo_type + '___' + simpleField.moduleTableField.field_id :
                        simpleField.moduleTableField.field_id;

                    let value = field.dataToReadIHM(raw_data[module_table_field_id], raw_data);
                    // Limite à 300 cars si c'est du html et strip html
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {

                        if (value) {
                            try {
                                value = value.replace(/&nbsp;/gi, ' ');
                                value = value.replace(/<\/div>/gi, '\n');
                                value = value.replace(/<\/span>/gi, '\n');
                                value = value.replace(/<\/ul>/gi, '\n');
                                value = value.replace(/<\/li>/gi, '\n');
                                value = value.replace(/<\/p>/gi, '\n');
                                value = value.replace(/<br>/gi, '\n');
                                value = value.replace(/<(?:.|\n)*?>/gm, '');
                                // value = $("<p>" + value + "</p>").text();
                            } catch (error) {
                                value = value;
                            }

                            if (value.length > 300) {
                                value = value.substring(0, 300) + '...';
                            }
                        }
                    }

                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

                        for (let vi in value) {
                            let v = value[vi];

                            try {

                                v = v.replace(/&nbsp;/gi, ' ');
                                v = v.replace(/<\/div>/gi, '\n');
                                v = v.replace(/<\/span>/gi, '\n');
                                v = v.replace(/<\/ul>/gi, '\n');
                                v = v.replace(/<\/li>/gi, '\n');
                                v = v.replace(/<\/p>/gi, '\n');
                                v = v.replace(/<br>/gi, '\n');
                                v = v.replace(/<(?:.|\n)*?>/gm, '');
                                // v = $("<p>" + v + "</p>").text();
                            } catch (error) {
                                v = v;
                            }

                            if (v.length > 300) {
                                v = v.substring(0, 300) + '...';
                            }

                            value[vi] = v;
                        }
                    }


                    resData[field.datatable_field_uid] = value;
                    break;

                case DatatableField.COMPUTED_FIELD_TYPE:
                    resData[field.datatable_field_uid] = field.dataToReadIHM(null, raw_data);
                    break;

                case DatatableField.COMPONENT_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.FILE_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    let manyToOneField: ManyToOneReferenceDatatableFieldVO<any> = (field) as ManyToOneReferenceDatatableFieldVO<any>;

                    let src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        manyToOneField.srcField.module_table.vo_type + '___' + manyToOneField.srcField.field_id :
                        manyToOneField.srcField.field_id;

                    // On va chercher la valeur du champs depuis la valeur de la donnée liée
                    if (!!raw_data[src_module_table_field_id]) {
                        let ref_data: IDistantVOBase = await query(manyToOneField.targetModuleTable.vo_type).filter_by_id(raw_data[src_module_table_field_id]).select_vo();
                        resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                        resData[field.datatable_field_uid + "___id___"] = raw_data[src_module_table_field_id];
                        resData[field.datatable_field_uid + "___type___"] = manyToOneField.targetModuleTable.vo_type;
                    }
                    break;

                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                    let oneToManyField: OneToManyReferenceDatatableFieldVO<any> = (field) as OneToManyReferenceDatatableFieldVO<any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: oneToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }
                    break;

                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                    let manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (field) as ManyToManyReferenceDatatableFieldVO<any, any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: manyToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }

                    break;

                case DatatableField.REF_RANGES_FIELD_TYPE:
                    let refField: RefRangesReferenceDatatableFieldVO<any> = (field) as RefRangesReferenceDatatableFieldVO<any>;

                    resData[field.datatable_field_uid] = [];

                    let refField_src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        refField.srcField.module_table.vo_type + '___' + refField.srcField.field_id :
                        refField.srcField.field_id;

                    await RangeHandler.foreach_ranges_batch_await(raw_data[refField_src_module_table_field_id], async (id: number) => {
                        let ref_data: IDistantVOBase = await query(refField.targetModuleTable.vo_type).filter_by_id(id).select_vo();
                        resData[field.datatable_field_uid].push({
                            id: id,
                            label: refField.dataToHumanReadable(ref_data)
                        });
                    });
                    break;

                default:
                    break;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            resData[field.datatable_field_uid] = null;
        }
    }

    public get_active_field_filters(filters: ContextFilterVO[]): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
        let res: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};

        for (let i in filters) {
            let filter = filters[i];

            if (!res[filter.vo_type]) {
                res[filter.vo_type] = {};
            }
            res[filter.vo_type][filter.field_id] = filter;
        }

        return res;
    }

    public get_filters_from_active_field_filters(active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): ContextFilterVO[] {
        let res: ContextFilterVO[] = [];

        for (let i in active_field_filters) {
            let filters = active_field_filters[i];

            for (let j in filters) {
                let filter = filters[j];

                if (!filter) {
                    continue;
                }

                res.push(filter);
            }
        }

        return res;
    }


    /**
     * @param context_filter_tree_root
     * @param type
     * @returns the context_filter that has the asked type from the tree_root
     */
    public find_context_filter_by_type(context_filter_tree_root: ContextFilterVO, type: number): ContextFilterVO {
        if (context_filter_tree_root && (context_filter_tree_root.filter_type != type) && context_filter_tree_root.left_hook && context_filter_tree_root.right_hook) {
            return this.find_context_filter_by_type(context_filter_tree_root.left_hook, type) || this.find_context_filter_by_type(context_filter_tree_root.right_hook, type);
        }

        if (context_filter_tree_root.filter_type != type) {
            return null;
        }

        return context_filter_tree_root;
    }

    /**
     * Remove the context_filter_to_delete from context_filter_tree_root and returns the new root
     * Need to ask the deletion with the real contextfilter object and not a description or clone of it.
     * Tests are done on the objects adresses, not deeply on the contents.
     * @param context_filter_tree_root
     * @param context_filter_to_delete
     * @returns
     */
    public remove_context_filter_from_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_delete: ContextFilterVO): ContextFilterVO {

        if ((!context_filter_tree_root) || (!context_filter_to_delete)) {
            return null;
        }

        // beware this is no deep check
        if (context_filter_tree_root == context_filter_to_delete) {
            return null;
        }

        if (!context_filter_tree_root.left_hook) {
            /**
             * On est sur une feuille et c'est pas celle qu'on cherche, on la renvoie
             */
            return context_filter_tree_root;
        }

        if (context_filter_tree_root.left_hook == context_filter_to_delete) {
            return context_filter_tree_root.right_hook;
        }

        if (context_filter_tree_root.right_hook == context_filter_to_delete) {
            return context_filter_tree_root.left_hook;
        }

        /**
         * On tente la suppression à gauche. si on récupère un null, on doit renvoyer le hook_right en guise de nouveau root à ce niveau
         */
        let left_hook_replacement = this.remove_context_filter_from_tree(context_filter_tree_root.left_hook, context_filter_to_delete);
        if (!left_hook_replacement) {
            return context_filter_tree_root.right_hook;
        }
        if (left_hook_replacement != context_filter_tree_root.left_hook) {
            context_filter_tree_root.left_hook = left_hook_replacement;
            return context_filter_tree_root;
        }

        let right_hook_replacement = this.remove_context_filter_from_tree(context_filter_tree_root.right_hook, context_filter_to_delete);
        if ((!right_hook_replacement) && (context_filter_tree_root.right_hook)) {
            return context_filter_tree_root.left_hook;
        }
        if (right_hook_replacement != context_filter_tree_root.right_hook) {
            context_filter_tree_root.right_hook = right_hook_replacement;
        }

        return context_filter_tree_root;
    }

    /**
     * Objectif retrouver les filtres simples (pas de or / xor ou subquery par exemple) d'un vo_type spécifique
     */
    public get_simple_filters_by_vo_type(filters: ContextFilterVO[], vo_type: string): ContextFilterVO[] {

        let res: ContextFilterVO[] = [];
        for (let i in filters) {
            let filter = filters[i];

            if (filter.vo_type != vo_type) {
                continue;
            }

            switch (filter.filter_type) {
                case ContextFilterVO.TYPE_FILTER_AND:
                case ContextFilterVO.TYPE_FILTER_NOT:
                case ContextFilterVO.TYPE_FILTER_OR:
                case ContextFilterVO.TYPE_FILTER_XOR:
                case ContextFilterVO.TYPE_IN:
                case ContextFilterVO.TYPE_NOT_IN:
                case ContextFilterVO.TYPE_NOT_EXISTS:
                    continue;
            }

            res.push(filter);
        }

        return res;
    }

    /**
     * Objectif retrouver un filtre simple (pas de or / xor ou subquery par exemple) pour identifier par exemple
     *  un filtre sur un champ de segmentation
     *  on checke qu'on a qu'un seul résultat (sinon on est sur un filtre complexe)
     */
    public get_simple_filter_by_vo_type_and_field_id(filters: ContextFilterVO[], vo_type: string, field_id: string): ContextFilterVO {

        let res = null;
        for (let i in filters) {
            let filter = filters[i];

            if (filter.field_id != field_id) {
                continue;
            }

            if (filter.vo_type != vo_type) {
                continue;
            }

            switch (filter.filter_type) {
                case ContextFilterVO.TYPE_FILTER_AND:
                case ContextFilterVO.TYPE_FILTER_NOT:
                case ContextFilterVO.TYPE_FILTER_OR:
                case ContextFilterVO.TYPE_FILTER_XOR:
                case ContextFilterVO.TYPE_IN:
                case ContextFilterVO.TYPE_NOT_IN:
                case ContextFilterVO.TYPE_NOT_EXISTS:
                    continue;
            }

            if (res) {
                return null;
            }

            res = filter;
        }

        return res;
    }

    /**
     * Add context_filter to the root, using the and/or/xor .... type of operator if necessary
     * Returns the new root
     * @param context_filter_tree_root
     * @param context_filter_to_delete
     * @param operator_type
     * @returns
     */
    public add_context_filter_to_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_add: ContextFilterVO, operator_type: number = ContextFilterVO.TYPE_FILTER_AND): ContextFilterVO {

        if (!context_filter_tree_root) {
            return context_filter_to_add;
        }

        if (!context_filter_to_add) {
            return context_filter_tree_root;
        }

        // Le root est déjà rempli, on renvoie un nouvel operateur
        let new_root = new ContextFilterVO();

        new_root.vo_type = context_filter_to_add.vo_type;
        new_root.field_id = context_filter_to_add.field_id;
        new_root.filter_type = operator_type;
        new_root.left_hook = context_filter_tree_root;
        new_root.right_hook = context_filter_to_add;
        return new_root;
    }

    /**
     * Clone and remove custom_filters
     */
    public clean_context_filters_for_request(get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
        let res: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(get_active_field_filters);

        if (res) {
            delete res[ContextFilterVO.CUSTOM_FILTERS_TYPE];
        }

        return res;
    }

    /**
     * Renvoie une context query qui renvoie systématiquement 0 éléments, pour bloquer l'accès à un vo par exemple dans un context access hook
     */
    public get_empty_res_context_hook_query(api_type_id: string) {
        // on veut rien renvoyer, donc on fait une query qui retourne rien
        let filter_none: ContextFilterVO = new ContextFilterVO();
        filter_none.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        filter_none.field_id = 'id';
        filter_none.vo_type = api_type_id;

        return query(api_type_id).field('id').set_query_distinct().add_filters([filter_none]).ignore_access_hooks();
    }

    public add_context_filters_exclude_values(
        exclude_values: DataFilterOption[],
        vo_field_ref: VOFieldRefVO,
        query_filters: ContextFilterVO[],
        concat_exclude_values: boolean
    ): ContextFilterVO[] {
        if (!exclude_values || !exclude_values.length) {
            return query_filters;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);

        let exclude_values_context_filter: ContextFilterVO = null;

        // On parcourt toutes les valeurs à exclure pour créer le ContextFilter
        for (let j in exclude_values) {
            let active_option = exclude_values[j];

            let new_exclude_values = this.get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_exclude_values) {
                continue;
            }

            if (!exclude_values_context_filter) {
                exclude_values_context_filter = new_exclude_values;
            } else {
                exclude_values_context_filter = this.merge_ContextFilterVOs(exclude_values_context_filter, new_exclude_values);
            }
        }

        // Changer le filter_type pour dire ne pas prendre en compte
        exclude_values_context_filter.filter_type = this.get_ContextFilterVO_None(field, vo_field_ref);

        let new_query_filters: ContextFilterVO[] = [];
        let is_add: boolean = false;

        // On le rajoute à la query
        if (query_filters) {

            for (let i in query_filters) {
                if ((query_filters[i].field_id == vo_field_ref.field_id) && (query_filters[i].vo_type == vo_field_ref.api_type_id)) {
                    if (concat_exclude_values) {
                        is_add = true;
                        new_query_filters.push(ContextFilterVO.and([query_filters[i], exclude_values_context_filter]));
                    }
                    continue;
                }

                new_query_filters.push(query_filters[i]);
            }
        }

        if (!is_add) {
            new_query_filters.push(exclude_values_context_filter);
        }

        return new_query_filters;
    }

    public get_ContextFilterVO_None(field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): number {
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
                return ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                return ContextFilterVO.TYPE_TEXT_EQUALS_NONE;

            case ModuleTableField.FIELD_TYPE_enum:
                return ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;

            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');


            default:
                throw new Error('Not Implemented');
        }
    }

    public get_ContextFilterVO_from_DataFilterOption(active_option: DataFilterOption, ts_range: TSRange, field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): ContextFilterVO {
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

    public merge_ContextFilterVOs(a: ContextFilterVO, b: ContextFilterVO, try_union: boolean = false): ContextFilterVO {
        if (!a) {
            return b;
        }

        if (!b) {
            return a;
        }

        if (a.filter_type == b.filter_type) {
            if (a.param_numranges && b.param_numranges) {
                a.param_numranges = a.param_numranges.concat(b.param_numranges);
                if (try_union) {
                    a.param_numranges = RangeHandler.getRangesUnion(a.param_numranges);
                }
                return a;
            }

            if (a.param_tsranges && b.param_tsranges) {
                a.param_tsranges = a.param_tsranges.concat(b.param_tsranges);
                if (try_union) {
                    a.param_tsranges = RangeHandler.getRangesUnion(a.param_tsranges);
                }
                return a;
            }

            if (a.param_textarray && b.param_textarray) {
                if (!a.param_textarray.length) {
                    a.param_textarray = b.param_textarray;
                } else if (!b.param_textarray.length) {
                } else {
                    a.param_textarray = a.param_textarray.concat(b.param_textarray);
                }
                return a;
            }

            /**
             * On doit gérer les merges booleans, en supprimant potentiellement la condition
             *  (par exemple si on merge un true any avec un false any par définition c'est juste plus un filtre)
             */
            switch (a.filter_type) {
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
                    throw new Error('Not Implemented');

                case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:

                default:
                    break;
            }
        }

        return a;
    }
}
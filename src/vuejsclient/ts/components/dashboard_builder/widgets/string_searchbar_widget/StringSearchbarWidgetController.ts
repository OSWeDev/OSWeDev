import ContextFilterVOHandler from "../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler";
import ContextFilterVOManager from "../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from "../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ModuleTableController from "../../../../../../shared/modules/DAO/ModuleTableController";
import VOFieldRefVO from "../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../../../../../../shared/modules/DataRender/vos/DataFilterOption";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import TypesHandler from "../../../../../../shared/tools/TypesHandler";

export default class StringSearchbarWidgetController {

    // istanbul ignore next: nothing to test
    public static getInstance(): StringSearchbarWidgetController {
        if (!this.instance) {
            this.instance = new StringSearchbarWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

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
        const context_filter: ContextFilterVO[] = [];

        let locale_string_filter_options: DataFilterOption[] = null;

        if (TypesHandler.getInstance().isArray(string_filter_options)) {
            locale_string_filter_options = string_filter_options;
        } else {
            if (string_filter_options != null) {
                locale_string_filter_options = string_filter_options;
            }
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[vo_field_ref.api_type_id];
        const field = moduletable.get_field_by_id(vo_field_ref.field_id);

        if (options?.vo_field_ref_multiple?.length > 0) {
            for (const i in options.vo_field_ref_multiple) {
                const moduletable_multiple = ModuleTableController.module_tables_by_vo_type[options.vo_field_ref_multiple[i].api_type_id];
                const field_multiple = moduletable_multiple.get_field_by_id(options.vo_field_ref_multiple[i].field_id);
                let context_filter_multiple: ContextFilterVO = null;

                let has_null_value_multiple: boolean = false;

                for (const j in locale_string_filter_options) {
                    const active_option = locale_string_filter_options[j];

                    if (active_option.id == RangeHandler.MIN_INT) {
                        has_null_value_multiple = true;
                        continue;
                    }

                    const new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
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
                    const cf_null_value: ContextFilterVO = new ContextFilterVO();
                    cf_null_value.field_name = options.vo_field_ref_multiple[i].field_id;
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

        for (const i in locale_string_filter_options) {
            const active_option = locale_string_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            const new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(active_option, null, field, vo_field_ref);

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
            const cf_null_value: ContextFilterVO = new ContextFilterVO();

            cf_null_value.field_name = options.vo_field_ref.field_id;
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
}
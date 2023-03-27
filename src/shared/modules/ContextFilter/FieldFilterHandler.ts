import RangeHandler from "../../tools/RangeHandler";
import TypesHandler from "../../tools/TypesHandler";
import VOFieldRefVO from "../DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../DataRender/vos/DataFilterOption";
import VOsTypesManager from "../VOsTypesManager";
import ContextFilterHandler from "./ContextFilterHandler";
import ContextFilterVO from "./vos/ContextFilterVO";

/**
 * FieldFilterHandler
 */
export class FieldFilterHandler {

    /**
     * Get Active Field Filter
     *
     * @param vo_field_ref
     * @param tmp_filter_active_options
     * @param options
     * @returns
     */
    public static get_active_field_filter(
        vo_field_ref: VOFieldRefVO,
        tmp_filter_active_options: DataFilterOption[],
        options?: {
            vo_field_ref_multiple?: VOFieldRefVO[],
            vo_field_ref?: VOFieldRefVO,
        }
    ): ContextFilterVO {
        let res: ContextFilterVO[] = [];

        let locale_tmp_filter_active_options: DataFilterOption[] = null;

        if (TypesHandler.getInstance().isArray(tmp_filter_active_options)) {
            locale_tmp_filter_active_options = tmp_filter_active_options;
        } else {
            if (tmp_filter_active_options != null) {
                locale_tmp_filter_active_options = tmp_filter_active_options;
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);

        if (options?.vo_field_ref_multiple?.length > 0) {
            for (let i in options.vo_field_ref_multiple) {
                let moduletable_multiple = VOsTypesManager.moduleTables_by_voType[options.vo_field_ref_multiple[i].api_type_id];
                let field_multiple = moduletable_multiple.get_field_by_id(options.vo_field_ref_multiple[i].field_id);
                let res_: ContextFilterVO = null;

                let has_null_value_multiple: boolean = false;

                for (let j in locale_tmp_filter_active_options) {
                    let active_option = locale_tmp_filter_active_options[j];

                    if (active_option.id == RangeHandler.MIN_INT) {
                        has_null_value_multiple = true;
                        continue;
                    }

                    let new_translated_active_options = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field_multiple, options.vo_field_ref_multiple[i]);

                    if (!new_translated_active_options) {
                        continue;
                    }

                    if (!res_) {
                        res_ = new_translated_active_options;
                    } else {
                        res_ = ContextFilterHandler.getInstance().merge_ContextFilterVOs(res_, new_translated_active_options);
                    }
                }

                if (has_null_value_multiple) {
                    let cf_null_value: ContextFilterVO = new ContextFilterVO();
                    cf_null_value.field_id = options.vo_field_ref_multiple[i].field_id;
                    cf_null_value.vo_type = options.vo_field_ref_multiple[i].api_type_id;
                    cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

                    if (!res_) {
                        res_ = cf_null_value;
                    } else {
                        res_ = ContextFilterVO.or([cf_null_value, res_]);
                    }
                }

                if (res_) {
                    res.push(res_);
                }
            }
        }

        let res_a: ContextFilterVO = null;
        let has_null_value: boolean = false;

        for (let i in locale_tmp_filter_active_options) {
            let active_option = locale_tmp_filter_active_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_translated_active_options = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_translated_active_options) {
                continue;
            }

            if (!res) {
                res_a = new_translated_active_options;
            } else {
                res_a = ContextFilterHandler.getInstance().merge_ContextFilterVOs(res_a, new_translated_active_options);
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
            res.push(res_a);
        }

        return ContextFilterVO.or(res);
    }
}
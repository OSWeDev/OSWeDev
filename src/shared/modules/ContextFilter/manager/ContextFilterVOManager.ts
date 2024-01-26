import ContextFilterVOHandler from "../handler/ContextFilterVOHandler";
import ObjectHandler from "../../../tools/ObjectHandler";
import RangeHandler from "../../../tools/RangeHandler";
import FieldFiltersVO from "../../DashboardBuilder/vos/FieldFiltersVO";
import VOFieldRefVO from "../../DashboardBuilder/vos/VOFieldRefVO";
import ContextFilterVO from "../vos/ContextFilterVO";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";
import NumSegment from "../../DataRender/vos/NumSegment";
import TSRange from "../../DataRender/vos/TSRange";
import ModuleTableField from "../../ModuleTableField";

/**
 * ContextFilterVOManager
 *  - Create ContextFilterVO depending on all possible given properties
 *
 * TODO: Managers methods have to be for Creating|Finding|Updating fields of ContextFilterVO
 */
export default class ContextFilterVOManager {

    /**
     * add_context_filter_to_tree
     * - Add context_filter to the root, using the and/or/xor .... type of operator if necessary
     *
     * @param {ContextFilterVO} context_filter_tree_root
     * @param {ContextFilterVO} context_filter_to_add
     * @param {number} operator_type
     * @returns {ContextFilterVO}
     */
    public static add_context_filter_to_tree(
        context_filter_tree_root: ContextFilterVO,
        context_filter_to_add: ContextFilterVO,
        operator_type: number = ContextFilterVO.TYPE_FILTER_AND
    ): ContextFilterVO {
        if (!context_filter_tree_root) {
            return context_filter_to_add;
        }

        if (!context_filter_to_add) {
            return context_filter_tree_root;
        }

        /**
         * On checke qu'on est pas en train de modifier un filtre existant
         */
        if (
            (context_filter_tree_root == context_filter_to_add) ||
            ContextFilterVOHandler.find_context_filter_in_tree(
                context_filter_tree_root,
                context_filter_to_add
            )
        ) {
            return context_filter_tree_root;
        }

        // Le root est déjà rempli, on renvoie un nouvel operateur
        let context_filter = new ContextFilterVO();

        context_filter.vo_type = context_filter_to_add.vo_type;
        context_filter.field_id = context_filter_to_add.field_id;
        context_filter.filter_type = operator_type;
        context_filter.left_hook = context_filter_tree_root;
        context_filter.right_hook = context_filter_to_add;

        return context_filter;
    }

    /**
     * Create Context Filter From Data Filter Option
     *
     * @param {DataFilterOption} active_option
     * @param {TSRange} ts_range
     * @param {ModuleTableField<any>} field
     * @param {VOFieldRefVO} vo_field_ref
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
            case ModuleTableField.FIELD_TYPE_foreign_key:
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
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_html_array:
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
            default:
                throw new Error('Not Implemented');
        }

        return context_filter;
    }

    /**
     * get_context_filters_from_active_field_filters
     *  - Get Context Filters From Active Field Filters
     *  - Flatten the active_field_filters to get the context_filters in a single array
     *
     * @param {FieldFiltersVO} active_field_filters
     * @returns {ContextFilterVO[]}
     */
    public static get_context_filters_from_active_field_filters(
        active_field_filters: FieldFiltersVO
    ): ContextFilterVO[] {
        const context_filters: ContextFilterVO[] = [];

        for (const key_i in active_field_filters) {
            const field_filters = active_field_filters[key_i];

            for (const key_j in field_filters) {
                let context_filter = field_filters[key_j];

                if (!(context_filter instanceof ContextFilterVO)) {
                    context_filter = new ContextFilterVO().from(context_filter);
                }

                if (!context_filter) {
                    continue;
                }

                context_filters.push(context_filter);
            }
        }

        return context_filters;
    }

    /**
     * Filter Context Filter Tree By Vo Type
     * - Filter the context_filter e.g. (case when supervision type)
     * - Filter the context_filter tree to only keep the one we want to filter on
     * - We are only intererested by the the actual filter to apply on the given vo_type
     *
     * TODO: to be continued (not finished)
     * TODO: case when we have multiple conditions on the same vo_type e.g.
     * TODO: - we may search by the same field_id with different values
     * TODO: - we may search by different field_id with any values
     *
     * @param {ContextFilterVO} context_filter
     * @param {string} vo_type
     * @param {string[]} from_vo_types
     * @returns {ContextFilterVO}
     */
    public static filter_context_filter_tree_by_vo_type(
        context_filter: ContextFilterVO,
        vo_type: string,
        from_vo_types?: string[]
    ): ContextFilterVO {

        let right: ContextFilterVO = null;

        switch (context_filter?.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:

                if (context_filter.left_hook?.vo_type === vo_type) {
                    // We must keep the left hook
                    context_filter.right_hook = ContextFilterVOManager.find_deep_context_filter_by_vo_type(context_filter.right_hook, vo_type);
                } else {
                    context_filter = null;
                }

                return context_filter;
            case ContextFilterVO.TYPE_FILTER_OR:

                if (context_filter.left_hook?.vo_type === vo_type) {
                    // We must keep the left hook
                    context_filter.right_hook = null;
                    context_filter = context_filter.left_hook;

                } else {
                    //
                    right = ContextFilterVOManager.find_deep_context_filter_by_vo_type(context_filter.right_hook, vo_type);

                    if (right) {
                        // We only keep the filter we want to apply
                        // The actual "right" one
                        // TODO: may be the right_hook has other filter to apply on the same vo_type
                        right.right_hook = null;
                    }

                    context_filter = right;
                }

                return context_filter;
            default:
                if (context_filter.vo_type == vo_type) {
                    return context_filter;
                }

                if ((!from_vo_types) || (from_vo_types.indexOf(context_filter.vo_type) <= -1)) {
                    // Pas une supervision, on laisse passer
                    return context_filter;
                }

                // une supervision et pas du bon type, on supprime
                return null;
        }
    }

    /**
     * Find Deep By Vo Type
     *
     * TODO: to be continued (not finished)
     * TODO: - We should be able to find in both left_hooks and right_hooks
     *
     * @param {ContextFilterVO} context_filter
     * @param {string} vo_type
     * @returns {ContextFilterVO}
     */
    public static find_deep_context_filter_by_vo_type(context_filter: ContextFilterVO, vo_type: string): ContextFilterVO {

        const is_conditionnal: boolean = ContextFilterVOHandler.is_conditional_context_filter(context_filter);
        let context_filter_found: ContextFilterVO = null;

        // context_filter can be a Conditional context filter
        if (is_conditionnal &&
            context_filter?.left_hook?.vo_type == vo_type
        ) {
            // When context_filter is conditionnal, we can find its
            // actual vo field filter in the left hook
            context_filter_found = context_filter.left_hook;

        } else if (!is_conditionnal && (context_filter?.vo_type == vo_type)) {
            // When context_filter is not conditionnal, we can find its
            // actual vo field filter in the given context_filter from the parameter
            context_filter_found = context_filter;
        }

        if (!context_filter_found && context_filter) {
            // If we didn't find the context_filter we must
            // continue to deep search in the right hook
            return ContextFilterVOManager.find_deep_context_filter_by_vo_type(context_filter?.right_hook, vo_type);
        }

        return context_filter_found;
    }


    public static find_context_filter_in_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_find: ContextFilterVO): boolean {

        if (!context_filter_tree_root) {
            return false;
        }

        if (!context_filter_to_find) {
            return false;
        }

        if ((context_filter_tree_root == context_filter_to_find) || ObjectHandler.are_equal(context_filter_tree_root, context_filter_to_find)) {
            return true;
        }

        if (context_filter_tree_root.left_hook) {
            let res = ContextFilterVOManager.find_context_filter_in_tree(context_filter_tree_root.left_hook, context_filter_to_find);
            if (res) {
                return res;
            }
        }

        if (context_filter_tree_root.right_hook) {
            let res = ContextFilterVOManager.find_context_filter_in_tree(context_filter_tree_root.right_hook, context_filter_to_find);
            if (res) {
                return res;
            }
        }

        return false;
    }

    public static getInstance(): ContextFilterVOManager {
        if (!ContextFilterVOManager.instance) {
            ContextFilterVOManager.instance = new ContextFilterVOManager();
        }
        return ContextFilterVOManager.instance;
    }

    private static instance: ContextFilterVOManager = null;

    private constructor() { }
}
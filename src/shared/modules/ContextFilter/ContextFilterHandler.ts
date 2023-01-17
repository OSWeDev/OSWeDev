import { cloneDeep } from "lodash";
import RangeHandler from "../../tools/RangeHandler";
import VOFieldRefVO from "../DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../DataRender/vos/DataFilterOption";
import NumSegment from "../DataRender/vos/NumSegment";
import TSRange from "../DataRender/vos/TSRange";
import ModuleTable from "../ModuleTable";
import ModuleTableField from "../ModuleTableField";
import VOsTypesManager from "../VOsTypesManager";
import ContextFilterVO from "./vos/ContextFilterVO";
import ContextQueryFieldVO from "./vos/ContextQueryFieldVO";
import ContextQueryVO, { query } from "./vos/ContextQueryVO";

export default class ContextFilterHandler {

    public static getInstance(): ContextFilterHandler {
        if (!ContextFilterHandler.instance) {
            ContextFilterHandler.instance = new ContextFilterHandler();
        }
        return ContextFilterHandler.instance;
    }

    private static instance: ContextFilterHandler = null;

    private constructor() { }

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

        return query(api_type_id).field('id').add_filters([filter_none]).ignore_access_hooks();
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

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[vo_field_ref.api_type_id];
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
        let translated_active_options = new ContextFilterVO();

        translated_active_options.field_id = vo_field_ref.field_id;
        translated_active_options.vo_type = vo_field_ref.api_type_id;

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
                translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                translated_active_options.param_numranges = RangeHandler.getInstance().get_ids_ranges_from_list([active_option.numeric_value]);
                break;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                translated_active_options.param_textarray = [active_option.string_value];
                break;

            case ModuleTableField.FIELD_TYPE_enum:
                translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                translated_active_options.param_numranges = [RangeHandler.getInstance().create_single_elt_NumRange(active_option.numeric_value, NumSegment.TYPE_INT)];
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
                translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
                translated_active_options.param_tsranges = [ts_range];
                break;

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');


            default:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
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
                    a.param_numranges = RangeHandler.getInstance().getRangesUnion(a.param_numranges);
                }
                return a;
            }

            if (a.param_tsranges && b.param_tsranges) {
                a.param_tsranges = a.param_tsranges.concat(b.param_tsranges);
                if (try_union) {
                    a.param_tsranges = RangeHandler.getInstance().getRangesUnion(a.param_tsranges);
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
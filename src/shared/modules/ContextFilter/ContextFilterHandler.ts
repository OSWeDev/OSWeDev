import { cloneDeep } from "lodash";
import ContextFilterVO from "./vos/ContextFilterVO";

export default class ContextFilterHandler {

    public static getInstance(): ContextFilterHandler {
        if (!ContextFilterHandler.instance) {
            ContextFilterHandler.instance = new ContextFilterHandler();
        }
        return ContextFilterHandler.instance;
    }

    private static instance: ContextFilterHandler = null;

    private constructor() { }

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

        delete res[ContextFilterVO.CUSTOM_FILTERS_TYPE];

        return res;
    }
}
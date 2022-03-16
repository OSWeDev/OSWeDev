import { cloneDeep } from "lodash";
import ModuleTable from "../ModuleTable";
import ContextFilterVO from "./vos/ContextFilterVO";
import ContextQueryFieldVO from "./vos/ContextQueryFieldVO";
import ContextQueryVO from "./vos/ContextQueryVO";

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
                case ContextFilterVO.TYPE_SUB_QUERY:
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
                case ContextFilterVO.TYPE_SUB_QUERY:
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

        delete res[ContextFilterVO.CUSTOM_FILTERS_TYPE];

        return res;
    }

    /**
     * Renvoie une context query qui renvoie systématiquement 0 éléments, pour bloquer l'accès à un vo par exemple dans un context access hook
     */
    public get_empty_res_context_hook_query(moduletable: ModuleTable<any>) {
        // on veut rien renvoyer, donc on fait une query qui retourne rien
        let filter_none: ContextFilterVO = new ContextFilterVO();
        filter_none.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        filter_none.field_id = 'id';
        filter_none.vo_type = moduletable.vo_type;

        let empty_res: ContextQueryVO = new ContextQueryVO();
        empty_res.base_api_type_id = moduletable.vo_type;
        empty_res.fields = [new ContextQueryFieldVO(moduletable.vo_type, 'id', 'filter_' + moduletable.vo_type + '_id')];
        empty_res.active_api_type_ids = [moduletable.vo_type];
        empty_res.filters = [filter_none];
        empty_res.is_access_hook_def = true;
        return empty_res;
    }
}
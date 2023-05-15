import ISupervisedItem from "../../Supervision/interfaces/ISupervisedItem";
import SupervisionWidgetOptionsVO from "../vos/SupervisionWidgetOptionsVO";
import FieldFilterManager from './FieldFilterManager';
import PromisePipeline from "../../../tools/PromisePipeline/PromisePipeline";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import EnvHandler from "../../../tools/EnvHandler";
import ModuleDAO from "../../DAO/ModuleDAO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../vos/DashboardVO";
import { isEqual } from 'lodash';

/**
 * @class SupervisionWidgetManager
 *  - Manager for the supervision widget
 */
export default class SupervisionWidgetManager {

    /**
     * Find supervision probs by api type ids
     *  - The aim of this function is to load the supervision probs for the given api_type_ids
     *  - That means (for now) we must loop on the given api_type_ids and load the supervision probs for each of them
     *
     * @param {DashboardVO} dashboard
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {{ [api_type_id: string]: { [field_name: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} active_api_type_ids API type ids that have been selected by the user
     * @param {{ offset: number, limit?: number, sort_by_field_id?: string }} pagination Pagination options
     * @returns {Promise<ISupervisedItem[]>}
     */
    public static async find_supervision_probs_by_api_type_ids(
        dashboard: DashboardVO,
        widget_options: SupervisionWidgetOptionsVO,
        active_field_filters: { [api_type_id: string]: { [field_name: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        pagination?: { offset: number, limit?: number, sort_by_field_id?: string },
        options?: { refresh: boolean }
    ): Promise<{ items: ISupervisedItem[], total_count: number }> {

        let data: { items: ISupervisedItem[], total_count: number } = { items: [], total_count: 0 };
        let context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO[] } = {};
        let available_api_type_ids: string[] = [];

        if (active_api_type_ids?.length > 0) {
            // Setted api_type_ids (default or setted from filters)
            available_api_type_ids = active_api_type_ids;
        } else {
            // Default (from supervision widget) api_type_ids
            available_api_type_ids = widget_options?.supervision_api_type_ids;
        }

        // We must update|standardize|normalize the active_field_filters for the given available_api_type_ids
        const active_field_filter_by_api_type_id: {
            [api_type_id: string]: { [api_type_id: string]: { [field_name: string]: ContextFilterVO } }
        } = FieldFilterManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            available_api_type_ids,
            widget_options?.supervision_api_type_ids ?? [],
        );

        // We may need to filter on other api_type_ids (or vo_type) than the supervision_api_type_ids
        const other_field_filter = FieldFilterManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            widget_options.supervision_api_type_ids ?? []
        );

        // TODO: May be add widget_options boolean to enable/disable keep_other_context_filters (or specify api_type_ids to keep)
        const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            other_field_filter,
        );

        /**
         * On est dans un contexte très spécifique : les supervisions
         * Chaque type de supervision est forcément lié à la table des types de supervision
         * donc on ne peut avoir aucune dépendance entre les types de supervision puisque cela signifierait un cycle
         * du coup on peut ignorer totalement les filtres des autres types de supervision lors de la requete pour un type donné
         * et on le fait pour éviter d'avoir des left join (parcours des api_type dans la génération des requetes) sur tous
         * les types de supervision, alors qu'on fait une requete par type et qu'on aggrège les résultats par la suite.
         */

        for (const key_i in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key_i];

            // Get the field_filters for the given api_type_id
            const field_filters = FieldFilterManager.filter_field_filters_by_api_type_id(
                active_field_filter_by_api_type_id[api_type_id],
                available_api_type_ids,
                api_type_id
            );

            const supervision_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                field_filters,
            );

            const context_filters: ContextFilterVO[] = [
                ...supervision_context_filters,
                ...other_context_filters
            ];

            context_filters_by_api_type_id[api_type_id] = context_filters;
        }

        data = await SupervisionWidgetManager.select_supervision_probs_by_api_type_id(
            dashboard,
            widget_options,
            context_filters_by_api_type_id,
            pagination,
        );

        return data;
    }

    public static getInstance(): SupervisionWidgetManager {
        if (!SupervisionWidgetManager.instance) {
            SupervisionWidgetManager.instance = new SupervisionWidgetManager();
        }

        return SupervisionWidgetManager.instance;
    }

    private static instance: SupervisionWidgetManager;


    /**
     * Check if we can select the supervision probs by api_type_ids
     */
    private static can_select_supervision_probs(
        context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO },
        pagination?: { offset: number, limit?: number, sort_by_field_id?: string },
        options?: { force_reload?: boolean },
    ): boolean {
        let can_select = true;

        const self = SupervisionWidgetManager.getInstance();

        let current_paginated_probs = [];

        if (self.paginated_probs?.items?.length > 0) {
            current_paginated_probs = self.paginated_probs.items.slice(
                pagination.offset,
                pagination.offset + pagination.limit
            );
        }

        // We have to select new supervision_probs (from database)
        // if we should reset the paginated_probs
        const should_reset_paginated_probs = SupervisionWidgetManager.should_reset_paginated_probs(
            context_filters_by_api_type_id,
            { force_reload: options?.force_reload ?? false }
        );

        if (should_reset_paginated_probs) {
            return true;
        }

        // We can not select the supervision_probs (from database)
        // if we did not reach the end of the current_paginated_probs
        if (current_paginated_probs?.length == pagination.limit) {
            return false;
        }

        // Case when we have more items in the database than the current_paginated_probs
        // We must continue to select the supervision_probs (from database)
        if (self.paginated_probs.total_count > pagination.offset + pagination.limit) {
            return true;
        }

        return can_select;
    }

    /**
     * Check if we should reset the paginated_probs
     *
     * @param context_filters_by_api_type_id
     * @param options
     * @returns {boolean}
     */
    private static should_reset_paginated_probs(
        context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO },
        options?: { force_reload?: boolean },
    ): boolean {
        const self = SupervisionWidgetManager.getInstance();

        // We don't need to reset the paginated_probs
        // if the given context_filters_by_api_type_id are the same as the previous one
        if (options?.force_reload ||
            !isEqual(self.old_context_filters_by_api_type_id, context_filters_by_api_type_id)
        ) {
            return true;
        }

        return false;
    }

    private static async select_supervision_probs_by_api_type_id(
        dashboard: DashboardVO,
        widget_options: SupervisionWidgetOptionsVO,
        context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO[] },
        pagination?: { offset: number, limit?: number, sort_by_field_id?: string }
    ): Promise<{
        items: ISupervisedItem[],
        total_count: number,
    }> {

        const pipeline_limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(pipeline_limit);

        // ContextQuery as a query builder
        let context_query: ContextQueryVO = null;

        let limit: number = pagination?.limit ?? widget_options?.limit ?? 50;
        let items: ISupervisedItem[] = [];
        let total_count: number = 0;

        for (const api_type_id in context_filters_by_api_type_id) {
            // We must have a single tree of context_filters using AND operator
            const api_type_context_filters: ContextFilterVO[] = context_filters_by_api_type_id[api_type_id];

            // Récupération des sondes
            await promise_pipeline.push(async () => {

                // const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
                // const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

                // if (!has_access) {
                //     return;
                // }

                const context_filters: ContextFilterVO[] = api_type_context_filters ?? [];

                const api_type_context_query = query(api_type_id)
                    .using(dashboard.api_type_ids)
                    .add_filters(context_filters)
                    .set_sort(new SortByVO(api_type_id, 'name', true));

                // Avoid load from cache
                if (!context_query) {
                    // Main first query
                    context_query = api_type_context_query;
                } else {
                    // Union query to be able to select all vos of each api_type_id
                    context_query.union(api_type_context_query);
                }
            });
        }

        console.log(
            'SupervisionWidgetManager.select_supervision_probs_by_api_type_id - context_query',
            JSON.stringify(context_query)
        );

        await promise_pipeline.end();

        await promise_pipeline.push(async () => {

            context_query.set_limit(limit, pagination?.offset ?? 0);

            const rows_s = await context_query.select_vos<ISupervisedItem>();

            for (const key_j in rows_s) {

                const row = rows_s[key_j];

                // Si j'ai une fonction de filtre, je l'utilise
                // if (
                //     SupervisionWidgetManager.getInstance().is_item_accepted &&
                //     SupervisionWidgetManager.getInstance().is_item_accepted[dashboard.id] &&
                //     !SupervisionWidgetManager.getInstance().is_item_accepted[dashboard.id](row)
                // ) {
                //     continue;
                // }

                items.push(row);
            }
        });

        await promise_pipeline.push(async () => {
            // pour éviter de récuperer le cache
            total_count = await context_query.select_count();
        });

        await promise_pipeline.end();

        return { items, total_count };
    }

    public is_item_accepted: { [dashboard_id: number]: (supervised_item: ISupervisedItem) => boolean } = {};

    // As we are loading probs_by_api_type_id in parallel,
    // We must paginate within the buffer (current_pagination) before load the next page from the database
    public paginated_probs: { offset: number, limit?: number, items: ISupervisedItem[], total_count: number } = {
        offset: null, limit: null, items: [], total_count: 0
    };
    public old_context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO } = {};
    public probs_by_api_type_id: { [api_type_id: string]: ISupervisedItem[] } = {};

    protected constructor() { }

    /**
     * permet de définir une fonction de test pour filtrer les Items affichées dans le dashboard de la supervision
     * @param dashboard_id ID du dashboard
     * @param condition fonction faisant le test sur l'item
     */
    public set_item_filter_condition_for_key(dashboard_id: number, condition: (supervised_item: ISupervisedItem) => boolean): void {
        this.is_item_accepted[dashboard_id] = condition;
    }
}
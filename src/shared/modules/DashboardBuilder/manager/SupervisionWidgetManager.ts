import ISupervisedItem from "../../Supervision/interfaces/ISupervisedItem";
import SupervisionWidgetOptionsVO from "../vos/SupervisionWidgetOptionsVO";
import FieldFiltersVOManager from './FieldFiltersVOManager';
import PromisePipeline from "../../../tools/PromisePipeline/PromisePipeline";
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import SupervisionController from "../../Supervision/SupervisionController";
import ISupervisedItemController from "../../Supervision/interfaces/ISupervisedItemController";
import DashboardVO from "../vos/DashboardVO";
import { cloneDeep } from "lodash";

/**
 * SupervisionWidgetManager
 *  - Manager for the supervision widget
 */
export default class SupervisionWidgetManager {

    /**
     * Find supervision probs by api type ids
     *  - The aim of this function is to load the supervision probs for the given api_type_ids
     *
     *  TODO: Add allowed_api_type_ids in Cache in case when pagination changes or when request didn't change
     *
     * @param {DashboardVO} dashboard
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {FieldFiltersVO} active_field_filters
     * @param {string[]} active_api_type_ids api_type_ids that have been selected by the user
     * @param {{ offset: number, limit?: number, sorts?: SortByVO[] }} pagination Pagination options
     * @returns {Promise<ISupervisedItem[]>}
     */
    public static async find_supervision_probs_by_api_type_ids(
        dashboard: DashboardVO,
        widget_options: SupervisionWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        active_api_type_ids: string[],
        pagination?: { offset: number, limit?: number, sorts?: SortByVO[] },
    ): Promise<{ items: ISupervisedItem[], total_count: number }> {
        const self = SupervisionWidgetManager.getInstance();

        const context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO[] } = {};

        // We must check the access for each api_type_id
        // And then get the allowed api_type_ids
        const allowed_api_type_ids: string[] = await SupervisionWidgetManager.filter_allowed_api_type_ids(
            widget_options,
            active_api_type_ids,
        );

        self.allowed_api_type_ids = allowed_api_type_ids;

        // We must update|standardize|normalize the active_field_filters for the given allowed_api_type_ids
        const active_field_filter_by_api_type_id: {
            [api_type_id: string]: FieldFiltersVO
        } = FieldFiltersVOManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            allowed_api_type_ids,
            widget_options?.supervision_api_type_ids ?? [],
        );

        // We may need to filter on other api_type_ids (or vo_type) than the supervision_api_type_ids
        const other_field_filter = FieldFiltersVOManager.filter_field_filters_by_api_type_ids_to_exlude(
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

        for (const key_i in allowed_api_type_ids) {
            const api_type_id: string = allowed_api_type_ids[key_i];

            // Get the field_filters for the given api_type_id
            const field_filters = FieldFiltersVOManager.filter_field_filters_by_api_type_id(
                active_field_filter_by_api_type_id[api_type_id],
                allowed_api_type_ids,
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

        // Select the supervision probs by api_type_id
        return await SupervisionWidgetManager.select_supervision_probs_by_api_type_id(
            dashboard,
            widget_options,
            context_filters_by_api_type_id,
            pagination,
        );
    }

    public static getInstance(): SupervisionWidgetManager {
        if (!SupervisionWidgetManager.instance) {
            SupervisionWidgetManager.instance = new SupervisionWidgetManager();
        }

        return SupervisionWidgetManager.instance;
    }

    private static instance: SupervisionWidgetManager;

    /**
     * should_check_api_type_ids_access
     * - Check if we should check the api_type_ids access
     * - We should check the api_type_ids access if the pagination changes or if the request didn't change
     *
     * @returns {boolean}
     */
    private static should_check_api_type_ids_access(
        dashboard: DashboardVO,
        widget_options: SupervisionWidgetOptionsVO,
        context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO[] },
        pagination?: { offset: number, limit?: number, sort_by_field_id?: string }
    ): boolean {
        let should_check = true;

        return should_check;
    }

    /**
     * filter_allowed_api_type_ids
     * - This method is responsible for filtering the allowed api type ids
     * - We must check the user access for each api_type_id
     * - We must check if the api_type_id is active
     *
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {string} active_api_type_ids api_type_ids that have been selected by the user
     * @returns {Promise<string[]>}
     */
    private static async filter_allowed_api_type_ids(
        widget_options: SupervisionWidgetOptionsVO,
        active_api_type_ids: string[],
    ): Promise<string[]> {

        // Default api_type_ids (should be from widget_options)
        let available_api_type_ids: string[] = widget_options?.supervision_api_type_ids;

        console.log('available_api_type_ids', available_api_type_ids);

        // available_api_type_ids
        if (active_api_type_ids?.length > 0) {
            // Setted api_type_ids (default or setted from filters)
            // Should be the intersection between the active_api_type_ids and the widget_options?.supervision_api_type_ids
            available_api_type_ids = active_api_type_ids.filter((api_type_id: string) => {
                return widget_options?.supervision_api_type_ids?.includes(api_type_id);
            });
        }

        console.log('available_api_type_ids', available_api_type_ids);

        const registered_api_type_ids: string[] = [];

        for (const key in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key];

            const registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

            if (!registered_api_type?.is_actif()) {
                continue;
            }

            registered_api_type_ids.push(api_type_id);
        }

        const pipeline_limit = registered_api_type_ids.length; // One query|request by api_type_id
        let promise_pipeline = new PromisePipeline(pipeline_limit);

        const allowed_api_type_ids: string[] = [];

        for (const key in registered_api_type_ids) {
            // Get the api_type_id
            const api_type_id: string = registered_api_type_ids[key];

            // Récupération des sondes
            await promise_pipeline.push(async () => {

                const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_READ,
                    api_type_id
                );

                const has_access = await ModuleAccessPolicy.getInstance().testAccess(
                    access_policy_name
                );

                if (!has_access) {
                    return;
                }

                allowed_api_type_ids.push(api_type_id);
            });
        }

        await promise_pipeline.end();

        return allowed_api_type_ids;
    }

    /**
     * select_supervision_probs_by_api_type_id
     *
     * @param {DashboardVO} dashboard
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {{ [api_type_id: string]: ContextFilterVO[] }} context_filters_by_api_type_id
     * @param {{ offset: number, limit?: number, sorts?: SortByVO[] }} pagination
     * @returns {Promise<{ items: ISupervisedItem[], total_count: number }>}
     */
    private static async select_supervision_probs_by_api_type_id(
        dashboard: DashboardVO,
        widget_options: SupervisionWidgetOptionsVO,
        context_filters_by_api_type_id: { [api_type_id: string]: ContextFilterVO[] },
        pagination?: { offset: number, limit?: number, sorts?: SortByVO[] }
    ): Promise<{
        items: ISupervisedItem[],
        total_count: number,
    }> {

        const limit: number = pagination?.limit ?? widget_options?.limit ?? 50;

        const pipeline_limit = Object.keys(context_filters_by_api_type_id).length; // One query|request by api_type_id
        const promise_pipeline = new PromisePipeline(pipeline_limit);

        // ContextQuery as a query builder
        let context_query: ContextQueryVO = null;

        let items: ISupervisedItem[] = [];
        let total_count: number = 0;

        for (const api_type_id in context_filters_by_api_type_id) {

            // We must have a single tree of context_filters using AND operator
            const context_filters: ContextFilterVO[] = context_filters_by_api_type_id[api_type_id];

            // Sorts by field_id
            const sorts = pagination?.sorts?.map((sort: SortByVO) => {
                sort.vo_type = api_type_id;

                return sort;
            }) ?? [];

            const api_type_context_query = query(api_type_id)
                .using(dashboard.api_type_ids)
                .add_filters(context_filters)
                .set_sorts(sorts)
                .set_query_distinct();

            if (!context_query) {
                // Main first query
                context_query = api_type_context_query;
            } else {
                // Union query to be able to select all vos of each api_type_id
                context_query.union(api_type_context_query);
            }
        }

        await promise_pipeline.push(async () => {
            const vos_context_query = cloneDeep(context_query);

            vos_context_query.set_limit(limit, pagination?.offset ?? 0);

            items = await vos_context_query.select_vos();
        });

        await promise_pipeline.push(async () => {
            total_count = await context_query.select_count();
        });

        await promise_pipeline.end();

        return { items, total_count };
    }

    public is_item_accepted: { [dashboard_id: number]: (supervised_item: ISupervisedItem) => boolean } = {};
    public allowed_api_type_ids: string[] = [];

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
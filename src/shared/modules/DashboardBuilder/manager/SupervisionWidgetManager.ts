import ISupervisedItem from "../../Supervision/interfaces/ISupervisedItem";
import SupervisionWidgetOptionsVO from "../vos/SupervisionWidgetOptionsVO";
import FieldFilterManager from '../../ContextFilter/manager/FieldFilterManager';
import PromisePipeline from "../../../tools/PromisePipeline/PromisePipeline";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import EnvHandler from "../../../tools/EnvHandler";
import ModuleDAO from "../../DAO/ModuleDAO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../vos/DashboardVO";

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
     * TODO: Do it in single request
     *
     *
     * TODO: Case refactor method ModuleSupervisionGRController.item_filter_is_stc_half_month (specific to Yve rocher)
     * TODO: - Whe must filter item by api_type_id == SupervisedAdpPaieVO.API_TYPE_ID
     * TODO: - Case when does not have employee_id (no employee) => no need to proceed
     * TODO: - Whe must get contracts by employee_id
     * TODO: - Create method that provide the list of contracts for an employee
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
        pagination?: { offset: number, limit?: number, sort_by_field_id?: string }
    ): Promise<{ items: ISupervisedItem[], total_count: number }> {

        const pipeline_limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(pipeline_limit);

        let available_api_type_ids: string[] = [];
        let items: ISupervisedItem[] = [];
        let total_count: number = 0;

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

            const field_filters = FieldFilterManager.filter_field_filters_by_api_type_id(
                Object.assign({}, active_field_filter_by_api_type_id[api_type_id]),
                available_api_type_ids,
                api_type_id
            );

            const filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                field_filters,
            );

            console.log('find_supervision_probs_by_api_type_ids', api_type_id, JSON.stringify(field_filters), JSON.stringify(filters));
        }

        for (const key_i in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key_i];

            const field_filters = FieldFilterManager.filter_field_filters_by_api_type_id(
                Object.assign({}, active_field_filter_by_api_type_id[api_type_id]),
                available_api_type_ids,
                api_type_id
            );

            const filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                field_filters,
            );

            // Récupération des sondes
            await promise_pipeline.push(async () => {

                if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                    return;
                }

                const sort_by = new SortByVO(api_type_id, 'name', true);
                if (pagination?.sort_by_field_id?.length > 0) {
                    sort_by.field_id = pagination.sort_by_field_id;
                }

                // Avoid load from cache
                let rows_s: ISupervisedItem[] = await query(api_type_id)
                    .set_limit(pagination?.limit ?? widget_options.limit, pagination?.offset ?? 0)
                    .using(dashboard.api_type_ids)
                    .add_filters(filters)
                    .set_sort(sort_by)
                    .select_vos<ISupervisedItem>();

                for (const key_j in rows_s) {

                    let row = rows_s[key_j];

                    // Si j'ai une fonction de filtre, je l'utilise
                    if (
                        SupervisionWidgetManager.getInstance().is_item_accepted &&
                        SupervisionWidgetManager.getInstance().is_item_accepted[dashboard.id] &&
                        !SupervisionWidgetManager.getInstance().is_item_accepted[dashboard.id](row)
                    ) {
                        continue;
                    }

                    items.push(row);
                    // new_supervised_items_by_names[item.name] = item;
                    // new_supervised_items_by_cat_id[item.category_id] = item;

                    // if (first_build) {
                    //     if (!api_type_ids_by_category_ids[item.category_id]) {
                    //         api_type_ids_by_category_ids[item.category_id] = [];
                    //     }

                    //     if (!already_add_api_type_ids_by_category_ids[item.category_id]) {
                    //         already_add_api_type_ids_by_category_ids[item.category_id] = {};
                    //     }

                    //     if (!already_add_api_type_ids_by_category_ids[item.category_id][item._type]) {
                    //         already_add_api_type_ids_by_category_ids[item.category_id][item._type] = true;
                    //         api_type_ids_by_category_ids[item.category_id].push(item._type);
                    //         api_type_ids.push(sup_api_type_id);
                    //     }
                    // }
                }
            });

            await promise_pipeline.push(async () => {

                if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                    return;
                }

                // pour éviter de récuperer le cache
                let items_c: number = await query(api_type_id)
                    .using(dashboard.api_type_ids)
                    .add_filters(filters)
                    .select_count();

                if (items_c) {
                    total_count += items_c;
                }
            });
        }

        await promise_pipeline.end();

        return { items, total_count };
    }

    public static getInstance(): SupervisionWidgetManager {
        if (!SupervisionWidgetManager.instance) {
            SupervisionWidgetManager.instance = new SupervisionWidgetManager();
        }

        return SupervisionWidgetManager.instance;
    }

    private static instance: SupervisionWidgetManager;

    public is_item_accepted: { [dashboard_id: number]: (supervised_item: ISupervisedItem) => boolean } = {};

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
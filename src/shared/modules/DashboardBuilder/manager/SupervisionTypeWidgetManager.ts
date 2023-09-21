import SupervisionManager from "../../Supervision/manager/SupervisionManager";
import PromisePipeline from '../../../tools/PromisePipeline/PromisePipeline';
import SupervisedCategoryVO from '../../Supervision/vos/SupervisedCategoryVO';
import ISupervisedItemController from '../../Supervision/interfaces/ISupervisedItemController';
import SupervisionTypeWidgetOptionsVO from '../vos/SupervisionTypeWidgetOptionsVO';
import ContextQueryVO, { query } from '../../ContextFilter/vos/ContextQueryVO';
import SupervisionController from '../../Supervision/SupervisionController';
import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import FieldFiltersVO from "../vos/FieldFiltersVO";
import ObjectHandler from "../../../tools/ObjectHandler";
import DashboardVO from "../vos/DashboardVO";
import ModuleDAO from '../../DAO/ModuleDAO';

/**
 * @class SupervisionTypeWidgetManager
 *  - This class is responsible for managing the supervision type widgets
 */
export default class SupervisionTypeWidgetManager {

    /**
     * load_supervision_api_type_ids_by_dashboard
     * - This method is responsible for loading the supervision api type ids by the given dashboard
     *
     * @param {DashboardVO} dashboard
     * @returns {string[]}
     */
    public static load_supervision_api_type_ids_by_dashboard(dashboard: DashboardVO): string[] {
        if (!(dashboard?.api_type_ids?.length > 0)) {
            return null;
        }

        const all_available_supervision_api_type_ids = SupervisionManager.load_all_supervision_api_type_ids();

        return all_available_supervision_api_type_ids.filter((api_type_id) => {
            return dashboard.api_type_ids.includes(api_type_id);
        });
    }

    /**
     * Find supervision probs by api type ids
     *  - The aim of this function is to load the supervision probs for the given api_type_ids
     *  - That means (for now) we must loop on the given api_type_ids and load the supervision probs for each of them
     *
     * @param {DashboardVO} dashboard
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {FieldFiltersVO} active_field_filters
     * @param {string[]} active_supervision_api_type_ids API type ids that have been selected by the user
     * @param {{ offset: number, limit?: number, sort_by_field_id?: string }} pagination Pagination options
     * @returns {Promise<ISupervisedItem[]>}
     */
    public static async find_available_supervision_type_ids(
        dashboard: DashboardVO,
        widget_options: SupervisionTypeWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        options?: {
            categories_by_name?: { [name: string]: SupervisedCategoryVO },
            refresh?: boolean,
        }
    ): Promise<{ items: string[], total_count: number }> {

        let available_supervision_api_type_ids: string[] = [];

        const supervision_category_active_field_filters = active_field_filters && active_field_filters[SupervisedCategoryVO.API_TYPE_ID];
        const context_query_by_api_type_id: { [api_type_id: string]: ContextQueryVO } = {};

        let categories_by_name: { [name: string]: SupervisedCategoryVO } = options?.categories_by_name ?? null;
        let category_selections: SupervisedCategoryVO[] = null;

        // Supervision api type ids that have been registered in widget_options
        const supervision_api_type_ids: string[] = widget_options.supervision_api_type_ids;

        if (!categories_by_name) {
            categories_by_name = await SupervisionTypeWidgetManager.find_all_supervised_categories_by_name();
        }

        const registered_supervision_api_type_ids: string[] = [];

        for (const key in supervision_api_type_ids) {
            const api_type_id: string = supervision_api_type_ids[key];

            const registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

            if (!registered_api_type?.is_actif()) {
                continue;
            }

            registered_supervision_api_type_ids.push(api_type_id);
        }

        // If there is no filter, we show all default (widget_options) ones
        if (!supervision_category_active_field_filters && !(registered_supervision_api_type_ids?.length > 0)) {
            available_supervision_api_type_ids = registered_supervision_api_type_ids;

            return {
                total_count: available_supervision_api_type_ids.length,
                items: available_supervision_api_type_ids,
            };
        }

        // Shall load all active_supervision_api_type_ids by default
        // Show active_supervision_api_type_ids that match the supervision_category_active_field_filters
        for (const field_id in supervision_category_active_field_filters) {
            const filter = supervision_category_active_field_filters[field_id];

            if (!filter) {
                continue;
            }

            // Get each category from the textarray
            category_selections = filter.param_textarray?.map((category_name: string) => {
                return categories_by_name[category_name];
            });
        }

        const pipeline_limit = registered_supervision_api_type_ids.length; // One query|request by api_type_id
        let promise_pipeline = new PromisePipeline(pipeline_limit, 'SupervisionTypeWidgetManager.find_available_supervision_type_ids');

        const allowed_supervision_api_type_ids: string[] = [];

        // Load each active_supervision_api_type_ids count by selected category
        // - We must check if the controller is actif
        for (const key in registered_supervision_api_type_ids) {
            const api_type_id: string = registered_supervision_api_type_ids[key];

            // Load each active_supervision_api_type_ids count by selected category
            // We must do it in two steps to avoid check access failure
            await promise_pipeline.push(async () => {

                const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_READ,
                    api_type_id
                );

                const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

                if (!has_access) {
                    return;
                }

                allowed_supervision_api_type_ids.push(api_type_id);
            });
        }

        await promise_pipeline.end();

        promise_pipeline = new PromisePipeline(pipeline_limit, 'SupervisionTypeWidgetManager.find_available_supervision_type_ids');

        for (const key in allowed_supervision_api_type_ids) {
            const api_type_id: string = allowed_supervision_api_type_ids[key];

            let api_type_context_query = query(api_type_id)
                .using(dashboard.api_type_ids);

            if (category_selections?.length > 0) {
                api_type_context_query = api_type_context_query.filter_by_num_eq(
                    'category_id',
                    category_selections?.map((cat) => cat?.id)
                );
            }

            context_query_by_api_type_id[api_type_id] = api_type_context_query;
        }

        await promise_pipeline.end();

        promise_pipeline = new PromisePipeline(pipeline_limit, 'SupervisionTypeWidgetManager.find_available_supervision_type_ids');

        for (const key in allowed_supervision_api_type_ids) {
            const api_type_id: string = allowed_supervision_api_type_ids[key];

            const api_type_context_query = context_query_by_api_type_id[api_type_id];

            await promise_pipeline.push(async () => {
                let items_count: number = await api_type_context_query.select_count();

                if (items_count > 0) {
                    available_supervision_api_type_ids.push(api_type_id);
                }
            });
        }

        await promise_pipeline.end();

        return {
            total_count: available_supervision_api_type_ids.length,
            items: available_supervision_api_type_ids,
        };
    }

    public static async find_all_supervised_categories_by_name(): Promise<{ [category_name: string]: SupervisedCategoryVO }> {
        const self = SupervisionTypeWidgetManager.getInstance();

        const sup_categories: SupervisedCategoryVO[] = await query(SupervisedCategoryVO.API_TYPE_ID)
            .select_vos<SupervisedCategoryVO>();

        const categories_by_name = ObjectHandler.map_array_by_object_field_value(
            sup_categories,
            'name'
        );

        self.categories_by_name = categories_by_name;

        return categories_by_name;
    }

    public static getInstance(): SupervisionTypeWidgetManager {
        if (!SupervisionTypeWidgetManager.instance) {
            SupervisionTypeWidgetManager.instance = new SupervisionTypeWidgetManager();
        }

        return SupervisionTypeWidgetManager.instance;
    }

    private static instance: SupervisionTypeWidgetManager;

    public categories_by_name: { [name: string]: SupervisedCategoryVO } = null;
}
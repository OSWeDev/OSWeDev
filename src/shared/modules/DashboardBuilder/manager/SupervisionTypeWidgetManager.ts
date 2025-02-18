import SupervisionManager from "../../Supervision/manager/SupervisionManager";
import PromisePipeline from '../../../tools/PromisePipeline/PromisePipeline';
import SupervisedCategoryVO from '../../Supervision/vos/SupervisedCategoryVO';
import SupervisedProbeGroupVO from '../../Supervision/vos/SupervisedProbeGroupVO';
import ISupervisedItemController from '../../Supervision/interfaces/ISupervisedItemController';
import SupervisionTypeWidgetOptionsVO from '../vos/SupervisionTypeWidgetOptionsVO';
import ContextQueryVO, { query } from '../../ContextFilter/vos/ContextQueryVO';
import SupervisionController from '../../Supervision/SupervisionController';
import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import FieldFiltersVO from "../vos/FieldFiltersVO";
import ObjectHandler, { field_names } from "../../../tools/ObjectHandler";
import DashboardVO from "../vos/DashboardVO";
import ModuleDAO from '../../DAO/ModuleDAO';
import DashboardBuilderBoardManager from "./DashboardBuilderBoardManager";
import FieldValueFilterWidgetManager from "./FieldValueFilterWidgetManager";
import SupervisedProbeVO from "../../Supervision/vos/SupervisedProbeVO";
import ContextFilterVOManager from "../../ContextFilter/manager/ContextFilterVOManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import FieldFiltersVOManager from "./FieldFiltersVOManager";
import ISupervisedItem from "../../Supervision/interfaces/ISupervisedItem";
import RangeHandler from "../../../tools/RangeHandler";
import NumRange from "../../DataRender/vos/NumRange";

/**
 * @class SupervisionTypeWidgetManager
 *  - This class is responsible for managing the supervision type widgets
 */
export default class SupervisionTypeWidgetManager {

    private static instance: SupervisionTypeWidgetManager;

    // public categories_by_name: { [name: string]: SupervisedCategoryVO } = null;

    /**
     * load_supervision_api_type_ids_by_dashboard
     * - This method is responsible for loading the supervision api type ids by the given dashboard
     *
     * @param {string[]} api_type_ids of the dashboard
     * @returns {string[]}
     */
    public static load_supervision_api_type_ids_by_dashboard(api_type_ids: string[]): string[] {
        if (!(api_type_ids?.length > 0)) {
            return null;
        }

        const all_available_supervision_api_type_ids = SupervisionManager.load_all_supervision_api_type_ids();

        return all_available_supervision_api_type_ids.filter((api_type_id) => {
            return api_type_ids.includes(api_type_id);
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
            groups?: SupervisedProbeGroupVO[],
            refresh?: boolean,
        }
    ): Promise<{ items: string[], total_count: number }> {

        let available_supervision_api_type_ids: string[] = [];

        const supervision_category_active_field_filters = active_field_filters && active_field_filters[SupervisedCategoryVO.API_TYPE_ID];
        const supervision_group_selection_active_field_filters = active_field_filters && active_field_filters[SupervisedProbeGroupVO.API_TYPE_ID];
        const context_query_by_api_type_id: { [api_type_id: string]: ContextQueryVO } = {};

        let categories_by_name: { [name: string]: SupervisedCategoryVO } = options?.categories_by_name ?? null;
        let category_selections: SupervisedCategoryVO[] = null;
        let probe_id_ranges: NumRange[] = [];

        // Supervision api type ids that have been registered in widget_options
        const supervision_api_type_ids: string[] = widget_options.supervision_api_type_ids;

        if (!categories_by_name) {
            categories_by_name = await SupervisionTypeWidgetManager.find_all_supervised_categories_by_name();
        }

        const registered_supervision_api_type_ids: string[] = [];
        const { api_type_ids, discarded_field_paths } = await DashboardBuilderBoardManager.get_api_type_ids_and_discarded_field_paths(dashboard.id);

        for (const key in supervision_api_type_ids) {
            const api_type_id: string = supervision_api_type_ids[key];

            const registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

            if (!registered_api_type?.is_actif()) {
                continue;
            }

            registered_supervision_api_type_ids.push(api_type_id);
        }

        // If there is no filter, we show all default (widget_options) ones
        if (!(registered_supervision_api_type_ids?.length > 0)
            && !supervision_category_active_field_filters
            && !supervision_group_selection_active_field_filters
        ) {
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

            if (!filter || !filter.param_textarray?.length) {
                continue;
            }

            // Get each category from the textarray
            category_selections = filter.param_textarray?.map((category_name: string) => {
                return categories_by_name[category_name];
            });
        }

        // gestion des filtre de groupes
        for (const field_id in supervision_group_selection_active_field_filters) {
            const filter = supervision_group_selection_active_field_filters[field_id];

            if (!filter) {
                continue;
            }

            if (!filter.param_tsranges?.length) {
                console.debug('SupervisionTypeWidgetManager.find_available_supervision_type_ids: filter de groupe non géré ' + JSON.stringify(filter));
                continue;
            }

            if (!options?.groups?.length) {
                console.debug('SupervisionTypeWidgetManager.find_available_supervision_type_ids: pas de group chargés ');
                continue;
            }

            // Get each category from the param_tsranges
            for (const gi in options.groups) {
                const group: SupervisedProbeGroupVO = options.groups[gi];
                if (!group) {
                    continue;
                }
                if (RangeHandler.any_range_intersects_any_range(group.ts_ranges, filter.param_tsranges) && !!group.probe_id_ranges?.length) {
                    probe_id_ranges.push(...group.probe_id_ranges);
                }
            }
        }

        if (!!probe_id_ranges?.length) {
            probe_id_ranges = RangeHandler.getRangesUnion(probe_id_ranges);
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

                const access_policy_name = ModuleDAO.instance.getAccessPolicyName(
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
                .using(api_type_ids);

            FieldValueFilterWidgetManager.add_discarded_field_paths(api_type_context_query, discarded_field_paths);

            if (category_selections?.length > 0) {
                api_type_context_query = api_type_context_query.filter_by_num_eq(
                    field_names<ISupervisedItem>().category_id,
                    category_selections?.map((cat) => cat?.id)
                );
            }
            if (probe_id_ranges?.length > 0) {
                api_type_context_query = api_type_context_query.filter_by_num_x_ranges(
                    field_names<ISupervisedItem>().probe_id, probe_id_ranges);
            }

            context_query_by_api_type_id[api_type_id] = api_type_context_query;
        }

        await promise_pipeline.end();

        promise_pipeline = new PromisePipeline(pipeline_limit, 'SupervisionTypeWidgetManager.find_available_supervision_type_ids');

        for (const key in allowed_supervision_api_type_ids) {
            const api_type_id: string = allowed_supervision_api_type_ids[key];

            const api_type_context_query = context_query_by_api_type_id[api_type_id];

            await promise_pipeline.push(async () => {
                const items_count: number = await api_type_context_query.select_count();

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
        // const self = SupervisionTypeWidgetManager.getInstance();

        const sup_categories: SupervisedCategoryVO[] = await query(SupervisedCategoryVO.API_TYPE_ID)
            .select_vos<SupervisedCategoryVO>();

        const categories_by_name = ObjectHandler.map_array_by_object_field_value(
            sup_categories,
            'name'
        );

        // self.categories_by_name = categories_by_name;

        return categories_by_name;
    }

    public static async find_all_supervised_probes_by_sup_api_type_ids(): Promise<{ [sup_api_type_id: string]: SupervisedProbeVO }> {
        // const self = SupervisionTypeWidgetManager.getInstance();

        const sup_probes: SupervisedProbeVO[] = await query(SupervisedProbeVO.API_TYPE_ID)
            .select_vos<SupervisedProbeVO>();

        const probes_by_sup_api_type_ids = ObjectHandler.map_array_by_object_field_value(
            sup_probes,
            field_names<SupervisedProbeVO>().sup_item_api_type_id
        );

        // self.probes_by_sup_api_type_ids = probes_by_sup_api_type_ids;

        return probes_by_sup_api_type_ids;
    }

    public static async find_count_by_api_type_id_state(
        dashboard: DashboardVO,
        widget_options: SupervisionTypeWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        active_api_type_ids: string[],
        options: {
            active_api_type_ids: string[];
            all_states: number[];
        }
    ): Promise<{ [sup_api_type_id: string]: { [state: number]: number } }> {

        const res: { [sup_api_type_id: string]: { [state: number]: number } } = {};
        if (!options
            || !options.active_api_type_ids || !options.active_api_type_ids?.length
            || !options.all_states || !options.all_states?.length) {
            return res;
        }

        // One query|request by api_type_id
        const pipeline_limit = options.active_api_type_ids.length;
        const promise_pipeline = new PromisePipeline(pipeline_limit, 'SupervisionTypeWidgetManager.find_count_by_api_type_id_state');
        const { api_type_ids, discarded_field_paths } = await DashboardBuilderBoardManager.get_api_type_ids_and_discarded_field_paths(dashboard.id);

        const field_filters_by_api_type_id: {
            [api_type_id: string]: FieldFiltersVO
        } = FieldFiltersVOManager.update_field_filters_for_required_api_type_ids(
            widget_options,
            active_field_filters,
            active_api_type_ids,
            options?.active_api_type_ids ?? [],
        );

        // We may need to filter on other api_type_ids (or vo_type) than the supervision_api_type_ids
        const other_field_filter: FieldFiltersVO = FieldFiltersVOManager.filter_field_filters_by_api_type_ids_to_exlude(
            widget_options,
            active_field_filters,
            widget_options.supervision_api_type_ids ?? []
        );

        // NB : le test d'acces selon le role connecté ast déja fait pour recolter les available_api_type_ids
        for (const ai in options.active_api_type_ids) {
            const sup_api_type_id = options.active_api_type_ids[ai];
            const api_type_field_filters: FieldFiltersVO = field_filters_by_api_type_id[sup_api_type_id];

            // FieldFiltersVO ==  [api_type_id: string]: { [field_id: string]: ContextFilterVO }
            // on retire les filtres par état prééxistant dans active_field_filters
            if (!!api_type_field_filters && !!api_type_field_filters[sup_api_type_id]) {
                for (const field_id in api_type_field_filters[sup_api_type_id]) {
                    const filter: ContextFilterVO = api_type_field_filters[sup_api_type_id][field_id];

                    if (filter.field_name == field_names<ISupervisedItem>().state) {
                        delete api_type_field_filters[sup_api_type_id][field_id];
                        continue;
                    }
                }
            }

            const other_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                other_field_filter,
            );

            const api_type_context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
                api_type_field_filters
            );

            res[sup_api_type_id] = {};

            for (const si in options.all_states) {
                const state_context_filter: ContextFilterVO = new ContextFilterVO();
                state_context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
                state_context_filter.field_name = field_names<ISupervisedItem>().state;
                state_context_filter.param_numeric = options.all_states[si];
                state_context_filter.vo_type = sup_api_type_id;

                const context_filters: ContextFilterVO[] = [
                    ...api_type_context_filters,
                    ...other_context_filters,
                    state_context_filter,
                ];

                const api_type_context_query = query(sup_api_type_id)
                    .using(api_type_ids)
                    .add_filters(context_filters);

                FieldValueFilterWidgetManager.add_discarded_field_paths(
                    api_type_context_query,
                    discarded_field_paths
                );

                await promise_pipeline.push(async () => {
                    const count: number = await api_type_context_query.select_count();

                    // console.log(await api_type_context_query.get_select_query_str());

                    if (count >= 0) {
                        res[sup_api_type_id][si] = count;
                    }
                });
            }
        }

        await promise_pipeline.end();

        return res;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): SupervisionTypeWidgetManager {
        if (!SupervisionTypeWidgetManager.instance) {
            SupervisionTypeWidgetManager.instance = new SupervisionTypeWidgetManager();
        }

        return SupervisionTypeWidgetManager.instance;
    }
}
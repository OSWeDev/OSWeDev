import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import DashboardGraphVORefVO from "../vos/DashboardGraphVORefVO";
import DashboardVO from "../vos/DashboardVO";

/**
 * Dashboard Builder Board Manager
 */
export default class DashboardBuilderBoardManager {

    /**
     * Load api_type_ids and discarded field paths for a dashboard
     *  - Load the discarded field paths from the datatabase by the provided dashboard
     *
     * @param {number} dashboard_id
     * @returns {{
     *     api_type_ids: string[],
     *     discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }
     * }}
     */
    public static async get_api_type_ids_and_discarded_field_paths(dashboard_id: number): Promise<{
        api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }
    }> {
        const {
            api_type_ids_by_dashboard_id,
            discarded_field_paths_by_dashboard_id
        } = DashboardBuilderBoardManager.getInstance();

        if (discarded_field_paths_by_dashboard_id[dashboard_id]) {
            return {
                api_type_ids: api_type_ids_by_dashboard_id[dashboard_id],
                discarded_field_paths: discarded_field_paths_by_dashboard_id[dashboard_id]
            };
        }

        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DashboardGraphVORefVO.API_TYPE_ID);
        const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

        if (!has_access) {
            return;
        }

        const db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', dashboard_id)
            .select_vos<DashboardGraphVORefVO>();

        // let db_cell_source_by_vo_type: { [vo_type: string]: DashboardGraphVORefVO } = {};
        const discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};
        const api_type_ids: string[] = [];

        for (const i in db_cells_source) {
            // db_cell_source_by_vo_type[db_cells_source[i].vo_type] = db_cells_source[i];
            const vo_type = db_cells_source[i].vo_type;
            const db_cell_source = db_cells_source[i];

            api_type_ids.push(vo_type);

            if (!db_cell_source.values_to_exclude) {
                continue;
            }

            for (const key in db_cell_source.values_to_exclude) {
                const field_id: string = db_cell_source.values_to_exclude[key];

                if (!discarded_field_paths[vo_type]) {
                    discarded_field_paths[vo_type] = {};
                }

                discarded_field_paths[vo_type][field_id] = true;
            }
        }

        discarded_field_paths_by_dashboard_id[dashboard_id] = discarded_field_paths;
        api_type_ids_by_dashboard_id[dashboard_id] = api_type_ids;

        return {
            api_type_ids,
            discarded_field_paths
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardBuilderBoardManager {
        if (!DashboardBuilderBoardManager.instance) {
            DashboardBuilderBoardManager.instance = new DashboardBuilderBoardManager();
        }
        return DashboardBuilderBoardManager.instance;
    }

    protected static instance: DashboardBuilderBoardManager = null;

    /**
     * JNE : @Manuel Pas convaincu par ce cache : comment il est invalidé ? Comment on le rafraichit ? Si on change la conf du dashboard pour changer un discarded path, on rafraichit le cache ?
     */
    public discarded_field_paths_by_dashboard_id: { [dashboard_id: number]: { [vo_type: string]: { [field_id: string]: boolean } } } = {};
    public api_type_ids_by_dashboard_id: { [dashboard_id: number]: string[] } = {};
}
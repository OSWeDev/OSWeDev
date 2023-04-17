import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardGraphVORefVO from "../vos/DashboardGraphVORefVO";
import DashboardVO from "../vos/DashboardVO";

/**
 * Dashboard Builder Board Manager
 */
export class DashboardBuilderBoardManager {

    /**
     * Load discarded field paths
     *  - Load the discarded field paths from the datatabase by the provided dashboard
     *
     * @param {DashboardVO} dashboard
     * @returns {{ [vo_type: string]: { [field_id: string]: boolean } }}
     */
    public static async load_discarded_field_paths(
        dashboard: DashboardVO
    ): Promise<{ [vo_type: string]: { [field_id: string]: boolean } }> {

        let db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', dashboard.id)
            .select_vos<DashboardGraphVORefVO>();

        // let db_cell_source_by_vo_type: { [vo_type: string]: DashboardGraphVORefVO } = {};
        let discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};

        for (let i in db_cells_source) {
            // db_cell_source_by_vo_type[db_cells_source[i].vo_type] = db_cells_source[i];
            let vo_type = db_cells_source[i].vo_type;
            let db_cell_source = db_cells_source[i];

            if (!db_cell_source.values_to_exclude) {
                continue;
            }

            for (let index_field_id in db_cell_source.values_to_exclude) {
                let field_id: string = db_cell_source.values_to_exclude[index_field_id];

                if (!discarded_field_paths[vo_type]) {
                    discarded_field_paths[vo_type] = {};
                }
                discarded_field_paths[vo_type][field_id] = true;
            }
        }

        return discarded_field_paths;
    }
}
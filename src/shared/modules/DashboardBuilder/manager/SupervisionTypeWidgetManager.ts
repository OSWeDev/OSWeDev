import { SupervisionManager } from "../../Supervision/manager/SupervisionManager";
import DashboardVO from "../vos/DashboardVO";

/**
 * @class SupervisionTypeWidgetManager
 *  - This class is responsible for managing the supervision type widgets
 */
export class SupervisionTypeWidgetManager {

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

    public static getInstance(): SupervisionTypeWidgetManager {
        if (!SupervisionTypeWidgetManager.instance) {
            SupervisionTypeWidgetManager.instance = new SupervisionTypeWidgetManager();
        }

        return SupervisionTypeWidgetManager.instance;
    }

    private static instance: SupervisionTypeWidgetManager;


}
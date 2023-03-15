import DashboardPageVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";

export default class ResetFiltersWidgetController {

    public static getInstance(): ResetFiltersWidgetController {
        if (!this.instance) {
            this.instance = new ResetFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public reseters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: () => Promise<void> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    private constructor() { }

    public register_reseter(dashboard_page: DashboardPageVO, page_widget: DashboardPageWidgetVO, reseter: () => Promise<void>) {
        if (!this.reseters[dashboard_page.dashboard_id]) {
            this.reseters[dashboard_page.dashboard_id] = {};
        }

        if (!this.reseters[dashboard_page.dashboard_id][dashboard_page.id]) {
            this.reseters[dashboard_page.dashboard_id][dashboard_page.id] = {};
        }

        this.reseters[dashboard_page.dashboard_id][dashboard_page.id][page_widget.id] = reseter;
    }
}
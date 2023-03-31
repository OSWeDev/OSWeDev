import DashboardPageWidgetVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardPageVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";

/**
 * ReloadFiltersWidgetController
 */
export default class ReloadFiltersWidgetController {

    public static getInstance(): ReloadFiltersWidgetController {
        if (!this.instance) {
            this.instance = new ReloadFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public reloaders: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: () => Promise<void> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    private constructor() { }

    public register_reloader(dashboard_page: DashboardPageVO, page_widget: DashboardPageWidgetVO, reloader: () => Promise<void>) {
        if (!this.reloaders[dashboard_page.dashboard_id]) {
            this.reloaders[dashboard_page.dashboard_id] = {};
        }

        if (!this.reloaders[dashboard_page.dashboard_id][dashboard_page.id]) {
            this.reloaders[dashboard_page.dashboard_id][dashboard_page.id] = {};
        }

        this.reloaders[dashboard_page.dashboard_id][dashboard_page.id][page_widget.id] = reloader;
    }
}
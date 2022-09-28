import DashboardPageVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";

export default class ValidationFiltersWidgetController {

    public static getInstance(): ValidationFiltersWidgetController {
        if (!this.instance) {
            this.instance = new ValidationFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public updaters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: () => Promise<void> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    private constructor() { }

    public register_updater(dashboard_page: DashboardPageVO, page_widget: DashboardPageWidgetVO, updater: () => Promise<void>) {
        if (!this.updaters[dashboard_page.dashboard_id]) {
            this.updaters[dashboard_page.dashboard_id] = {};
        }

        if (!this.updaters[dashboard_page.dashboard_id][dashboard_page.id]) {
            this.updaters[dashboard_page.dashboard_id][dashboard_page.id] = {};
        }

        this.updaters[dashboard_page.dashboard_id][dashboard_page.id][page_widget.id] = updater;
    }

    public set_is_init(dashboard_page: DashboardPageVO, page_widget: DashboardPageWidgetVO, is_init: boolean) {
        if (!this.is_init[dashboard_page.dashboard_id]) {
            this.is_init[dashboard_page.dashboard_id] = {};
        }

        if (!this.is_init[dashboard_page.dashboard_id][dashboard_page.id]) {
            this.is_init[dashboard_page.dashboard_id][dashboard_page.id] = {};
        }

        this.is_init[dashboard_page.dashboard_id][dashboard_page.id][page_widget.id] = is_init;
    }
}
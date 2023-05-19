import ThrottleHelper from "../../../../../../shared/tools/ThrottleHelper";

export default class ShowFavoritesFiltersWidgetController {

    public static getInstance(): ShowFavoritesFiltersWidgetController {
        if (!this.instance) {
            this.instance = new ShowFavoritesFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public updaters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: Array<() => Promise<void>> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    public throttle_call_updaters = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.throttled_call_updaters.bind(this), 50);

    private constructor() { }

    public async register_updater(dashboard_id: number, page_id: number, page_widget_id: number, updater: () => Promise<void>) {
        if (!this.updaters[dashboard_id]) {
            this.updaters[dashboard_id] = {};
        }

        if (!this.updaters[dashboard_id][page_id]) {
            this.updaters[dashboard_id][page_id] = {};
        }

        if (!this.updaters[dashboard_id][page_id][page_widget_id]) {
            this.updaters[dashboard_id][page_id][page_widget_id] = [];
        }
        this.updaters[dashboard_id][page_id][page_widget_id].push(updater);

        await updater();
    }

    private async throttled_call_updaters(params: any[]) {

    }
}
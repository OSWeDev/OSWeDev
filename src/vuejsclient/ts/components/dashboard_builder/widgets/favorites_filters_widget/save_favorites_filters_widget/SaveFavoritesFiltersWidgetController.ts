import { all_promises } from "../../../../../../../shared/tools/PromiseTools";
import ThrottleHelper from "../../../../../../../shared/tools/ThrottleHelper";
import SaveFavoritesFiltersCallUpdaters from "./SaveFavoritesFiltersCallUpdaters";

/**
 * SaveFavoritesFiltersWidgetController
 */
export default class SaveFavoritesFiltersWidgetController {

    // istanbul ignore next: nothing to test
    public static getInstance(): SaveFavoritesFiltersWidgetController {
        if (!this.instance) {
            this.instance = new SaveFavoritesFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public updaters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: Array<() => Promise<void>> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    public throttle_call_updaters = ThrottleHelper.declare_throttle_with_stackable_args(this.throttled_call_updaters.bind(this), 50);

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

    private async throttled_call_updaters(params: SaveFavoritesFiltersCallUpdaters[]) {

        for (const i in params) {

            const dashboard_id = params[i].dashboard_id;
            const page_id = params[i].page_id;

            let updaters_by_page_widget_id: { [page_widget_id: number]: Array<() => Promise<void>> } = {};

            if (
                SaveFavoritesFiltersWidgetController.getInstance().updaters &&
                SaveFavoritesFiltersWidgetController.getInstance().updaters[dashboard_id]
            ) {
                updaters_by_page_widget_id = SaveFavoritesFiltersWidgetController.getInstance().updaters[dashboard_id][page_id];
            }

            const promises = [];

            for (const page_widget_id in updaters_by_page_widget_id) {
                const updaters = updaters_by_page_widget_id[page_widget_id];

                for (const j in updaters) {
                    promises.push(updaters[j]());
                }
            }

            await all_promises(promises);
        }
    }
}
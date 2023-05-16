import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardFavoriteFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import { all_promises } from "../../../../../../shared/tools/PromiseTools";
import ThrottleHelper from "../../../../../../shared/tools/ThrottleHelper";
import SaveFavoritesFiltersCallUpdaters from "./SaveFavoritesFiltersCallUpdaters";

/**
 * SaveFavoritesFiltersWidgetController
 */
export default class SaveFavoritesFiltersWidgetController {

    public static getInstance(): SaveFavoritesFiltersWidgetController {
        if (!this.instance) {
            this.instance = new SaveFavoritesFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public updaters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: Array<() => Promise<void>> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    public throttle_save_favorites_filters = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.throttled_save_favorites_filters.bind(this), 50);
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

    private async throttled_call_updaters(params: SaveFavoritesFiltersCallUpdaters[]) {

        for (let i in params) {

            let dashboard_id = params[i].dashboard_id;
            let page_id = params[i].page_id;

            let updaters_by_page_widget_id: { [page_widget_id: number]: Array<() => Promise<void>> } = {};

            if (
                SaveFavoritesFiltersWidgetController.getInstance().updaters &&
                SaveFavoritesFiltersWidgetController.getInstance().updaters[dashboard_id]
            ) {
                updaters_by_page_widget_id = SaveFavoritesFiltersWidgetController.getInstance().updaters[dashboard_id][page_id];
            }

            let promises = [];

            for (let page_widget_id in updaters_by_page_widget_id) {
                let updaters = updaters_by_page_widget_id[page_widget_id];

                for (let j in updaters) {
                    promises.push(updaters[j]());
                }
            }

            await all_promises(promises);
        }
    }

    /**
     * throttled_save_favorites_filters
     *  - Do save or update the given favorites filters
     *
     * @param props { DashboardFavoriteFiltersVO[]}
     * @returns {boolean}
     */
    private async throttled_save_favorites_filters(props: DashboardFavoriteFiltersVO[]): Promise<boolean> {

        const favorites_filters_props = props.shift();

        const res = await ModuleDAO.getInstance().insertOrUpdateVO(favorites_filters_props);

        return res?.id != null;
    }
}
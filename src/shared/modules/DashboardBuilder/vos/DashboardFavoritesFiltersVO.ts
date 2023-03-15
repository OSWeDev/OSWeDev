
import IDashboardFavoritesFiltersProps from '../interfaces/IDashboardFavoritesFiltersProps';
import DashboardBuilderController from "../DashboardBuilderController";
import IDistantVOBase from "../../IDistantVOBase";

/**
 * DashboardFavoritesFiltersVO
 *  - One user may have many favorites active filters on one page
 */
export default class DashboardFavoritesFiltersVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorites_filters";

    public id: number;
    public _type: string = DashboardFavoritesFiltersVO.API_TYPE_ID;

    get translatable_name_code_text(): string {

        if (!this.dashboard_id) {
            return null;
        }

        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.dashboard_id;
    }

    // dashboard id of this favorite list
    public dashboard_id: number;

    // User id of saved active filters
    public owner_id: number;

    // Name which the owner gave to the current backup
    public name: string;

    // JSON array of page active filters
    public page_filters: string;

    /**
     * Hydrate from the given properties
     *
     * @param props {IDashboardFavoritesFiltersProps}
     * @returns {DashboardFavoritesFiltersVO}
     */
    public from(props: IDashboardFavoritesFiltersProps): DashboardFavoritesFiltersVO {

        this.dashboard_id = props.dashboard_id ?? this.dashboard_id;
        this.page_filters = props.page_filters ?? this.page_filters;
        this.owner_id = props.owner_id ?? this.owner_id;
        this.name = props.name ?? this.name;

        return this;
    }
}

import IDashboardFavoritesFiltersProps from '../interfaces/IDashboardFavoritesFiltersProps';
import DashboardBuilderController from "../DashboardBuilderController";
import IDistantVOBase from "../../IDistantVOBase";

/**
 * DashboardFavoritesFiltersVO
 *  - One user may have many favorites active filters on one page
 */
export default class DashboardFavoritesFiltersVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorites_filters";

    public _type: string = DashboardFavoritesFiltersVO.API_TYPE_ID;

    public id: number;

    // dashboard id of this favorite list
    public dashboard_id: number;

    // User id of saved active filters
    public owner_id: number;

    // Name which the owner gave to the current backup
    public name: string;

    // JSON object of page active field filters
    public page_filters: string;

    // JSON object of export configurations
    public export_params: string;

    /**
     * Hydrate from the given properties
     *
     * @param {IDashboardFavoritesFiltersProps} [props]
     * @returns {DashboardFavoritesFiltersVO}
     */
    public from(props: IDashboardFavoritesFiltersProps): DashboardFavoritesFiltersVO {

        this.dashboard_id = props.dashboard_id ?? this.dashboard_id;
        this.page_filters = props.page_filters ?? this.page_filters;
        this.owner_id = props.owner_id ?? this.owner_id;
        this.name = props.name ?? this.name;

        return this;
    }

    /**
     * Get translatable_name_code_text
     *
     * @returns {string}
     */
    get translatable_name_code_text(): string {

        if (!this.dashboard_id) {
            return null;
        }

        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.dashboard_id;
    }
}
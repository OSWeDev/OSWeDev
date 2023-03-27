
import { IDefaultFiltersParams } from '../interfaces/IDefaultFiltersParams';
import { IExportParamsProps } from '../interfaces/IExportParamsProps';
import DashboardBuilderController from "../DashboardBuilderController";
import ContextFilterVO from '../../ContextFilter/vos/ContextFilterVO';
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

    // JSON object of favorites_page active field filters
    public favorites_page_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    // JSON object of default_filters_params
    public default_filters_params: IDefaultFiltersParams;

    // JSON object of export configurations
    public export_params?: IExportParamsProps;

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<DashboardFavoritesFiltersVO>} [props]
     * @returns {DashboardFavoritesFiltersVO}
     */
    public from(props: Partial<DashboardFavoritesFiltersVO>): DashboardFavoritesFiltersVO {

        Object.assign(this, props);

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
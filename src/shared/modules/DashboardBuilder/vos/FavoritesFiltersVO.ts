

import IFavoritesFiltersOptions from '../interfaces/IFavoritesFiltersOptions';
import IExportParamsProps from '../interfaces/IExportParamsProps';
import DashboardBuilderController from "../DashboardBuilderController";
import IDistantVOBase from "../../IDistantVOBase";
import FieldFiltersVO from '../../ContextFilter/vos/FieldFiltersVO';

/**
 * FavoritesFiltersVO
 *  - One user may have many favorites active filters on one page
 */
export default class FavoritesFiltersVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorites_filters";

    public _type: string = FavoritesFiltersVO.API_TYPE_ID;

    public id: number;

    // page id of this favorite list (required for export params widget_options for calculations)
    public page_id: number;

    // User id of saved active filters
    public owner_id: number;

    // Name which the owner gave to the current favorites field_filters
    public name: string;

    // JSON object of favorites active field filters
    public field_filters: FieldFiltersVO;

    // JSON object of export configurations
    public export_params: IExportParamsProps;

    // JSON object of favorites filters behaviors options (ex: overwrite active_field_filters, etc...)
    public options: IFavoritesFiltersOptions;

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<FavoritesFiltersVO>} [props]
     * @returns {FavoritesFiltersVO}
     */
    public from(props: Partial<FavoritesFiltersVO>): FavoritesFiltersVO {

        Object.assign(this, props);

        return this;
    }

    /**
     * Get translatable_name_code_text
     *
     * @returns {string}
     */
    get translatable_name_code_text(): string {

        if (!this.page_id) {
            return null;
        }

        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.page_id;
    }
}
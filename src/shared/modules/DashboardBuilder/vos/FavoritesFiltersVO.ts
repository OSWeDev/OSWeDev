

import IDistantVOBase from "../../IDistantVOBase";
import AbstractVO from '../../VO/abstract/AbstractVO';
import DashboardBuilderController from "../DashboardBuilderController";
import IFavoritesFiltersOptions from '../interfaces/IFavoritesFiltersOptions';
import FavoritesFiltersExportParamsVO from './FavoritesFiltersExportParamsVO';
import FieldFiltersVO from './FieldFiltersVO';

/**
 * FavoritesFiltersVO
 *  - One user may have many favorites active filters on one page
 */
export default class FavoritesFiltersVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorites_filters";

    public _type: string = FavoritesFiltersVO.API_TYPE_ID;

    public id: number;

    /**
     * page id of this favorite list (required for export params widget_options for calculations)
     * @deprecated use dashboard_id instead
     */
    public page_id: number;

    /**
     * Dashboard in which this favorite filter has been created
     */
    public dashboard_id: number;

    // User id of saved active filters
    public owner_id: number;

    // Name which the owner gave to the current favorites field_filters
    public name: string;

    // JSON object of favorites active field filters
    public field_filters: FieldFiltersVO;

    // JSON object of export configurations
    public export_params: FavoritesFiltersExportParamsVO;

    // JSON object of favorites filters behaviors options (ex: overwrite active_field_filters, etc...)
    public options: IFavoritesFiltersOptions;

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
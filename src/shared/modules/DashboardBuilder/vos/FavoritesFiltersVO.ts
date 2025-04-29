

import IDistantVOBase from "../../IDistantVOBase";
import AbstractVO from '../../VO/abstract/AbstractVO';
import IFavoritesFiltersOptions from '../interfaces/IFavoritesFiltersOptions';
import FavoritesFiltersExportParamsVO from './FavoritesFiltersExportParamsVO';
import FieldFiltersVO from './FieldFiltersVO';

export default class FavoritesFiltersVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorites_filters";

    public _type: string = FavoritesFiltersVO.API_TYPE_ID;

    public id: number;

    public page_id: number;
    public owner_id: number;
    public name: string;
    public field_filters: FieldFiltersVO;
    public export_params: FavoritesFiltersExportParamsVO;
    public options: IFavoritesFiltersOptions;
}


import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from "../../IDistantVOBase";
import AbstractVO from '../../VO/abstract/AbstractVO';
import FavoritesFiltersExportFrequencyVO from './FavoritesFiltersExportFrequencyVO';

export default class FavoritesFiltersExportParamsVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "favorites_filters_export_params";

    public _type: string = FavoritesFiltersExportParamsVO.API_TYPE_ID;
    public id: number;

    public is_export_planned: boolean;         // Can the Cron worker export ?
    public begin_export_after_ts: number;         // Start exports after/on this date
    public last_export_at_ts: number;         // Last export timestamp
    public export_frequency: FavoritesFiltersExportFrequencyVO; // Export frequency (ex: daily, weekly, monthly)
    public exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO };
    public export_to_user_id_ranges: NumRange[]; // Users to export to
}
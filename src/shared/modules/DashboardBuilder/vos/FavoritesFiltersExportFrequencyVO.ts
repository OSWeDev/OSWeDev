

import IDistantVOBase from "../../IDistantVOBase";

export default class FavoritesFiltersExportFrequencyVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "favorites_filters_export_frequency";

    public static GRANULARITY_LABELS: string[] = [
        'favorites_filters_export_frequency.GRANULARITY_DAY',
        'favorites_filters_export_frequency.GRANULARITY_MONTH',
        'favorites_filters_export_frequency.GRANULARITY_YEAR',
        'favorites_filters_export_frequency.GRANULARITY_WEEK',
    ];
    public static GRANULARITY_DAY: number = 0;
    public static GRANULARITY_MONTH: number = 1;
    public static GRANULARITY_YEAR: number = 2;
    public static GRANULARITY_WEEK: number = 3;

    public _type: string = FavoritesFiltersExportFrequencyVO.API_TYPE_ID;
    public id: number;

    public every: number;  // 1; 3; e.g. every 1 day; every 3 months
    public granularity: number;
    public day_in_month: number;  // day in the month e.g. every 3 months at day 15
    public day_in_week: number;  // day in the week pour les exports hebos, 1= lundi, 2 = mardi, 3 = mercredi, 4 = jeudi, 5 = vendredi, 6 = samedi, 7 = dimanche

    public prefered_time: number; // prefered time of the day to export (ex: 08:00, 12:00, 18:00) / FIELD_TYPE_hours_and_minutes_sans_limite
}
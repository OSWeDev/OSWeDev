
import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';

/**
 * IExportParamsProps
 *  - Props for Cron worker to execute export
 */
export interface IExportParamsProps {
    is_export_planned: boolean;         // Can the Cron worker export ?
    last_export_at_ts?: number;
    export_frequency: Partial<IExportFrequency>;
    exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO };
}

/**
 * IExportFrequency
 *  - Definition of export frequency
 */
export interface IExportFrequency {
    every: number;  // 1; 3; e.g. every 1 day; every 3 months
    granularity: 'day' | 'month' | 'year';
    day_in_month: number;  // day in the month e.g. every 3 months at day 15
}
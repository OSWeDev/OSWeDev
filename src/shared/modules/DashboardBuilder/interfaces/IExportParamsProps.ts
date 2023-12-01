
import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import IExportFrequency from './IExportFrequency';

/**
 * IExportParamsProps
 *  - Props for Cron worker to execute export
 */
export default interface IExportParamsProps {
    is_export_planned: boolean;         // Can the Cron worker export ?
    last_export_at_ts?: number;         // Last export timestamp
    export_frequency: IExportFrequency; // Export frequency (ex: daily, weekly, monthly)
    exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO };
}

import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import { IExportFrequency } from './IExportFrequency';

/**
 * IExportParamsProps
 *  - Props for Cron worker to execute export
 */
export interface IExportParamsProps {
    is_export_planned: boolean;         // Can the Cron worker export ?
    last_export_at_ts?: number;
    export_frequency: IExportFrequency;
    exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO };
}
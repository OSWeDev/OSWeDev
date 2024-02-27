import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ExportContextQueryToXLSXQueryVO from '../../../../shared/modules/DataExport/vos/ExportContextQueryToXLSXQueryVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleDataExportServer from '../ModuleDataExportServer';

export default class ExportContextQueryToXLSXBGThread implements IBGThread {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ExportContextQueryToXLSXBGThread.instance) {
            ExportContextQueryToXLSXBGThread.instance = new ExportContextQueryToXLSXBGThread();
        }
        return ExportContextQueryToXLSXBGThread.instance;
    }

    private static instance: ExportContextQueryToXLSXBGThread = null;

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    public semaphore: boolean = false;
    public run_asap: boolean = false;
    public last_run_unix: number = null;

    public exec_in_dedicated_thread: boolean = true;

    get name(): string {
        return "ExportContextQueryToXLSXBGThread";
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('ExportContextQueryToXLSXBGThread', 'work', 'IN');

            /**
             * On dépile une demande d'export
             */
            const next_export: ExportContextQueryToXLSXQueryVO = await query(ExportContextQueryToXLSXQueryVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<ExportContextQueryToXLSXQueryVO>().state, ExportContextQueryToXLSXQueryVO.STATE_TODO)
                .set_sort(new SortByVO(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().id, true))
                .set_limit(1)
                .select_vo<ExportContextQueryToXLSXQueryVO>();

            if (!next_export) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            next_export.state = ExportContextQueryToXLSXQueryVO.STATE_EXPORTING;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(next_export);

            try {
                await ModuleDataExportServer.getInstance().do_exportContextQueryToXLSX(
                    next_export.filename,
                    next_export.context_query,
                    next_export.ordered_column_list,
                    next_export.column_labels,
                    next_export.exportable_datatable_custom_field_columns,
                    next_export.columns,
                    next_export.fields,
                    next_export.varcolumn_conf,
                    next_export.active_field_filters,
                    next_export.custom_filters,
                    next_export.active_api_type_ids,
                    next_export.discarded_field_paths,
                    next_export.is_secured,
                    next_export.file_access_policy_name,
                    next_export.target_user_id,
                    next_export.do_not_use_filter_by_datatable_field_uid,
                    next_export.export_active_field_filters,
                    next_export.export_vars_indicator,
                    next_export.send_email_with_export_notification,
                    next_export.vars_indicator,
                );
                this.stats_out('ok', time_in);
                next_export.state = ExportContextQueryToXLSXQueryVO.STATE_DONE;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(next_export);

            } catch (error) {
                ConsoleHandler.error(error);
                this.stats_out('ko', time_in);
                next_export.state = ExportContextQueryToXLSXQueryVO.STATE_ERROR;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(next_export);

            }
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ExportContextQueryToXLSXBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('ExportContextQueryToXLSXBGThread', 'work', activity + '_OUT', time_out - time_in);
    }
}
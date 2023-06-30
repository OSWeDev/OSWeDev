import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import ModuleDataExportServer from '../ModuleDataExportServer';
import ExportContextQueryToXLSXQueryVO from './vos/ExportContextQueryToXLSXQueryVO';

export default class ExportContextQueryToXLSXBGThread implements IBGThread {

    public static TASK_NAME_push_export_query = 'ExportContextQueryToXLSXBGThread.push_export_query';

    public static getInstance() {
        if (!ExportContextQueryToXLSXBGThread.instance) {
            ExportContextQueryToXLSXBGThread.instance = new ExportContextQueryToXLSXBGThread();
        }
        return ExportContextQueryToXLSXBGThread.instance;
    }

    private static instance: ExportContextQueryToXLSXBGThread = null;

    public waiting_export_queries: ExportContextQueryToXLSXQueryVO[] = [];

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    public exec_in_dedicated_thread: boolean = true;

    private constructor() {
        ForkedTasksController.getInstance().register_task(ExportContextQueryToXLSXBGThread.TASK_NAME_push_export_query, this.push_export_query.bind(this));
    }

    get name(): string {
        return "ExportContextQueryToXLSXBGThread";
    }

    public async push_export_query(export_query: ExportContextQueryToXLSXQueryVO) {
        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(ExportContextQueryToXLSXBGThread.getInstance().name, ExportContextQueryToXLSXBGThread.TASK_NAME_push_export_query, export_query)) {
            return;
        }

        this.waiting_export_queries.push(export_query);
    }

    public async work(): Promise<number> {

        let time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('ExportContextQueryToXLSXBGThread', 'work', 'IN');

            /**
             * On dépile une demande d'export
             */
            if ((!this.waiting_export_queries) || (!this.waiting_export_queries.length)) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            let export_query = this.waiting_export_queries.shift();

            await ModuleDataExportServer.getInstance().do_exportContextQueryToXLSX(
                export_query.filename,
                export_query.context_query,
                export_query.ordered_column_list,
                export_query.column_labels,
                export_query.exportable_datatable_custom_field_columns,
                export_query.columns,
                export_query.fields,
                export_query.varcolumn_conf,
                export_query.active_field_filters,
                export_query.custom_filters,
                export_query.active_api_type_ids,
                export_query.discarded_field_paths,
                export_query.is_secured,
                export_query.file_access_policy_name,
                export_query.target_user_id,
                export_query.do_not_user_filter_by_datatable_field_uid,
                export_query.export_options,
                export_query.vars_indicator,
            );
            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ExportContextQueryToXLSXBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('ExportContextQueryToXLSXBGThread', 'work', activity + '_OUT', time_out - time_in);
    }
}
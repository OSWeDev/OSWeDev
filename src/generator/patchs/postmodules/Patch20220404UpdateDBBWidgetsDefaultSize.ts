/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class Patch20220404UpdateDBBWidgetsDefaultSize implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20220404UpdateDBBWidgetsDefaultSize {
        if (!Patch20220404UpdateDBBWidgetsDefaultSize.instance) {
            Patch20220404UpdateDBBWidgetsDefaultSize.instance = new Patch20220404UpdateDBBWidgetsDefaultSize();
        }
        return Patch20220404UpdateDBBWidgetsDefaultSize.instance;
    }

    private static instance: Patch20220404UpdateDBBWidgetsDefaultSize = null;

    get uid(): string {
        return 'Patch20220404UpdateDBBWidgetsDefaultSize';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        const BulkOps = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'bulkops').select_vo<DashboardWidgetVO>();
        if (BulkOps) {
            BulkOps.default_height = 35;
            BulkOps.default_width = 12;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(BulkOps);
        }

        const Checklist = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'checklist').select_vo<DashboardWidgetVO>();
        if (Checklist) {
            Checklist.default_height = 35;
            Checklist.default_width = 12;
            Checklist.name = 'checklist';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(Checklist);
        }

        const DataTable = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'datatable').select_vo<DashboardWidgetVO>();
        if (DataTable) {
            DataTable.default_height = 35;
            DataTable.default_width = 12;
            DataTable.name = 'datatable';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(DataTable);
        }

        const ValueTable = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'valuetable').select_vo<DashboardWidgetVO>();
        if (ValueTable) {
            ValueTable.default_height = 35;
            ValueTable.default_width = 12;
            ValueTable.name = 'valuetable';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(ValueTable);
        }

        const fieldValueFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'fieldvaluefilter').select_vo<DashboardWidgetVO>();
        if (fieldValueFilter) {
            fieldValueFilter.default_height = 5;
            fieldValueFilter.default_width = 3;
            fieldValueFilter.name = 'fieldvaluefilter';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(fieldValueFilter);
        }

        const DOWFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'dowfilter').select_vo<DashboardWidgetVO>();
        if (DOWFilter) {
            DOWFilter.default_height = 5;
            DOWFilter.default_width = 3;
            DOWFilter.name = 'dowfilter';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(DOWFilter);
        }

        const MonthFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'monthfilter').select_vo<DashboardWidgetVO>();
        if (MonthFilter) {
            MonthFilter.default_height = 5;
            MonthFilter.default_width = 4;
            MonthFilter.name = 'monthfilter';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(MonthFilter);
        }

        const YearFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'yearfilter').select_vo<DashboardWidgetVO>();
        if (YearFilter) {
            YearFilter.default_height = 5;
            YearFilter.default_width = 2;
            YearFilter.name = 'yearfilter';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(YearFilter);
        }

        const var_widget = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'var').select_vo<DashboardWidgetVO>();
        if (var_widget) {
            var_widget.default_height = 10;
            var_widget.default_width = 1;
            var_widget.name = 'var';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(var_widget);
        }

        const pageswitch_widget = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, 'pageswitch').select_vo<DashboardWidgetVO>();
        if (pageswitch_widget) {
            pageswitch_widget.default_height = 5;
            pageswitch_widget.default_width = 2;
            pageswitch_widget.name = 'pageswitch';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(pageswitch_widget);
        }
    }
}
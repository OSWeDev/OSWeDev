/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220404UpdateDBBWidgetsDefaultSize implements IGeneratorWorker {

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
        let BulkOps = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'bulkops').select_vo<DashboardWidgetVO>();
        BulkOps.default_height = 35;
        BulkOps.default_width = 12;
        await ModuleDAO.getInstance().insertOrUpdateVO(BulkOps);

        let Checklist = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'checklist').select_vo<DashboardWidgetVO>();
        Checklist.default_height = 35;
        Checklist.default_width = 12;
        Checklist.name = 'checklist';
        await ModuleDAO.getInstance().insertOrUpdateVO(Checklist);

        let DataTable = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'datatable').select_vo<DashboardWidgetVO>();
        DataTable.default_height = 35;
        DataTable.default_width = 12;
        DataTable.name = 'datatable';
        await ModuleDAO.getInstance().insertOrUpdateVO(DataTable);

        let ValueTable = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'valuetable').select_vo<DashboardWidgetVO>();
        ValueTable.default_height = 35;
        ValueTable.default_width = 12;
        ValueTable.name = 'valuetable';
        await ModuleDAO.getInstance().insertOrUpdateVO(ValueTable);

        let fieldValueFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'fieldvaluefilter').select_vo<DashboardWidgetVO>();
        fieldValueFilter.default_height = 5;
        fieldValueFilter.default_width = 3;
        fieldValueFilter.name = 'fieldvaluefilter';
        await ModuleDAO.getInstance().insertOrUpdateVO(fieldValueFilter);

        let DOWFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'dowfilter').select_vo<DashboardWidgetVO>();
        DOWFilter.default_height = 5;
        DOWFilter.default_width = 3;
        DOWFilter.name = 'dowfilter';
        await ModuleDAO.getInstance().insertOrUpdateVO(DOWFilter);

        let MonthFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'monthfilter').select_vo<DashboardWidgetVO>();
        MonthFilter.default_height = 5;
        MonthFilter.default_width = 4;
        MonthFilter.name = 'monthfilter';
        await ModuleDAO.getInstance().insertOrUpdateVO(MonthFilter);

        let YearFilter = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'yearfilter').select_vo<DashboardWidgetVO>();
        YearFilter.default_height = 5;
        YearFilter.default_width = 2;
        YearFilter.name = 'yearfilter';
        await ModuleDAO.getInstance().insertOrUpdateVO(YearFilter);

        let var_widget = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'var').select_vo<DashboardWidgetVO>();
        var_widget.default_height = 10;
        var_widget.default_width = 1;
        var_widget.name = 'var';
        await ModuleDAO.getInstance().insertOrUpdateVO(var_widget);

        let pageswitch_widget = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', 'pageswitch').select_vo<DashboardWidgetVO>();
        pageswitch_widget.default_height = 5;
        pageswitch_widget.default_width = 2;
        pageswitch_widget.name = 'pageswitch';
        await ModuleDAO.getInstance().insertOrUpdateVO(pageswitch_widget);
    }
}
import TableWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';

/**
 * @deprecated use TableWidgetManager instead
 */
export default class TableWidgetController extends TableWidgetManager {

    // istanbul ignore next: nothing to test
    public static getInstance(): TableWidgetManager {
        return TableWidgetManager.getInstance();
    }

    protected static instance: TableWidgetManager;
}
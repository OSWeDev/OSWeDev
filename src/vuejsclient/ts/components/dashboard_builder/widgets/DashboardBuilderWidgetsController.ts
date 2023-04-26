import DashboardWidgetVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardWidgetVOManager';

/**
 * @class DashboardBuilderWidgetsController
 * @deprecated use DashboardWidgetVOManager
 */
export default class DashboardBuilderWidgetsController extends DashboardWidgetVOManager {

    public static getInstance(): DashboardWidgetVOManager {
        return DashboardWidgetVOManager.getInstance();
    }

    protected static instance: DashboardWidgetVOManager;
}
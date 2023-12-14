import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';

/**
 * @class DashboardBuilderWidgetsController
 * @deprecated use WidgetOptionsVOManager
 */
export default class DashboardBuilderWidgetsController extends WidgetOptionsVOManager {

    public static getInstance(): WidgetOptionsVOManager {
        return WidgetOptionsVOManager.getInstance();
    }

    protected static instance: WidgetOptionsVOManager;
}
import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';

/**
 * @class DashboardBuilderWidgetsController
 * @deprecated use WidgetOptionsVOManager
 */
export default class DashboardBuilderWidgetsController extends WidgetOptionsVOManager {

    // istanbul ignore next: nothing to test
    public static getInstance(): WidgetOptionsVOManager {
        return WidgetOptionsVOManager.getInstance();
    }

    protected static instance: WidgetOptionsVOManager;
}
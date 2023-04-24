import WidgetsManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetsManager';

/**
 * @class DashboardBuilderWidgetsController
 * @deprecated use WidgetsManager
 */
export default class DashboardBuilderWidgetsController extends WidgetsManager {

    public static getInstance(): DashboardBuilderWidgetsController {
        if (!DashboardBuilderWidgetsController.instance) {
            DashboardBuilderWidgetsController.instance = new DashboardBuilderWidgetsController();
        }

        return DashboardBuilderWidgetsController.instance;
    }

    protected static instance: DashboardBuilderWidgetsController;
}
/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250425AddDefaultViewportToWidgets implements IGeneratorWorker {

    private static instance: Patch20250425AddDefaultViewportToWidgets = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250425AddDefaultViewportToWidgets';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250425AddDefaultViewportToWidgets {
        if (!Patch20250425AddDefaultViewportToWidgets.instance) {
            Patch20250425AddDefaultViewportToWidgets.instance = new Patch20250425AddDefaultViewportToWidgets();
        }
        return Patch20250425AddDefaultViewportToWidgets.instance;
    }

    public async work(db: IDatabase<any>) {

        const default_vp = await query(DashboardViewportVO.API_TYPE_ID)
            .filter_is_true(field_names<DashboardViewportVO>().is_default)
            .exec_as_server()
            .select_vo<DashboardViewportVO>();

        if (!default_vp) {
            throw new Error('Patch20250425AddDefaultViewportToWidgets: No default viewport found');
        }

        const vos = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_is_null_or_empty(field_names<DashboardPageWidgetVO>().dashboard_viewport_id)
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();

        for (const vo of vos) {
            vo.dashboard_viewport_id = default_vp.id;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}
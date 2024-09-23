/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardActiveonViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardActiveonViewportVO';
import DashboardPageVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardWidgetPositionVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetPositionVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240923AddViewportDatas implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240923AddViewportDatas {
        if (!Patch20240923AddViewportDatas.instance) {
            Patch20240923AddViewportDatas.instance = new Patch20240923AddViewportDatas();
        }
        return Patch20240923AddViewportDatas.instance;
    }

    private static instance: Patch20240923AddViewportDatas = null;

    get uid(): string {
        return 'Patch20240923AddViewportDatas';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        // Création des viewports par défaut
        const desktop_viewport: DashboardViewportVO = new DashboardViewportVO();
        desktop_viewport.name = 'PC';
        desktop_viewport.screen_min_width = 992;
        desktop_viewport.is_default = true;

        const tablet_viewport: DashboardViewportVO = new DashboardViewportVO();
        tablet_viewport.name = 'Tablette';
        tablet_viewport.screen_min_width = 768;
        tablet_viewport.is_default = false;

        const mobile_viewport: DashboardViewportVO = new DashboardViewportVO();
        mobile_viewport.name = 'Mobile';
        mobile_viewport.screen_min_width = 0;
        tablet_viewport.is_default = false;

        const viewports: DashboardViewportVO[] = [desktop_viewport, tablet_viewport, mobile_viewport];

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(viewports);

    }
}
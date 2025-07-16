/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import DashboardViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240923AddViewportDatas implements IGeneratorWorker {

    private static instance: Patch20240923AddViewportDatas = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240923AddViewportDatas';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240923AddViewportDatas {
        if (!Patch20240923AddViewportDatas.instance) {
            Patch20240923AddViewportDatas.instance = new Patch20240923AddViewportDatas();
        }
        return Patch20240923AddViewportDatas.instance;
    }

    public async work(db: IDatabase<any>) {

        // Création des viewports par défaut
        const desktop_viewport: DashboardViewportVO = new DashboardViewportVO();
        desktop_viewport.name = 'PC';
        desktop_viewport.screen_min_width = 992;
        desktop_viewport.is_default = true;
        desktop_viewport.nb_columns = 12;

        const tablet_viewport: DashboardViewportVO = new DashboardViewportVO();
        tablet_viewport.name = 'Tablette';
        tablet_viewport.screen_min_width = 768;
        tablet_viewport.is_default = false;
        tablet_viewport.nb_columns = 8;

        const mobile_viewport: DashboardViewportVO = new DashboardViewportVO();
        mobile_viewport.name = 'Mobile';
        mobile_viewport.screen_min_width = 320;
        mobile_viewport.is_default = false;
        mobile_viewport.nb_columns = 2;

        const viewports: DashboardViewportVO[] = [desktop_viewport, tablet_viewport, mobile_viewport];

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(viewports);
    }
}
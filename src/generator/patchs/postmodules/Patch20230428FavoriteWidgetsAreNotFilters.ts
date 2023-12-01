/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';

export default class Patch20230428FavoriteWidgetsAreNotFilters implements IGeneratorWorker {

    public static getInstance(): Patch20230428FavoriteWidgetsAreNotFilters {
        if (!Patch20230428FavoriteWidgetsAreNotFilters.instance) {
            Patch20230428FavoriteWidgetsAreNotFilters.instance = new Patch20230428FavoriteWidgetsAreNotFilters();
        }
        return Patch20230428FavoriteWidgetsAreNotFilters.instance;
    }

    private static instance: Patch20230428FavoriteWidgetsAreNotFilters = null;

    get uid(): string {
        return 'Patch20230428FavoriteWidgetsAreNotFilters';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let WIDGET_NAME_showfavoritesfilters = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters).select_vo<DashboardWidgetVO>();
        if (!!WIDGET_NAME_showfavoritesfilters) {
            WIDGET_NAME_showfavoritesfilters.is_filter = false;
            WIDGET_NAME_showfavoritesfilters.is_validation_filters = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(WIDGET_NAME_showfavoritesfilters);
        }

        let WIDGET_NAME_savefavoritesfilters = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq('name', DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters).select_vo<DashboardWidgetVO>();
        if (!!WIDGET_NAME_savefavoritesfilters) {
            WIDGET_NAME_savefavoritesfilters.is_filter = false;
            WIDGET_NAME_savefavoritesfilters.is_validation_filters = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(WIDGET_NAME_savefavoritesfilters);
        }
    }
}
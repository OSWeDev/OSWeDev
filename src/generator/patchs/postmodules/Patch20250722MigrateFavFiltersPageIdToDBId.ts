/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FavoritesFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250722MigrateFavFiltersPageIdToDBId implements IGeneratorWorker {


    private static instance: Patch20250722MigrateFavFiltersPageIdToDBId = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250722MigrateFavFiltersPageIdToDBId';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250722MigrateFavFiltersPageIdToDBId {
        if (!Patch20250722MigrateFavFiltersPageIdToDBId.instance) {
            Patch20250722MigrateFavFiltersPageIdToDBId.instance = new Patch20250722MigrateFavFiltersPageIdToDBId();
        }
        return Patch20250722MigrateFavFiltersPageIdToDBId.instance;
    }

    public async work(db: IDatabase<any>) {
        const all_fav_filters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<FavoritesFiltersVO>();

        const all_pages: DashboardPageVO[] = await query(DashboardPageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageVO>();

        const all_pages_by_id: { [id: number]: DashboardPageVO } = VOsTypesManager.vosArray_to_vosByIds(all_pages);


        for (const fav_filter of all_fav_filters) {
            const page = all_pages_by_id[fav_filter.page_id];

            if (!page) {
                ConsoleHandler.error(`Patch20250722MigrateFavFiltersPageIdToDBId: No page found for id ${fav_filter.page_id} in favorites filters ${fav_filter.id}`);
                continue;
            }

            // Update the dashboard_id with the page's dashboard_id
            fav_filter.dashboard_id = page.dashboard_id;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(all_fav_filters);
    }
}

/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FavoritesFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250507DebugFavoritFiltersLimits implements IGeneratorWorker {

    private static instance: Patch20250507DebugFavoritFiltersLimits = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250507DebugFavoritFiltersLimits';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250507DebugFavoritFiltersLimits {
        if (!Patch20250507DebugFavoritFiltersLimits.instance) {
            Patch20250507DebugFavoritFiltersLimits.instance = new Patch20250507DebugFavoritFiltersLimits();
        }
        return Patch20250507DebugFavoritFiltersLimits.instance;
    }


    public async work(db: IDatabase<any>) {

        const favoritefilters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<FavoritesFiltersVO>();

        for (const i in favoritefilters) {
            const favoritefilter = favoritefilters[i];

            if (!favoritefilter.export_params) {
                continue;
            }

            if (!favoritefilter.export_params.exportable_data) {
                continue;
            }

            for (const title_name_code in favoritefilter.export_params.exportable_data) {
                const exportable_data = favoritefilter.export_params.exportable_data[title_name_code];
                if (!exportable_data.context_query) {
                    continue;
                }

                exportable_data.context_query.set_limit(0, 0);
            }
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(favoritefilters);
    }
}
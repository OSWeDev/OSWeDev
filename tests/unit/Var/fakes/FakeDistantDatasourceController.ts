import DataSourceControllerTSRangeIndexedBase from '../../../../src/server/modules/Var/datasource/DataSourceControllerTSRangeIndexedBase';
import TSRange from '../../../../src/shared/modules/DataRender/vos/TSRange';
import VarDataBaseVO from '../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';
import FakeDistantVO from './vos/FakeDistantVO';

export default class FakeDistantDatasourceController extends DataSourceControllerTSRangeIndexedBase {

    public static fake_distant_datas: FakeDistantVO[] = [];

    protected static instance: FakeDistantDatasourceController = null;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeDistantDatasourceController {
        if (!FakeDistantDatasourceController.instance) {
            FakeDistantDatasourceController.instance = new FakeDistantDatasourceController(
                'FakeDistantDatasourceController',
                [FakeDistantVO.API_TYPE_ID],
                {});
        }
        return FakeDistantDatasourceController.instance;
    }

    public get_data_index(var_data: FakeDataVO): TSRange[] {
        return var_data.ts_ranges;
    }

    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any, index_value: number): any {
        return ds_res;
    }

    public async get_data(param: FakeDataVO): Promise<{ [date_value: number]: FakeDistantVO }> {
        const res: { [date_value: number]: FakeDistantVO } = {};

        for (const i in FakeDistantDatasourceController.fake_distant_datas) {
            const fake_distant_data = FakeDistantDatasourceController.fake_distant_datas[i];

            if (RangeHandler.elt_intersects_any_range(fake_distant_data.date, param.ts_ranges)) {
                res[fake_distant_data.date] = fake_distant_data;
            }
        }
        return res;
    }
}
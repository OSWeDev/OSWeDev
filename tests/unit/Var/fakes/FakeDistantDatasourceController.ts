import DataSourceControllerTSRangeIndexedBase from '../../../../src/server/modules/Var/datasource/DataSourceControllerTSRangeIndexedBase';
import TSRange from '../../../../src/shared/modules/DataRender/vos/TSRange';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';
import FakeDistantVO from './vos/FakeDistantVO';

export default class FakeDistantDatasourceController extends DataSourceControllerTSRangeIndexedBase {

    public static fake_distant_datas: FakeDistantVO[] = [];

    public static getInstance(): FakeDistantDatasourceController {
        if (!FakeDistantDatasourceController.instance) {
            FakeDistantDatasourceController.instance = new FakeDistantDatasourceController(
                'FakeDistantDatasourceController',
                [FakeDistantVO.API_TYPE_ID],
                {});
        }
        return FakeDistantDatasourceController.instance;
    }

    protected static instance: FakeDistantDatasourceController = null;

    public get_data_index(var_data: FakeDataVO): TSRange[] {
        return var_data.ts_ranges;
    }

    public async get_data(param: FakeDataVO): Promise<{ [date_value: number]: FakeDistantVO }> {
        let res: { [date_value: number]: FakeDistantVO } = {};

        for (let i in FakeDistantDatasourceController.fake_distant_datas) {
            let fake_distant_data = FakeDistantDatasourceController.fake_distant_datas[i];

            if (RangeHandler.elt_intersects_any_range(fake_distant_data.date, param.ts_ranges)) {
                res[fake_distant_data.date] = fake_distant_data;
            }
        }
        return res;
    }
}
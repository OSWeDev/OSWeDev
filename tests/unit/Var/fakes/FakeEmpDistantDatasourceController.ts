import DataSourceControllerMatroidIndexedBase from '../../../../src/server/modules/Var/datasource/DataSourceControllerMatroidIndexedBase';
import TSRange from '../../../../src/shared/modules/DataRender/vos/TSRange';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeEmpDistantDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static fake_distant_datas: FakeEmpDistantVO[] = [];

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeEmpDistantDatasourceController {
        if (!FakeEmpDistantDatasourceController.instance) {
            FakeEmpDistantDatasourceController.instance = new FakeEmpDistantDatasourceController(
                'FakeEmpDistantDatasourceController',
                [FakeEmpDistantVO.API_TYPE_ID],
                {});
        }
        return FakeEmpDistantDatasourceController.instance;
    }

    protected static instance: FakeEmpDistantDatasourceController = null;

    public get_data_index(var_data: FakeEmpDayDataVO): TSRange[] {
        return var_data.ts_ranges;
    }

    public async get_data(param: FakeEmpDayDataVO): Promise<FakeEmpDistantVO[]> {
        let res: FakeEmpDistantVO[] = [];

        for (let i in FakeEmpDistantDatasourceController.fake_distant_datas) {
            let fake_distant_data = FakeEmpDistantDatasourceController.fake_distant_datas[i];

            if (RangeHandler.elt_intersects_any_range(fake_distant_data.date, param.ts_ranges) &&
                RangeHandler.elt_intersects_any_range(fake_distant_data.employee_id, param.employee_id_ranges)) {
                res.push(fake_distant_data);
            }
        }
        return res;
    }
}
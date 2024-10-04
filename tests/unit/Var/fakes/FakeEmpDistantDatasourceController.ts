import DataSourceControllerMatroidIndexedBase from '../../../../src/server/modules/Var/datasource/DataSourceControllerMatroidIndexedBase';
import TSRange from '../../../../src/shared/modules/DataRender/vos/TSRange';
import VarDataBaseVO from '../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeEmpDistantDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static fake_distant_datas: FakeEmpDistantVO[] = [];

    protected static instance: FakeEmpDistantDatasourceController = null;

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

    public get_data_index(var_data: FakeEmpDayDataVO): TSRange[] {
        return var_data.ts_ranges;
    }

    public get_data_from_cache(var_data: VarDataBaseVO, ds_res: any): any {
        return ds_res;
    }

    public async get_data(param: FakeEmpDayDataVO): Promise<FakeEmpDistantVO[]> {
        const res: FakeEmpDistantVO[] = [];

        for (const i in FakeEmpDistantDatasourceController.fake_distant_datas) {
            const fake_distant_data = FakeEmpDistantDatasourceController.fake_distant_datas[i];

            if (RangeHandler.elt_intersects_any_range(fake_distant_data.date, param.ts_ranges) &&
                RangeHandler.elt_intersects_any_range(fake_distant_data.employee_id, param.employee_id_ranges)) {
                res.push(fake_distant_data);
            }
        }
        return res;
    }
}
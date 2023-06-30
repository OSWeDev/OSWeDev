
import moment from 'moment';
import NumRange from '../../../../src/shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../src/shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';

export default class FakeDepsDataHandler {

    public static get_ds_var_data_A(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_data_A_month(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_data_A2(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_data_A2_month(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_data_A2_Update(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY),
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_data_A2_Update_month(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [RangeHandler.getMaxNumRange()];
        let a = var_data.index;
        return var_data;
    }

    public static get_ds_var_empday_data_A(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }
}
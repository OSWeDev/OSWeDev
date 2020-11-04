import * as moment from 'moment';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';

export default class FakeDepsDataHandler {

    public static get_ds_var_data_A(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getInstance().getMaxNumRange()];
        return var_data;
    }

    public static get_ds_var_data_A2(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getInstance().getMaxNumRange()];
        return var_data;
    }

    public static get_ds_var_data_A2_Update(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY),
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [RangeHandler.getInstance().getMaxNumRange()];
        return var_data;
    }

    public static get_ds_var_empday_data_A(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        return var_data;
    }
}

import * as  moment from 'moment';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidCutResult from '../../../../shared/modules/Matroid/vos/MatroidCutResult';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VarsInitController from '../../../../shared/modules/Var/VarsInitController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';

export default class FakeEmpDayDataHandler {

    public static zero: number = Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY);
    public static zero_cinq: number = FakeEmpDayDataHandler.zero + 12 * 60 * 60;
    public static moins_zero_cinq: number = FakeEmpDayDataHandler.zero - 12 * 60 * 60;
    public static un: number = FakeEmpDayDataHandler.zero + 24 * 60 * 60;
    public static deux: number = FakeEmpDayDataHandler.zero + 48 * 60 * 60;
    public static moins_un: number = FakeEmpDayDataHandler.zero - 24 * 60 * 60;
    public static moins_deux: number = FakeEmpDayDataHandler.zero - 48 * 60 * 60;

    public static initializeFakeEmpDayDataVO() {

        let datatable_fields = [
            new ModuleTableField('employee_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Employes').set_segmentation_type(NumSegment.TYPE_INT),
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        VarsInitController.getInstance().register_var_data(FakeEmpDayDataVO.API_TYPE_ID, () => new FakeEmpDayDataVO(), datatable_fields, null, true);
    }

    public static matroid_1_2_moins1_zero(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_zero(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_zero_cinq,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static get_data_A_day(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }


    public static get_data_A(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static get_data_A_Var3(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_moins1(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_moins2excl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_moins1excl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_un,
                FakeEmpDayDataHandler.zero,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_zeroexcl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.zero,
                FakeEmpDayDataHandler.un,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }


    public static matroid_2_zero(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_zero_cinq,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_moins1(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_zeroexcl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.zero,
                FakeEmpDayDataHandler.un,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_unexcl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.un,
                FakeEmpDayDataHandler.deux,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_moins2excl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_moins1excl(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_un,
                FakeEmpDayDataHandler.zero,
                true, false, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }


    public static real_1_cutter(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                1527804, 1559253,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static real_2_to_cut(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                1527804,
                1559253,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static real_1_cutter_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                1527804,
                1559253,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_2_moins1_zero_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_zero_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_zero_cinq,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_moins1_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_zero_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_zero_cinq,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_2_moins1_(): FakeEmpDayDataVO {
        let var_data: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_un,
                true, true, TimeSegment.TYPE_DAY)
        ];
        var_data.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];
        let a = var_data.index;
        return var_data;
    }

    public static matroid_1_2_moins1_zero__moins__matroid_1_zero(): MatroidCutResult<FakeEmpDayDataVO> {

        let a: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        a.var_id = 1;
        a.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        a.employee_id_ranges = [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)];

        let b: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        b.var_id = 1;
        b.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_zero_cinq,
                true, false, TimeSegment.TYPE_DAY)
        ];
        b.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];

        let f = new MatroidCutResult<FakeEmpDayDataVO>(
            [FakeEmpDayDataHandler.matroid_1_zero_()],
            [a, b]);
        f.chopped_items.forEach((e) => ConsoleHandler.log(e.index));
        f.remaining_items.forEach((e) => ConsoleHandler.log(e.index));
        return f;
    }

    public static matroid_1_2_moins1_zero__moins__matroid_1_moins1(): MatroidCutResult<FakeEmpDayDataVO> {

        let a: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        a.var_id = 1;
        a.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        a.employee_id_ranges = [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)];

        let b: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        b.var_id = 1;
        b.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_un,
                FakeEmpDayDataHandler.zero_cinq,
                false, true, TimeSegment.TYPE_DAY)
        ];
        b.employee_id_ranges = [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)];

        let f = new MatroidCutResult<FakeEmpDayDataVO>(
            [FakeEmpDayDataHandler.matroid_1_moins1_()],
            [a, b]);
        f.chopped_items.forEach((e) => ConsoleHandler.log(e.index));
        f.remaining_items.forEach((e) => ConsoleHandler.log(e.index));
        return f;
    }

    public static matroid_1_2_moins1_zero__moins__matroid_2_moins1(): MatroidCutResult<FakeEmpDayDataVO> {

        let a: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        a.var_id = 1;
        a.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        a.employee_id_ranges = [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)];

        let b: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        b.var_id = 1;
        b.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_un,
                FakeEmpDayDataHandler.zero_cinq,
                false, true, TimeSegment.TYPE_DAY)
        ];
        b.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];

        let f = new MatroidCutResult<FakeEmpDayDataVO>(
            [FakeEmpDayDataHandler.matroid_2_moins1_()],
            [a, b]);
        f.chopped_items.forEach((e) => ConsoleHandler.log(e.index));
        f.remaining_items.forEach((e) => ConsoleHandler.log(e.index));
        return f;
    }

    public static matroid_1_2_moins1_zero__moins__matroid_2_zero(): MatroidCutResult<FakeEmpDayDataVO> {

        let a: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        a.var_id = 1;
        a.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.zero_cinq,
                true, true, TimeSegment.TYPE_DAY)
        ];
        a.employee_id_ranges = [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)];

        let b: FakeEmpDayDataVO = new FakeEmpDayDataVO();
        b.var_id = 1;
        b.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                FakeEmpDayDataHandler.moins_deux,
                FakeEmpDayDataHandler.moins_zero_cinq,
                true, false, TimeSegment.TYPE_DAY)
        ];
        b.employee_id_ranges = [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)];

        let f = new MatroidCutResult<FakeEmpDayDataVO>(
            [FakeEmpDayDataHandler.matroid_2_zero_()],
            [a, b]);
        f.chopped_items.forEach((e) => ConsoleHandler.log(e.index));
        f.remaining_items.forEach((e) => ConsoleHandler.log(e.index));
        return f;
    }
}
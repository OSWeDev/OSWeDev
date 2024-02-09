import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
import MatroidController from '../../../src/shared/modules/Matroid/MatroidController';
import MatroidBase from '../../../src/shared/modules/Matroid/vos/MatroidBase';
import MatroidCutResult from '../../../src/shared/modules/Matroid/vos/MatroidCutResult';
import FakeDataHandler from '../Var/fakes/FakeDataHandler';
import FakeEmpDayDataHandler from '../Var/fakes/FakeEmpDayDataHandler';
import FakeDataVO from '../Var/fakes/vos/FakeDataVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';

ConsoleHandler.init();

FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

test('MatroidController: test cloneFrom', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

    expect(MatroidController.cloneFrom(null)).toStrictEqual(null);

    expect(MatroidController.cloneFrom(FakeEmpDayDataHandler.matroid_1_zero())['index']).toStrictEqual(FakeEmpDayDataHandler.matroid_1_zero_().index);
    expect(MatroidController.cloneFrom(FakeEmpDayDataHandler.matroid_2_moins1())['index']).toStrictEqual(FakeEmpDayDataHandler.matroid_2_moins1_().index);
    expect(MatroidController.cloneFrom(FakeEmpDayDataHandler.matroid_2_zero())['index']).toStrictEqual(FakeEmpDayDataHandler.matroid_2_zero_().index);
    expect(MatroidController.cloneFrom(FakeEmpDayDataHandler.matroid_1_2_moins1_zero())['index']).toStrictEqual(FakeEmpDayDataHandler.matroid_1_2_moins1_zero_().index);
    expect(MatroidController.cloneFrom(FakeEmpDayDataHandler.matroid_1_moins1())['index']).toStrictEqual(FakeEmpDayDataHandler.matroid_1_moins1_().index);
});

test('MatroidController: test matroid_intersects_matroid', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

    expect(MatroidController.matroid_intersects_matroid(null, null)).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(null, FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).toStrictEqual(false);

    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).toStrictEqual(false);


    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).toStrictEqual(true);
});

test('MatroidController: test matroid_intersects_any_matroid', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

    expect(MatroidController.matroid_intersects_any_matroid(null, null)).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(null, [FakeEmpDayDataHandler.matroid_1_zero()])).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero()])).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_2_moins1()])).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_moins1()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(false);

    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_moins1()])).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_zero()])).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_2_moins1()])).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(false);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_moins1()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_2_moins1()])).toStrictEqual(false);


    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_2_moins1()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_moins1()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);

    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_zero(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).toStrictEqual(true);


    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
    expect(MatroidController.matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).toStrictEqual(true);
});

test('MatroidController: test cut_matroids', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();


    let a = MatroidController.cut_matroids(FakeEmpDayDataHandler.real_1_cutter(), [FakeEmpDayDataHandler.real_2_to_cut()]);
    a.forEach((e: MatroidCutResult<any>) => e.chopped_items.forEach((f) => ConsoleHandler.log(f['index'])));
    expect(a).toStrictEqual([new MatroidCutResult(
        [FakeEmpDayDataHandler.real_1_cutter_()],
        [])]);

    FakeDataHandler.initializeFakeDataVO();

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
    let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
    let remaning_calcs: Array<MatroidCutResult<FakeDataVO>> = MatroidController.cut_matroids(
        var_data_C,
        [var_data_F]);

    expect(remaning_calcs.length).toStrictEqual(1);
    remaning_calcs.forEach((e: MatroidCutResult<any>) => e.chopped_items.forEach((f) => ConsoleHandler.log(f['index'])));
    expect(remaning_calcs[0].chopped_items).toStrictEqual([]);


    var_data_F.var_id = 2;
    remaning_calcs = MatroidController.cut_matroids(
        var_data_C,
        [var_data_F]);

    expect(remaning_calcs.length).toStrictEqual(1);
    remaning_calcs.forEach((e: MatroidCutResult<any>) => e.chopped_items.forEach((f) => ConsoleHandler.log(f['index'])));
    let res = FakeDataHandler.get_var_data_C();
    res['rebuild_index']();
    ConsoleHandler.log(res["index"]);
    expect(remaning_calcs[0].chopped_items).toStrictEqual([res]);
    // Le assign est juste à cause d'un pb de momentjs....
    // remaning_calcs[0].remaining_items[0].ts_ranges[1].max['_i'] = "2021-02-01";
    // remaning_calcs[0].remaining_items[0].ts_ranges[1].max['_pf'].parsedDateParts = [2021, 1, 1];
    // remaning_calcs[0].remaining_items[0].ts_ranges[1].min['_i'] = "2020-04-01";
    // remaning_calcs[0].remaining_items[0].ts_ranges[1].min['_pf'].parsedDateParts = [2020, 3, 1];
    remaning_calcs.forEach((e: MatroidCutResult<any>) => e.remaining_items.forEach((f) => ConsoleHandler.log(f['index'])));
    expect(remaning_calcs[0].remaining_items).toStrictEqual([FakeDataHandler.get_var_data_F_moins_C()]);

    remaning_calcs = MatroidController.cut_matroids(
        var_data_B,
        [var_data_F]);

    expect(remaning_calcs.length).toStrictEqual(1);
    remaning_calcs.forEach((e: MatroidCutResult<any>) => e.chopped_items.forEach((f) => ConsoleHandler.log(f['index'])));
    res = FakeDataHandler.get_var_data_B();
    res['rebuild_index']();
    ConsoleHandler.log(res["index"]);
    expect(remaning_calcs[0].chopped_items).toStrictEqual([res]);
    // remaning_calcs[0].remaining_items[0].ts_ranges[0].max['_i'] = "2021-02-01";
    // remaning_calcs[0].remaining_items[0].ts_ranges[0].max['_pf'].parsedDateParts = [2021, 1, 1];
    // remaning_calcs[0].remaining_items[0].ts_ranges[0].min['_i'] = "2020-03-01";
    // remaning_calcs[0].remaining_items[0].ts_ranges[0].min['_pf'].parsedDateParts = [2020, 2, 1];
    remaning_calcs.forEach((e: MatroidCutResult<any>) => e.remaining_items.forEach((f) => ConsoleHandler.log(f['index'])));
    expect(remaning_calcs[0].remaining_items).toStrictEqual([FakeDataHandler.get_var_data_F_moins_B()]);
});

test('MatroidController: test cut_matroid', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

    expect(MatroidController.cut_matroid(null, null)).toStrictEqual(null);
    expect(MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).toStrictEqual(null);
    expect(MatroidController.cut_matroid(null, FakeEmpDayDataHandler.matroid_1_zero())).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_1_zero()]
    ));

    let a = MatroidController.cut_matroid(FakeEmpDayDataHandler.real_1_cutter(), FakeEmpDayDataHandler.real_2_to_cut());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.real_1_cutter_()],
        []));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_1_zero_()],
        []));
    // '{"chopped_items":[{"_type":"matroid_type","var_id":1,"employee_id_ranges":[{"max":1,"max_inclusiv":true,"min":1,' +
    // '"min_inclusiv":true,"api_type_id":"matroid_type","field_id":"employee_id_ranges"}],"ts_ranges":[{"max":"2019-07-12T11:00:00.000Z",' +
    // '"max_inclusiv":true,"min":"2019-07-11T11:00:00.000Z","min_inclusiv":true,"api_type_id":"matroid_type","field_id":"ts_ranges"}]}],"remaining_items":[]}');

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_1_moins1excl()],
        [FakeEmpDayDataHandler.matroid_1_moins2excl()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_2_moins1()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index'])); expect(MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_2_zero()]
    ));
    expect(a).toStrictEqual(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_1_zero());


    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_1_moins1excl()],
        [FakeEmpDayDataHandler.matroid_1_zeroexcl()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_1_moins1_()],
        []
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_2_moins1()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_2_zero()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_1_moins1());


    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_1_zero()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_1_moins1()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_2_moins1_()],
        []
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_2_moins1excl()],
        [FakeEmpDayDataHandler.matroid_2_zeroexcl()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_2_moins1());


    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_1_zero()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [],
        [FakeEmpDayDataHandler.matroid_1_moins1()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_2_moins1());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_2_moins1excl()],
        [FakeEmpDayDataHandler.matroid_2_moins2excl()]
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_2_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(new MatroidCutResult(
        [FakeEmpDayDataHandler.matroid_2_zero_()],
        []
    ));

    a = MatroidController.cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero());
    a.chopped_items.forEach((f) => ConsoleHandler.log(f['index']));
    a.remaining_items.forEach((f) => ConsoleHandler.log(f['index']));
    expect(a).toStrictEqual(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_2_zero());
});

test('MatroidController: test getMatroidBases', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

    expect(MatroidController.getMatroidBases(null, true, true)).toStrictEqual(null);
    expect(MatroidController.getMatroidBases(FakeEmpDayDataHandler.matroid_1_zero(), true, true)).toStrictEqual([
        MatroidBase.createNew(FakeEmpDayDataHandler.matroid_1_zero()._type, "employee_id_ranges", [
            NumRange.createNew(
                1, 1, true, true, NumSegment.TYPE_INT)
        ]),
        MatroidBase.createNew(FakeEmpDayDataHandler.matroid_1_zero()._type, "ts_ranges", [
            TSRange.createNew(
                FakeEmpDayDataHandler.moins_zero_cinq, FakeEmpDayDataHandler.zero_cinq, true, true, TimeSegment.TYPE_DAY),
        ])
    ]);
});

test('MatroidController: test getMatroidFields', () => {
    FakeDataHandler.initializeFakeDataVO();

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
    let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
    let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
    let selected_imports: FakeDataVO[] = [var_data_C, var_data_B];
    var_data_F.var_id = 2;
    let remaning_calcs: FakeDataVO[] = MatroidController.matroids_cut_matroids_get_remainings(
        [var_data_C, var_data_B],
        [var_data_F]);

    // remaning_calcs[0].ts_ranges[0].max['_i'] = "2021-02-01";
    // remaning_calcs[0].ts_ranges[0].max['_pf'].parsedDateParts = [2021, 1, 1];
    // remaning_calcs[0].ts_ranges[0].min['_i'] = "2020-04-01";
    // remaning_calcs[0].ts_ranges[0].min['_pf'].parsedDateParts = [2020, 3, 1];

    remaning_calcs.forEach((e) => ConsoleHandler.log(e.index));

    expect(remaning_calcs).toStrictEqual([FakeDataHandler.get_var_data_F_moins_BC()]);
});
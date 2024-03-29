import { test, expect } from "playwright-test-coverage";

import MatroidBase from '../../../src/shared/modules/Matroid/vos/MatroidBase';
import ModuleTable from '../../../src/shared/modules/ModuleTable';
import ModuleTableField from '../../../src/shared/modules/ModuleTableField';
import VOsTypesManager from '../../../src/shared/modules/VOsTypesManager';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import MatroidBaseController from '../../../src/shared/modules/Matroid/MatroidBaseController';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import MatroidBaseCutResult from '../../../src/shared/modules/Matroid/vos/MatroidBaseCutResult';
import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';

let zero = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 1, TimeSegment.TYPE_HOUR);
let zero_cinq = Dates.add(zero, 12, TimeSegment.TYPE_HOUR);
let moins_zero_cinq = Dates.add(zero, -12, TimeSegment.TYPE_HOUR);
let un = Dates.add(zero, 1, TimeSegment.TYPE_DAY);
let deux = Dates.add(zero, 2, TimeSegment.TYPE_DAY);
let moins_un = Dates.add(zero, -1, TimeSegment.TYPE_DAY);
let moins_deux = Dates.add(zero, -2, TimeSegment.TYPE_DAY);

let matroid_type = 'matroid_type';

let employee_id_ranges = new ModuleTableField('employee_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Employees').set_segmentation_type(NumSegment.TYPE_INT);
let ts_ranges = new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY);

VOsTypesManager.registerModuleTable(new ModuleTable(
    null,
    matroid_type,
    () => ({} as any),
    [
        employee_id_ranges,
        ts_ranges
    ],
    null));

test('MatroidBaseController: test matroidbase_intersects_matroidbase', () => {

    let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)
    ]);

    let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY)
    ]);


    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(null, null)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(null, matroid_base_1)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, null)).toStrictEqual(false);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_1)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_1_2)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_2)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_moins1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_moins1_zero as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_zero as any)).toStrictEqual(false);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_1)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_1_2)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_2)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_moins1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_moins1_zero as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_zero as any)).toStrictEqual(false);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_1)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_1_2)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_2)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_moins1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_moins1_zero as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_zero as any)).toStrictEqual(false);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_1_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_moins1 as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_moins1_zero as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_zero as any)).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_1_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_moins1 as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_moins1_zero as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_zero as any)).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_1 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_1_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_2 as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_moins1 as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_moins1_zero as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_zero as any)).toStrictEqual(true);
});

test('MatroidBaseController: test matroidbase_intersects_any_matroidbase', () => {

    let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)
    ]);

    let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_zero_cinq, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_un, moins_un, true, true, TimeSegment.TYPE_DAY)
    ]);


    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(null, null)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(null, [matroid_base_1])).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, null)).toStrictEqual(false);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_1])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_1_2])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_2])).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_moins1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_moins1_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_1])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_1_2])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_2])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_moins1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_moins1_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_1])).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_1_2])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_2])).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_moins1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_moins1_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_1_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_moins1] as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_moins1_zero] as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_1_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_moins1] as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_moins1_zero] as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_1_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_2] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_moins1] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_moins1_zero] as any)).toStrictEqual(false);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_zero] as any)).toStrictEqual(true);
    expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [
        matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).toStrictEqual(true);

});

test('MatroidBaseController: test cut_matroid_base', () => {
    expect(MatroidBaseController.getInstance().cut_matroid_base(null, null)).toStrictEqual(null);

    let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)
    ]);

    let matroid_base_1_2_moins_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)
    ]);
    let matroid_base_1_2_moins_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
        NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)
    ]);

    let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_un, moins_un, true, true, TimeSegment.TYPE_DAY)
    ]);

    let matroid_base_moins1_zero_moins_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
    ]);
    let matroid_base_moins1_zero_moins_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
        TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
    ]);

    expect(MatroidBaseController.getInstance().cut_matroid_base(null, matroid_base_1)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, null)).toStrictEqual(null);

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_1)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_1,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_1_2)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_1,
        matroid_base_1_2_moins_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_2)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1_zero
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_zero
    ));

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_1)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_1,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_1_2)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_1_2,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_2)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_2,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1_zero
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_zero
    ));

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_1)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_1_2)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_2,
        matroid_base_1_2_moins_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_2)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_2,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1_zero
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_zero
    ));

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_1_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_moins1,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_moins1,
        matroid_base_moins1_zero_moins_moins1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_zero
    ));

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_1_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_moins1,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_moins1_zero,
        null
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_zero,
        null
    ));

    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_1_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_1_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_2 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_2
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_moins1 as any)).toStrictEqual(new MatroidBaseCutResult(
        null,
        matroid_base_moins1
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_moins1_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_zero,
        matroid_base_moins1_zero_moins_zero
    ));
    expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_zero as any)).toStrictEqual(new MatroidBaseCutResult(
        matroid_base_zero,
        null
    ));
});
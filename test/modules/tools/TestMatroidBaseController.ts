import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import MatroidController from '../../../src/shared/modules/Matroid/MatroidController';
import IVarMatroidDataVO from '../../../src/shared/modules/Var/interfaces/IVarMatroidDataVO';
import VarsController from '../../../src/shared/modules/Var/VarsController';
import VOsTypesManager from '../../../src/shared/modules/VOsTypesManager';
import ModuleTable from '../../../src/shared/modules/ModuleTable';
import ModuleTableField from '../../../src/shared/modules/ModuleTableField';
import MatroidBase from '../../../src/shared/modules/Matroid/vos/MatroidBase';
import FieldRange from '../../../src/shared/modules/DataRender/vos/FieldRange';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
import MatroidCutResult from '../../../src/shared/modules/Matroid/vos/MatroidCutResult';
import MatroidBaseController from '../../../src/shared/modules/Matroid/MatroidBaseController';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import MatroidBaseCutResult from '../../../src/shared/modules/Matroid/vos/MatroidBaseCutResult';

describe('MatroidBaseController', () => {

    let zero = moment().startOf('day').add(1, 'hour');
    let zero_cinq = moment(zero).add(12, 'hour');
    let moins_zero_cinq = moment(zero).add(-12, 'hour');
    let un = moment(zero).add(1, 'day');
    let deux = moment(zero).add(2, 'day');
    let moins_un = moment(zero).add(-1, 'day');
    let moins_deux = moment(zero).add(-2, 'day');

    let matroid_type = 'matroid_type';

    let employee_id_ranges = new ModuleTableField('employee_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Employees').set_segmentation_type(NumSegment.TYPE_INT);
    let ts_ranges = new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY);

    VOsTypesManager.getInstance().registerModuleTable(new ModuleTable(
        null,
        matroid_type,
        () => ({} as any),
        [
            employee_id_ranges,
            ts_ranges
        ],
        null));

    it('test matroidbase_intersects_matroidbase', () => {

        let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 1, true, true)
        ]);
        let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 2, 2, true, true)
        ]);
        let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 2, true, true)
        ]);

        let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, zero_cinq, true, true)
        ]);
        let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_zero_cinq, zero_cinq, true, true)
        ]);
        let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, moins_un, true, true)
        ]);


        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(null, null)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(null, matroid_base_1)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, null)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_1)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_1_2)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_2)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_moins1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_moins1_zero as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1, matroid_base_zero as any)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_1)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_1_2)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_2)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_moins1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_moins1_zero as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_1_2, matroid_base_zero as any)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_1)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_1_2)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_2)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_moins1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_moins1_zero as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_2, matroid_base_zero as any)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_1_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_moins1 as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_moins1_zero as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1, matroid_base_zero as any)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_1_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_moins1 as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_moins1_zero as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_moins1_zero, matroid_base_zero as any)).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_1_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_2 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_moins1 as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_moins1_zero as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_matroidbase(matroid_base_zero, matroid_base_zero as any)).to.equal(true);
    });

    it('test matroidbase_intersects_any_matroidbase', () => {

        let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 1, true, true)
        ]);
        let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 2, 2, true, true)
        ]);
        let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 2, true, true)
        ]);

        let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, zero_cinq, true, true)
        ]);
        let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_zero_cinq, zero_cinq, true, true)
        ]);
        let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, moins_un, true, true)
        ]);


        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(null, null)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(null, [matroid_base_1])).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, null)).to.equal(false);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_1])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_1_2])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_2])).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_moins1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_moins1_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [matroid_base_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_1])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_1_2])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_2])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_moins1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_moins1_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [matroid_base_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_1_2, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_1])).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_1_2])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_2])).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_moins1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_moins1_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [matroid_base_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_2, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_1_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_moins1] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_moins1_zero] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [matroid_base_zero] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_1_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_moins1] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_moins1_zero] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [matroid_base_zero] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_moins1_zero, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_1_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_2] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_moins1] as any)).to.equal(false);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_moins1_zero] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [matroid_base_zero] as any)).to.equal(true);
        expect(MatroidBaseController.getInstance().matroidbase_intersects_any_matroidbase(matroid_base_zero, [
            matroid_base_1, matroid_base_1_2, matroid_base_2, matroid_base_moins1 as any, matroid_base_moins1_zero as any, matroid_base_zero as any])).to.equal(true);

    });

    it('test cut_matroid_base', () => {
        expect(MatroidBaseController.getInstance().cut_matroid_base(null, null)).to.equal(null);

        let matroid_base_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 1, true, true)
        ]);
        let matroid_base_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 2, 2, true, true)
        ]);
        let matroid_base_1_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 2, true, true)
        ]);

        let matroid_base_1_2_moins_1 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 2, false, true)
        ]);
        let matroid_base_1_2_moins_2 = MatroidBase.createNew(matroid_type, 'employee_id_ranges', [
            FieldRange.createNew(matroid_type, 'employee_id_ranges', 1, 2, true, false)
        ]);

        let matroid_base_moins1_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, zero_cinq, true, true)
        ]);
        let matroid_base_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_zero_cinq, zero_cinq, true, true)
        ]);
        let matroid_base_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, moins_un, true, true)
        ]);

        let matroid_base_moins1_zero_moins_moins1 = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_un, zero_cinq, false, true)
        ]);
        let matroid_base_moins1_zero_moins_zero = MatroidBase.createNew(matroid_type, 'ts_ranges', [
            FieldRange.createNew(matroid_type, 'ts_ranges', moins_deux, moins_zero_cinq, true, false)
        ]);

        expect(MatroidBaseController.getInstance().cut_matroid_base(null, matroid_base_1)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, null)).to.deep.equal(null);

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_1)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_1,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_1_2)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_1,
            matroid_base_1_2_moins_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_2)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1_zero
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_zero
        ));

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_1)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_1,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_1_2)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_1_2,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_2)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_2,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1_zero
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_1_2, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_zero
        ));

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_1)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_1_2)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_2,
            matroid_base_1_2_moins_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_2)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_2,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1_zero
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_2, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_zero
        ));

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_1_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_moins1,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_moins1,
            matroid_base_moins1_zero_moins_moins1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_zero
        ));

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_1_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_moins1,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_moins1_zero,
            null
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_moins1_zero, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_zero,
            null
        ));

        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_1_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_1_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_2 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_2
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_moins1 as any)).to.deep.equal(new MatroidBaseCutResult(
            null,
            matroid_base_moins1
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_moins1_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_zero,
            matroid_base_moins1_zero_moins_zero
        ));
        expect(MatroidBaseController.getInstance().cut_matroid_base(matroid_base_zero, matroid_base_zero as any)).to.deep.equal(new MatroidBaseCutResult(
            matroid_base_zero,
            null
        ));
    });
});
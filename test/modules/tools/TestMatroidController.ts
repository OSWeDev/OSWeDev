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
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';

describe('MatroidController', () => {

    let zero = moment().startOf('day').add(1, 'hour');
    let zero_cinq = moment(zero).add(12, 'hour');
    let moins_zero_cinq = moment(zero).add(-12, 'hour');
    let un = moment(zero).add(1, 'day');
    let deux = moment(zero).add(2, 'day');
    let moins_un = moment(zero).add(-1, 'day');
    let moins_deux = moment(zero).add(-2, 'day');

    let matroid_1_2_moins1_zero: IVarMatroidDataVO = {
        _type: 'matroid_type',
        id: 1,
        cardinal: 4,
        segment_type: NumSegment.TYPE_INT,
        value_ts: moment().format('YYYY-MM-DD'),
        json_params: null,
        value_type: VarsController.VALUE_TYPE_COMPUTED,
        var_id: 1,

        employee_id_ranges: [NumRange.createNew(1, 2, true, true)],
        ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true)]
    } as IVarMatroidDataVO;

    let matroid_1_zero: IVarMatroidDataVO = {
        _type: 'matroid_type',
        id: 1,
        cardinal: 1,
        segment_type: NumSegment.TYPE_INT,
        value_ts: moment().format('YYYY-MM-DD'),
        json_params: null,
        value_type: VarsController.VALUE_TYPE_COMPUTED,
        var_id: 1,

        employee_id_ranges: [NumRange.createNew(1, 1, true, true)],
        ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)]
    } as IVarMatroidDataVO;

    let matroid_1_moins1: IVarMatroidDataVO = {
        _type: 'matroid_type',
        id: 1,
        cardinal: 1,
        segment_type: NumSegment.TYPE_INT,
        value_ts: moment().format('YYYY-MM-DD'),
        json_params: null,
        value_type: VarsController.VALUE_TYPE_COMPUTED,
        var_id: 1,

        employee_id_ranges: [NumRange.createNew(1, 1, true, true)],
        ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true)]
    } as IVarMatroidDataVO;

    let matroid_2_zero: IVarMatroidDataVO = {
        _type: 'matroid_type',
        id: 1,
        cardinal: 1,
        segment_type: NumSegment.TYPE_INT,
        value_ts: moment().format('YYYY-MM-DD'),
        json_params: null,
        value_type: VarsController.VALUE_TYPE_COMPUTED,
        var_id: 1,

        employee_id_ranges: [NumRange.createNew(2, 2, true, true)],
        ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)]
    } as IVarMatroidDataVO;

    let matroid_2_moins1: IVarMatroidDataVO = {
        _type: 'matroid_type',
        id: 1,
        cardinal: 1,
        segment_type: NumSegment.TYPE_INT,
        value_ts: moment().format('YYYY-MM-DD'),
        json_params: null,
        value_type: VarsController.VALUE_TYPE_COMPUTED,
        var_id: 1,

        employee_id_ranges: [NumRange.createNew(2, 2, true, true)],
        ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true)]
    } as IVarMatroidDataVO;


    let matroid_1_2_moins1_zero__moins__matroid_1_zero: MatroidCutResult<any> = new MatroidCutResult(
        [matroid_1_zero],
        []);
    let matroid_1_2_moins1_zero__moins__matroid_1_moins1: MatroidCutResult<any> = new MatroidCutResult(
        [matroid_1_moins1],
        []);
    let matroid_1_2_moins1_zero__moins__matroid_2_moins1: MatroidCutResult<any> = new MatroidCutResult(
        [matroid_2_moins1],
        []);
    let matroid_1_2_moins1_zero__moins__matroid_2_zero: MatroidCutResult<any> = new MatroidCutResult(
        [matroid_2_zero],
        []);

    let employee_id_ranges = new ModuleTableField('employee_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Employees').set_segmentation_type(NumSegment.TYPE_INT);
    let ts_ranges = new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY);

    VOsTypesManager.getInstance().registerModuleTable(new ModuleTable(
        null,
        'matroid_type',
        [
            new ModuleTableField('json_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres'),
            new ModuleTableField('cardinal', ModuleTableField.FIELD_TYPE_int, 'Cardinal'),
            employee_id_ranges,
            ts_ranges
        ],
        null));

    it('test matroid_intersects_matroid', () => {
        expect(MatroidController.getInstance().matroid_intersects_matroid(null, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(null, matroid_1_zero)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_zero)).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_2_moins1)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_moins1)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_2_zero)).to.equal(false);

        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_moins1)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_2_zero)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_zero)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_2_moins1)).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_2_zero)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_moins1)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_zero)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_2_moins1)).to.equal(false);


        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_1_zero)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_2_moins1)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_1_moins1)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_2_zero)).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_2_moins1_zero)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_2_moins1_zero)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_2_moins1_zero)).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_zero, matroid_1_2_moins1_zero)).to.equal(true);
    });

    it('test matroid_intersects_any_matroid', () => {
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, [matroid_1_zero])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_2_moins1])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_moins1])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_2_zero])).to.equal(false);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_moins1])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_2_zero])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_zero])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_2_moins1])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_2_zero])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_moins1])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_zero])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_2_moins1])).to.equal(false);


        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_2_moins1])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_moins1])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_2_zero])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_2_moins1_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_2_moins1_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_2_moins1_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_zero, [matroid_1_2_moins1_zero])).to.equal(true);


        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
    });

    // it('test cut_matroids', () => {
    //     expect(MatroidController.getInstance().cut_matroids(
    //         null,
    //         NumSegment.TYPE_INT)).to.deep.equal(null);
    // });

    it('test cut_matroid', () => {
        expect(MatroidController.getInstance().cut_matroid(null, null)).to.deep.equal(null);
        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, null)).to.deep.equal(null);
        expect(MatroidController.getInstance().cut_matroid(null, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_zero]
        ));

        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
            [matroid_1_zero],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_2_moins1_zero)).to.deep.equal(matroid_1_2_moins1_zero__moins__matroid_1_zero);


        expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
            [matroid_1_moins1],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_2_moins1_zero)).to.deep.equal(matroid_1_2_moins1_zero__moins__matroid_1_moins1);



        expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
            [matroid_2_moins1],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_2_moins1_zero)).to.deep.equal(matroid_1_2_moins1_zero__moins__matroid_2_moins1);



        expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_zero]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_1_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
            [],
            [matroid_2_moins1]
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
            [matroid_2_zero],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_2_moins1_zero)).to.deep.equal(matroid_1_2_moins1_zero__moins__matroid_2_zero);
    });

    it('test getMatroidBases', () => {
        expect(MatroidController.getInstance().getMatroidBases(null, true, true)).to.deep.equal(null);
        expect(MatroidController.getInstance().getMatroidBases(matroid_1_zero, true, true)).to.deep.equal([
            MatroidBase.createNew(matroid_1_zero._type, "employee_id_ranges", [
                FieldRange.createNew(
                    matroid_1_zero._type,
                    "employee_id_ranges",
                    1, 1, true, true)
            ]),
            MatroidBase.createNew(matroid_1_zero._type, "ts_ranges", [
                FieldRange.createNew(
                    matroid_1_zero._type,
                    "ts_ranges",
                    moins_zero_cinq, zero_cinq, true, true),
            ])
        ]);
    });


    it('test getMatroidFields', () => {
        expect(MatroidController.getInstance().getMatroidFields(null)).to.deep.equal(null);
        expect(MatroidController.getInstance().getMatroidFields(matroid_1_zero._type)).to.deep.equal([
            employee_id_ranges,
            ts_ranges
        ]);
    });
});
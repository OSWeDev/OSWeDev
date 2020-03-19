// import { expect } from 'chai';
// import 'mocha';
// import * as moment from 'moment';
// import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
// import MatroidController from '../../../src/shared/modules/Matroid/MatroidController';
// import IVarMatroidDataVO from '../../../src/shared/modules/Var/interfaces/IVarMatroidDataVO';
// import VarsController from '../../../src/shared/modules/Var/VarsController';
// import VOsTypesManager from '../../../src/shared/modules/VOsTypesManager';
// import ModuleTable from '../../../src/shared/modules/ModuleTable';
// import ModuleTableField from '../../../src/shared/modules/ModuleTableField';
// import MatroidBase from '../../../src/shared/modules/Matroid/vos/MatroidBase';
// import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
// import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
// import MatroidCutResult from '../../../src/shared/modules/Matroid/vos/MatroidCutResult';
// import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
// import IMatroid from '../../../src/shared/modules/Matroid/interfaces/IMatroid';

// describe('MatroidController', () => {

//     let zero = moment().startOf('day').add(1, 'hour');
//     let zero_cinq = moment(zero).add(12, 'hour');
//     let moins_zero_cinq = moment(zero).add(-12, 'hour');
//     let un = moment(zero).add(1, 'day');
//     let deux = moment(zero).add(2, 'day');
//     let moins_un = moment(zero).add(-1, 'day');
//     let moins_deux = moment(zero).add(-2, 'day');

//     let matroid_1_2_moins1_zero: IVarMatroidDataVO = {
//         _type: 'matroid_type',
//         id: 1,
//         value_ts: moment(),
//         value_type: VarsController.VALUE_TYPE_COMPUTED,
//         var_id: 1,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     } as IVarMatroidDataVO;

//     let matroid_1_zero: IVarMatroidDataVO = {
//         _type: 'matroid_type',
//         id: 1,
//         value_ts: moment(),
//         value_type: VarsController.VALUE_TYPE_COMPUTED,
//         var_id: 1,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     } as IVarMatroidDataVO;

//     let matroid_1_moins1: IVarMatroidDataVO = {
//         _type: 'matroid_type',
//         id: 1,
//         value_ts: moment(),
//         value_type: VarsController.VALUE_TYPE_COMPUTED,
//         var_id: 1,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY)]
//     } as IVarMatroidDataVO;

//     let matroid_2_zero: IVarMatroidDataVO = {
//         _type: 'matroid_type',
//         id: 1,
//         value_ts: moment(),
//         value_type: VarsController.VALUE_TYPE_COMPUTED,
//         var_id: 1,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     } as IVarMatroidDataVO;

//     let matroid_2_moins1: IVarMatroidDataVO = {
//         _type: 'matroid_type',
//         id: 1,
//         value_ts: moment(),
//         value_type: VarsController.VALUE_TYPE_COMPUTED,
//         var_id: 1,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY)]
//     } as IVarMatroidDataVO;



//     let real_1_cutter = {
//         _type: 'matroid_type',
//         var_id: 1,
//         id: 1,
//         value_ts: moment(),
//         value_type: 0,
//         value: 0,
//         missing_datas_infos: null,
//         employee_id_ranges: [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moment(1527804000), moment(1559253600), true, true, TimeSegment.TYPE_DAY)]
//     };

//     let real_2_to_cut = {
//         _type: 'matroid_type',
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moment(1527804000), moment(1559253600), true, true, TimeSegment.TYPE_DAY)]
//     };



//     let real_1_cutter_ = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(1596, 1596, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moment(1527804000), moment(1559253600), true, true, TimeSegment.TYPE_DAY)]
//     };

//     let matroid_1_2_moins1_zero_ = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     };

//     let matroid_1_zero_: IMatroid = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     } as IMatroid;

//     let matroid_1_moins1_: IMatroid = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY)]
//     } as IMatroid;

//     let matroid_2_zero_: IMatroid = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//     } as IMatroid;

//     let matroid_2_moins1_: IMatroid = {
//         _type: 'matroid_type',
//         id: undefined,
//         var_id: 1,
//         employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//         ts_ranges: [TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY)]
//     } as IMatroid;



//     let matroid_1_2_moins1_zero__moins__matroid_1_zero: MatroidCutResult<any> = new MatroidCutResult(
//         [matroid_1_zero_],
//         [{
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//         } as any, {
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)]
//         } as any]);
//     let matroid_1_2_moins1_zero__moins__matroid_1_moins1: MatroidCutResult<any> = new MatroidCutResult(
//         [matroid_1_moins1_],
//         [{
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//         } as any, {
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)]
//         } as any]);
//     let matroid_1_2_moins1_zero__moins__matroid_2_moins1: MatroidCutResult<any> = new MatroidCutResult(
//         [matroid_2_moins1_],
//         [{
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//         } as any, {
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)]
//         } as any]);
//     let matroid_1_2_moins1_zero__moins__matroid_2_zero: MatroidCutResult<any> = new MatroidCutResult(
//         [matroid_2_zero_],
//         [{
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, zero_cinq, true, true, TimeSegment.TYPE_DAY)]
//         } as any, {
//             _type: 'matroid_type',
//             var_id: 1,
//             employee_id_ranges: [NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)],
//             ts_ranges: [TSRange.createNew(moins_deux, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)]
//         } as any]);






//     let employee_id_ranges = new ModuleTableField('employee_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Employees').set_segmentation_type(NumSegment.TYPE_INT);
//     let ts_ranges = new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY);

//     VOsTypesManager.getInstance().registerModuleTable(new ModuleTable(
//         null,
//         'matroid_type',
//         () => ({
//             _type: 'matroid_type'
//         } as any),
//         [
//             employee_id_ranges,
//             ts_ranges
//         ],
//         null));


//     it('test cloneFrom', () => {
//         expect(MatroidController.getInstance().cloneFrom(null)).to.deep.equal(null);

//         expect(MatroidController.getInstance().cloneFrom(matroid_1_zero)).to.deep.equal(matroid_1_zero_);
//         expect(MatroidController.getInstance().cloneFrom(matroid_2_moins1)).to.deep.equal(matroid_2_moins1_);
//         expect(MatroidController.getInstance().cloneFrom(matroid_2_zero)).to.deep.equal(matroid_2_zero_);
//         expect(MatroidController.getInstance().cloneFrom(matroid_1_2_moins1_zero)).to.deep.equal(matroid_1_2_moins1_zero_);
//         expect(MatroidController.getInstance().cloneFrom(matroid_1_moins1)).to.deep.equal(matroid_1_moins1_);
//     });

//     it('test matroid_intersects_matroid', () => {
//         expect(MatroidController.getInstance().matroid_intersects_matroid(null, null)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, null)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(null, matroid_1_zero)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_zero)).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_2_moins1)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_moins1)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_2_zero)).to.equal(false);

//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_moins1)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_2_zero)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_zero)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_2_moins1)).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_2_zero)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_moins1)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_zero)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_2_moins1)).to.equal(false);


//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_1_zero)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_2_moins1)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_1_moins1)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_2_moins1_zero, matroid_2_zero)).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_zero, matroid_1_2_moins1_zero)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_moins1, matroid_1_2_moins1_zero)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_1_moins1, matroid_1_2_moins1_zero)).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_matroid(matroid_2_zero, matroid_1_2_moins1_zero)).to.equal(true);
//     });

//     it('test matroid_intersects_any_matroid', () => {
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, null)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, null)).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, [matroid_1_zero])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero])).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_2_moins1])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_moins1])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_2_zero])).to.equal(false);

//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_moins1])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_2_zero])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_zero])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_2_moins1])).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_2_zero])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_moins1])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_zero])).to.equal(false);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_2_moins1])).to.equal(false);


//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_2_moins1])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_moins1])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_2_zero])).to.equal(true);

//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_2_moins1_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_2_moins1_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_2_moins1_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_zero, [matroid_1_2_moins1_zero])).to.equal(true);


//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_2_moins1, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_moins1, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_2_moins1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
//         expect(MatroidController.getInstance().matroid_intersects_any_matroid(matroid_1_zero, [matroid_1_zero, matroid_2_moins1, matroid_1_moins1, matroid_2_zero])).to.equal(true);
//     });

//     it('test cut_matroids', () => {

//         expect(JSON.stringify(MatroidController.getInstance().cut_matroids(real_1_cutter, [real_2_to_cut as any]))).to.deep.equal(JSON.stringify([new MatroidCutResult(
//             [real_1_cutter_ as any],
//             [])]));

//     });

//     it('test cut_matroid', () => {
//         expect(MatroidController.getInstance().cut_matroid(null, null)).to.deep.equal(null);
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, null)).to.deep.equal(null);
//         expect(MatroidController.getInstance().cut_matroid(null, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_zero]
//         ));

//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(real_1_cutter, real_2_to_cut as any))).to.deep.equal(JSON.stringify(new MatroidCutResult(
//             [real_1_cutter_],
//             [])));

//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_zero))).to.deep.equal(JSON.stringify(new MatroidCutResult(
//             [matroid_1_zero_],
//             [])));
//         // '{"chopped_items":[{"_type":"matroid_type","var_id":1,"employee_id_ranges":[{"max":1,"max_inclusiv":true,"min":1,' +
//         // '"min_inclusiv":true,"api_type_id":"matroid_type","field_id":"employee_id_ranges"}],"ts_ranges":[{"max":"2019-07-12T11:00:00.000Z",' +
//         // '"max_inclusiv":true,"min":"2019-07-11T11:00:00.000Z","min_inclusiv":true,"api_type_id":"matroid_type","field_id":"ts_ranges"}]}],"remaining_items":[]}');
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_zero]
//         ));
//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(matroid_1_zero, matroid_1_2_moins1_zero))).to.deep.equal(JSON.stringify(matroid_1_2_moins1_zero__moins__matroid_1_zero));


//         expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_zero]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
//             [matroid_1_moins1_],
//             []
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_zero]
//         ));
//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(matroid_1_moins1, matroid_1_2_moins1_zero))).to.deep.equal(JSON.stringify(matroid_1_2_moins1_zero__moins__matroid_1_moins1));



//         expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_zero]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
//             [matroid_2_moins1_],
//             []
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_zero]
//         ));
//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(matroid_2_moins1, matroid_1_2_moins1_zero))).to.deep.equal(JSON.stringify(matroid_1_2_moins1_zero__moins__matroid_2_moins1));



//         expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_zero)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_zero]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_1_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_2_moins1)).to.deep.equal(new MatroidCutResult(
//             [],
//             [matroid_2_moins1]
//         ));
//         expect(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_2_zero)).to.deep.equal(new MatroidCutResult(
//             [matroid_2_zero_],
//             []
//         ));
//         expect(JSON.stringify(MatroidController.getInstance().cut_matroid(matroid_2_zero, matroid_1_2_moins1_zero))).to.deep.equal(JSON.stringify(matroid_1_2_moins1_zero__moins__matroid_2_zero));
//     });

//     it('test getMatroidBases', () => {
//         expect(MatroidController.getInstance().getMatroidBases(null, true, true)).to.deep.equal(null);
//         expect(MatroidController.getInstance().getMatroidBases(matroid_1_zero, true, true)).to.deep.equal([
//             MatroidBase.createNew(matroid_1_zero._type, "employee_id_ranges", [
//                 FieldRange.createNew(
//                     matroid_1_zero._type,
//                     "employee_id_ranges",
//                     1, 1, true, true, NumSegment.TYPE_INT)
//             ]),
//             MatroidBase.createNew(matroid_1_zero._type, "ts_ranges", [
//                 FieldRange.createNew(
//                     matroid_1_zero._type,
//                     "ts_ranges",
//                     moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY),
//             ])
//         ]);
//     });


//     it('test getMatroidFields', () => {
//         expect(MatroidController.getInstance().getMatroidFields(null)).to.deep.equal(null);
//         // TODO FIXME test à revoir
//         // expect(MatroidController.getInstance().getMatroidFields(matroid_1_zero._type)).to.deep.equal([
//         //     employee_id_ranges,
//         //     ts_ranges
//         // ]);
//     });
// });
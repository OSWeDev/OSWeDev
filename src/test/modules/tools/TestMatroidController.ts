import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import MatroidBase from '../../../shared/modules/Matroid/vos/MatroidBase';
import MatroidCutResult from '../../../shared/modules/Matroid/vos/MatroidCutResult';
import FakeDataHandler from '../Var/fakes/FakeDataHandler';
import FakeEmpDayDataHandler from '../Var/fakes/FakeEmpDayDataHandler';
import FakeDataVO from '../Var/fakes/vos/FakeDataVO';


describe('MatroidController', () => {
    FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();


    it('test cloneFrom', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

        expect(MatroidController.getInstance().cloneFrom(null)).to.deep.equal(null);

        expect(MatroidController.getInstance().cloneFrom(FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_zero_());
        expect(MatroidController.getInstance().cloneFrom(FakeEmpDayDataHandler.matroid_2_moins1())).to.deep.equal(FakeEmpDayDataHandler.matroid_2_moins1_());
        expect(MatroidController.getInstance().cloneFrom(FakeEmpDayDataHandler.matroid_2_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_2_zero_());
        expect(MatroidController.getInstance().cloneFrom(FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_2_moins1_zero_());
        expect(MatroidController.getInstance().cloneFrom(FakeEmpDayDataHandler.matroid_1_moins1())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_moins1_());
    });

    it('test matroid_intersects_matroid', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

        expect(MatroidController.getInstance().matroid_intersects_matroid(null, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(null, FakeEmpDayDataHandler.matroid_1_zero())).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_zero())).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).to.equal(false);

        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).to.equal(false);


        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_1_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.equal(true);
    });

    it('test matroid_intersects_any_matroid', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(null, [FakeEmpDayDataHandler.matroid_1_zero()])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero()])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_2_moins1()])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_moins1()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(false);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_moins1()])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_zero()])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_2_moins1()])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(false);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_moins1()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_2_moins1()])).to.equal(false);


        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_2_moins1()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_moins1()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);

        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_zero(), [FakeEmpDayDataHandler.matroid_1_2_moins1_zero()])).to.equal(true);


        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_2_moins1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
        expect(MatroidController.getInstance().matroid_intersects_any_matroid(FakeEmpDayDataHandler.matroid_1_zero(), [FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero()])).to.equal(true);
    });

    it('test cut_matroids', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();


        expect(MatroidController.getInstance().cut_matroids(FakeEmpDayDataHandler.real_1_cutter(), [FakeEmpDayDataHandler.real_2_to_cut()])).to.deep.equal([new MatroidCutResult(
            [FakeEmpDayDataHandler.real_1_cutter_()],
            [])]);

        FakeDataHandler.initializeFakeDataVO();

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let remaning_calcs: Array<MatroidCutResult<FakeDataVO>> = MatroidController.getInstance().cut_matroids(
            var_data_C,
            [var_data_F]);

        expect(remaning_calcs.length).to.eq(1);
        expect(remaning_calcs[0].chopped_items).deep.eq([Object.assign(FakeDataHandler.get_var_data_C(), { var_id: 4 })]);
        // Le assign est juste à cause d'un pb de momentjs....
        remaning_calcs[0].remaining_items[0].ts_ranges[1].max['_i'] = "2021-02-01";
        remaning_calcs[0].remaining_items[0].ts_ranges[1].max['_pf'].parsedDateParts = [2021, 1, 1];
        remaning_calcs[0].remaining_items[0].ts_ranges[1].min['_i'] = "2020-04-01";
        remaning_calcs[0].remaining_items[0].ts_ranges[1].min['_pf'].parsedDateParts = [2020, 3, 1];
        expect(remaning_calcs[0].remaining_items).deep.eq([FakeDataHandler.get_var_data_F_moins_C()]);

        remaning_calcs = MatroidController.getInstance().cut_matroids(
            var_data_B,
            [var_data_F]);

        expect(remaning_calcs.length).to.eq(1);
        expect(remaning_calcs[0].chopped_items).deep.eq([Object.assign(FakeDataHandler.get_var_data_B(), { var_id: 4 })]);
        remaning_calcs[0].remaining_items[0].ts_ranges[0].max['_i'] = "2021-02-01";
        remaning_calcs[0].remaining_items[0].ts_ranges[0].max['_pf'].parsedDateParts = [2021, 1, 1];
        remaning_calcs[0].remaining_items[0].ts_ranges[0].min['_i'] = "2020-03-01";
        remaning_calcs[0].remaining_items[0].ts_ranges[0].min['_pf'].parsedDateParts = [2020, 2, 1];
        expect(remaning_calcs[0].remaining_items).deep.eq([FakeDataHandler.get_var_data_F_moins_B()]);
    });

    it('test cut_matroid', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

        expect(MatroidController.getInstance().cut_matroid(null, null)).to.deep.equal(null);
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), null)).to.deep.equal(null);
        expect(MatroidController.getInstance().cut_matroid(null, FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_1_zero()]
        ));

        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.real_1_cutter(), FakeEmpDayDataHandler.real_2_to_cut())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.real_1_cutter_()],
            []));

        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_1_zero_()],
            []));
        // '{"chopped_items":[{"_type":"matroid_type","var_id":1,"employee_id_ranges":[{"max":1,"max_inclusiv":true,"min":1,' +
        // '"min_inclusiv":true,"api_type_id":"matroid_type","field_id":"employee_id_ranges"}],"ts_ranges":[{"max":"2019-07-12T11:00:00.000Z",' +
        // '"max_inclusiv":true,"min":"2019-07-11T11:00:00.000Z","min_inclusiv":true,"api_type_id":"matroid_type","field_id":"ts_ranges"}]}],"remaining_items":[]}');
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_1_moins1excl()],
            [FakeEmpDayDataHandler.matroid_1_moins2excl()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_2_moins1()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_2_zero())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_2_zero()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_1_zero());


        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_1_moins1excl()],
            [FakeEmpDayDataHandler.matroid_1_zeroexcl()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_1_moins1_()],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_2_moins1()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_2_zero()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_1_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_1_moins1());



        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_1_zero()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_moins1())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_1_moins1()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_moins1())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_2_moins1_()],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_2_zero())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_2_moins1excl()],
            [FakeEmpDayDataHandler.matroid_2_zeroexcl()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_moins1(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_2_moins1());



        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_zero())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_1_zero()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_moins1())).to.deep.equal(new MatroidCutResult(
            [],
            [FakeEmpDayDataHandler.matroid_1_moins1()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_2_moins1())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_2_moins1excl()],
            [FakeEmpDayDataHandler.matroid_2_moins2excl()]
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_2_zero())).to.deep.equal(new MatroidCutResult(
            [FakeEmpDayDataHandler.matroid_2_zero_()],
            []
        ));
        expect(MatroidController.getInstance().cut_matroid(FakeEmpDayDataHandler.matroid_2_zero(), FakeEmpDayDataHandler.matroid_1_2_moins1_zero())).to.deep.equal(FakeEmpDayDataHandler.matroid_1_2_moins1_zero__moins__matroid_2_zero());
    });

    it('test getMatroidBases', () => {
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();

        expect(MatroidController.getInstance().getMatroidBases(null, true, true)).to.deep.equal(null);
        expect(MatroidController.getInstance().getMatroidBases(FakeEmpDayDataHandler.matroid_1_zero(), true, true)).to.deep.equal([
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

    it('test getMatroidFields', () => {
        FakeDataHandler.initializeFakeDataVO();

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let selected_imports: FakeDataVO[] = [var_data_C, var_data_B];
        let remaning_calcs: FakeDataVO[] = MatroidController.getInstance().matroids_cut_matroids_get_remainings(
            [var_data_C, var_data_B],
            [var_data_F]);

        remaning_calcs[0].ts_ranges[0].max['_i'] = "2021-02-01";
        remaning_calcs[0].ts_ranges[0].max['_pf'].parsedDateParts = [2021, 1, 1];
        remaning_calcs[0].ts_ranges[0].min['_i'] = "2020-04-01";
        remaning_calcs[0].ts_ranges[0].min['_pf'].parsedDateParts = [2020, 3, 1];

        expect(remaning_calcs).to.deep.eq([FakeDataHandler.get_var_data_F_moins_BC()]);
    });
});
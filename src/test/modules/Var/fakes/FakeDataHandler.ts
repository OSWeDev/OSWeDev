
import * as  moment from 'moment';
import VarsComputeController from '../../../../server/modules/Var/VarsComputeController';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import DAG from '../../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAG from '../../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsInitController from '../../../../shared/modules/Var/VarsInitController';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeDataHandler {

    public static initializeFakeDataVO() {

        let datatable_fields = [
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        VarsInitController.getInstance().register_var_data(FakeDataVO.API_TYPE_ID, () => new FakeDataVO(), datatable_fields, null, true);
    }

    /**
     * Returns simple triangular test DAG :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     */
    public static get_fake_triangular_dag(): VarDAG {
        let dag: VarDAG = new VarDAG();

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A, VarsComputeController, true);

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B, VarsComputeController, true);

        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let dagnodeC: VarDAGNode = VarDAGNode.getInstance(dag, var_data_C, VarsComputeController, true);

        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let dagnodeE: VarDAGNode = VarDAGNode.getInstance(dag, var_data_E, VarsComputeController, true);

        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let dagnodeF: VarDAGNode = VarDAGNode.getInstance(dag, var_data_F, VarsComputeController, true);

        let var_data_G: FakeDataVO = FakeDataHandler.get_var_data_G();
        let dagnodeG: VarDAGNode = VarDAGNode.getInstance(dag, var_data_G, VarsComputeController, true);

        let var_data_H: FakeDataVO = FakeDataHandler.get_var_data_H();
        let dagnodeH: VarDAGNode = VarDAGNode.getInstance(dag, var_data_H, VarsComputeController, true);

        dagnodeA.addOutgoingDep("AB", dagnodeB);
        dagnodeA.addOutgoingDep("AC", dagnodeC);

        dagnodeB.addOutgoingDep("BE", dagnodeE);
        dagnodeB.addOutgoingDep("BF", dagnodeF);

        dagnodeC.addOutgoingDep("CG", dagnodeG);
        dagnodeC.addOutgoingDep("CH", dagnodeH);

        return dag;
    }

    public static get_var_data_A(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_A_index() {
        return "1_[[1577836800,1577923200)]";
    }

    public static get_var_data_A2(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        let a = var_data.index;
        return var_data;
    }

    public static get_var_data_A_A2(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY),
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        let a = var_data.index;
        return var_data;
    }

    public static get_var_data_B(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_B_index() {
        return "2_[[1580515200,1583020800)]";
    }

    public static get_var_data_C(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_C_index() {
        return "2_[[1583020800,1585695600)]";
    }

    public static get_var_data_E(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_E_index() {
        return "3_[[1580515200,1580601600)]";
    }

    public static get_var_data_F(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_F_index() {
        return "4_[[1580515200,1612137600)]";
    }

    public static get_var_data_G(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_G_index() {
        return "4_[[1577836800,1580515200)]";
    }

    public static get_var_data_H(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 5;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_YEAR)
        ];
        let a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_H_index() {
        return "1_[[1577836800,1609459200)]";
    }

    public static get_var_data_F_moins_BC(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                moment('2020-04-01').utc(true).startOf('day').unix(),
                moment('2021-02-01').utc(true).startOf('day').unix(),
                true,
                false,
                TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }

    public static get_var_data_F_moins_C(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                moment('2020-02-01').utc(true).startOf('day').unix(),
                moment('2020-03-01').utc(true).startOf('day').unix(),
                true,
                false,
                TimeSegment.TYPE_MONTH),
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                moment('2020-04-01').utc(true).startOf('day').unix(),
                moment('2021-02-01').utc(true).startOf('day').unix(),
                true,
                false,
                TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }

    public static get_var_data_F_moins_B(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.createNew(
                TSRange.RANGE_TYPE,
                moment('2020-03-01').utc(true).startOf('day').unix(),
                moment('2021-02-01').utc(true).startOf('day').unix(),
                true,
                false,
                TimeSegment.TYPE_MONTH)
        ];
        let a = var_data.index;
        return var_data;
    }

    public static get_var_data_A2_Update(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY),
            RangeHandler.create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        let a = var_data.index;
        return var_data;
    }
}
import * as  moment from 'moment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VarDAG from '../../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarsInitController from '../../../../shared/modules/Var/VarsInitController';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeDataHandler {

    public static initializeDayDataRangesVO() {

        let datatable_fields = [
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        VarsInitController.getInstance().register_var_data(FakeDataVO.API_TYPE_ID, () => FakeDataVO.createNew(null, null), datatable_fields, null);
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
        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B);

        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let dagnodeC: VarDAGNode = VarDAGNode.getInstance(dag, var_data_C);

        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let dagnodeE: VarDAGNode = VarDAGNode.getInstance(dag, var_data_E);

        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let dagnodeF: VarDAGNode = VarDAGNode.getInstance(dag, var_data_F);

        let var_data_G: FakeDataVO = FakeDataHandler.get_var_data_G();
        let dagnodeG: VarDAGNode = VarDAGNode.getInstance(dag, var_data_G);

        let var_data_H: FakeDataVO = FakeDataHandler.get_var_data_H();
        let dagnodeH: VarDAGNode = VarDAGNode.getInstance(dag, var_data_H);

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
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];
        return var_data;
    }
    public static get_expected_var_data_A_index() {
        return "1_[[1577836800000,1577923200000)]";
    }

    public static get_var_data_B(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];
        return var_data;
    }
    public static get_expected_var_data_B_index() {
        return "2_[[1580515200000,1583020800000)]";
    }

    public static get_var_data_C(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-03-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];
        return var_data;
    }
    public static get_expected_var_data_C_index() {
        return "2_[[1583020800000,1585695600000)]";
    }

    public static get_var_data_E(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];
        return var_data;
    }
    public static get_expected_var_data_E_index() {
        return "3_[[1580515200000,1580601600000)]";
    }

    public static get_var_data_F(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day'), TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)
        ];
        return var_data;
    }
    public static get_expected_var_data_F_index() {
        return "4_[[1580515200000,1612137600000)]";
    }

    public static get_var_data_G(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 4;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];
        return var_data;
    }
    public static get_expected_var_data_G_index() {
        return "4_[[1577836800000,1580515200000)]";
    }

    public static get_var_data_H(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 5;
        var_data.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_YEAR)
        ];
        return var_data;
    }
    public static get_expected_var_data_H_index() {
        return "1_[[1577836800000,1609459200000)]";
    }
}
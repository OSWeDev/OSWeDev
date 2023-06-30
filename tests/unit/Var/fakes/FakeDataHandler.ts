
import moment from 'moment';
import VarsComputeController from '../../../../src/server/modules/Var/VarsComputeController';
import TSRange from '../../../../src/shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../src/shared/modules/ModuleTableField';
import VarsInitController from '../../../../src/shared/modules/Var/VarsInitController';
import VarDAG from '../../../../src/shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../../src/shared/modules/Var/graph/VarDAGNode';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
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
    public static async get_fake_triangular_dag(): Promise<VarDAG> {
        let dag: VarDAG = new VarDAG();

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, VarsComputeController, true);

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, VarsComputeController, true);

        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let dagnodeC: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_C, VarsComputeController, true);

        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let dagnodeE: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_E, VarsComputeController, true);

        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let dagnodeF: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_F, VarsComputeController, true);

        let var_data_G: FakeDataVO = FakeDataHandler.get_var_data_G();
        let dagnodeG: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_G, VarsComputeController, true);

        let var_data_H: FakeDataVO = FakeDataHandler.get_var_data_H();
        let dagnodeH: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_H, VarsComputeController, true);

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
        return "1|LmreE";
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

    public static get_var_data_A_A3(): FakeDataVO {
        let var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY),
            RangeHandler.create_single_elt_TSRange(moment('2020-05-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY),
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
        return "2|Lsy_M&LycR4";
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
        return "2|LycR4";
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
        return "3|Lsy_M";
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
        return "4|Lsy_M";
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
        return "4|LmreE";
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
        return "5|LmreE";
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
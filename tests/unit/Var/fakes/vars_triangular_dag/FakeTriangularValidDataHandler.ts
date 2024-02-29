
import moment from 'moment';
import TimeSegment from '../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../src/shared/modules/DAO/vos/ModuleTableFieldVO';
import VarsInitController from '../../../../../src/shared/modules/Var/VarsInitController';
import VarDAG from '../../../../../src/server/modules/Var/vos/VarDAG';
import VarDAGNode from '../../../../../src/server/modules/Var/vos/VarDAGNode';
import RangeHandler from '../../../../../src/shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeTriangularValidDataHandler {

    public static initializeFakeDataVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new('ts_ranges', ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
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
        const dag: VarDAG = new VarDAG();

        const var_data_A: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_A();
        const dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

        const var_data_B: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_B();
        const dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, true);

        const var_data_C: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_C();
        const dagnodeC: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_C, true);

        const var_data_E: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_E();
        const dagnodeE: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_E, true);

        const var_data_F: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_F();
        const dagnodeF: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_F, true);

        const var_data_G: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_G();
        const dagnodeG: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_G, true);

        const var_data_H: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_H();
        const dagnodeH: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_H, true);

        dagnodeA.addOutgoingDep("AB", dagnodeB);
        dagnodeA.addOutgoingDep("AC", dagnodeC);

        dagnodeB.addOutgoingDep("BE", dagnodeE);
        dagnodeB.addOutgoingDep("BF", dagnodeF);

        dagnodeC.addOutgoingDep("CG", dagnodeG);
        dagnodeC.addOutgoingDep("CH", dagnodeH);

        return dag;
    }

    public static get_var_data_A(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 1;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_A_index() {
        return "1|LmreE";
    }

    public static get_var_data_B(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 2;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_B_index() {
        return "2|LmreE";
    }

    public static get_var_data_C(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 3;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_C_index() {
        return "3|LmreE";
    }

    public static get_var_data_E(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 5;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_E_index() {
        return "5|LmreE";
    }

    public static get_var_data_F(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 6;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_F_index() {
        return "6|LmreE";
    }

    public static get_var_data_G(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 7;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_G_index() {
        return "7|LmreE";
    }

    public static get_var_data_H(): FakeDataVO {
        const var_data: FakeDataVO = new FakeDataVO();
        var_data.var_id = 8;
        var_data.ts_ranges = [
            RangeHandler.create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day').unix(), TimeSegment.TYPE_DAY)
        ];
        const a = var_data.index;
        return var_data;
    }
    public static get_expected_var_data_H_index() {
        return "8|LmreE";
    }
}
/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import VarsComputeController from '../../../server/modules/Var/VarsComputeController';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';

describe('VarsComputeController', () => {

    compute
    compute_node
    create_tree
    deploy_deps
    get_node_deps
    it('test aggregate_imports_and_remaining_datas', async () => {

        FakeDataHandler.initializeDayDataRangesVO();

        /**
         * E dans B
         * B dans F
         * C dans F et indépendant de E et B
         * card C > card B
         */
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
        let selected_imports: FakeDataVO[] = [var_data_C, var_data_B];
        let remaning_calcs: FakeDataVO[] = MatroidController.getInstance().matroids_cut_matroids_get_remainings([var_data_C, var_data_B], [var_data_F]);

        let node_F = VarDAGNode.getInstance(new VarDAG(), var_data_F);
        VarsComputeController.getInstance().aggregate_imports_and_remaining_datas(node_F, selected_imports, remaning_calcs);
        expect(node_F.is_aggregator).to.equal(true);
        expect(node_F.aggregated_nodes).to.deep.equal({
            [var_data_C.index]: VarDAGNode.getInstance(node_F.dag, var_data_C),
            [var_data_B.index]: VarDAGNode.getInstance(node_F.dag, var_data_B),
            [remaning_calcs[0].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[0]),
            [remaning_calcs[1].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[1]),
            [remaning_calcs[2].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[2]),
        });
    });

    it('test sort_matroids_per_cardinal_desc', async () => {

        FakeDataHandler.initializeDayDataRangesVO();

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_B)).to.equal(1);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_A)).to.equal(0);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_B, var_data_A)).to.equal(-1);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_C)).to.equal(1);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_C, var_data_A)).to.equal(-1);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_B, var_data_C)).to.equal(1);
        expect(VarsComputeController.getInstance().sort_matroids_per_cardinal_desc(var_data_C, var_data_B)).to.equal(-1);
    });

    it('test get_selection_imports', async () => {

        FakeDataHandler.initializeDayDataRangesVO();

        /**
         * E dans B
         * B dans F
         * C dans F et indépendant de E et B
         * card C > card B
         */
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

        expect(VarsComputeController.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_E], var_data_B)).to.deep.equal([var_data_E]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_B], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_B], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_F, var_data_B], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_F], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_F, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_F, var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsComputeController.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
    });
});
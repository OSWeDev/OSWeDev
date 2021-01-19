/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import VarsImportsHandler from '../../../server/modules/Var/VarsImportsHandler';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';

describe('VarsImportsHandler', () => {


    // it('test load_imports_and_split_nodes', async () => {

    //     FakeDataHandler.initializeDayDataRangesVO();

    //     let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    //     let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    //     let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

    //     expect(VarsImportsHandler.getInstance().load_imports_and_split_nodes(var_data_A, var_data_B)).to.equal(1);
    // });

    it('test aggregate_imports_and_remaining_datas', async () => {

        FakeDataHandler.initializeFakeDataVO();

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
        let remaning_calcs: FakeDataVO[] = MatroidController.getInstance().matroids_cut_matroids_get_remainings(
            [var_data_C, var_data_B],
            [var_data_F]);

        let node_F = VarDAGNode.getInstance(new DAG(), var_data_F);
        VarsImportsHandler.getInstance().aggregate_imports_and_remaining_datas(node_F, selected_imports, remaning_calcs);
        expect(node_F.is_aggregator).to.equal(true);
        expect(node_F.aggregated_nodes).to.deep.equal({
            [var_data_C.index]: VarDAGNode.getInstance(node_F.dag, var_data_C),
            [var_data_B.index]: VarDAGNode.getInstance(node_F.dag, var_data_B),
            [remaning_calcs[0].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[0])
        });
        expect(remaning_calcs.length).to.equal(1);
    });

    it('test sort_matroids_per_cardinal_desc', async () => {

        FakeDataHandler.initializeFakeDataVO();

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_B)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_A)).to.equal(0);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_A)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_C)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_A)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_C)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_B)).to.be.lte(-1);
    });

    it('test get_selection_imports', async () => {

        FakeDataHandler.initializeFakeDataVO();

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

        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_E], var_data_B)).to.deep.equal([var_data_E]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_B], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
    });
});
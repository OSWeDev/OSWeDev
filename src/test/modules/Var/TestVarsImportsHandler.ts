/* tslint:disable:no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import VarsComputeController from '../../../server/modules/Var/VarsComputeController';
import VarsImportsHandler from '../../../server/modules/Var/VarsImportsHandler';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './fakes/FakeVarControllerDsEmpDistant';
import FakeDataVO from './fakes/vos/FakeDataVO';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();


describe('VarsImportsHandler', () => {


    // it('test load_imports_and_split_nodes', async () => {

    //     FakeDataHandler.initializeDayDataRangesVO();

    //     let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    //     let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    //     let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

    //     expect(VarsImportsHandler.getInstance().load_imports_and_split_nodes(var_data_A, var_data_B)).to.equal(1);
    // });

    it('test aggregate_imports_and_remaining_datas', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

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

        let node_F = await VarDAGNode.getInstance(new VarDAG(), var_data_F, VarsComputeController, true);
        await VarsImportsHandler.getInstance().aggregate_imports_and_remaining_datas(node_F, selected_imports, remaning_calcs);
        expect(node_F.is_aggregator).to.equal(true);
        expect(node_F.aggregated_datas).to.deep.equal({
            [var_data_C.index]: var_data_C,
            [var_data_B.index]: var_data_B,
            [remaning_calcs[0].index]: remaning_calcs[0]
        });
        expect(remaning_calcs.length).to.equal(1);
    });

    it('test sort_matroids_per_cardinal_desc with var_confs', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_A_A3(); // 3 jours
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_A_A2(); // 2 jours
        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_C(); // 31 jours après correction du param sur le segment de date puisqu'on déclare la var avant

        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_B)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_A)).to.equal(0);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_A)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_C)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_A)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_C)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_B)).to.be.lte(-1);
    });

    it('test sort_matroids_per_cardinal_desc', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();

        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_A_A3(); // 3 jours
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_A_A2(); // 2 jours
        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_C(); // 1 mois => pas de var déclarée donc on corrige pas auto le segment_type

        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_B)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_A)).to.equal(0);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_A)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_C)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_A)).to.be.lte(-1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_C)).to.be.gte(1);
        expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_B)).to.be.lte(-1);
    });


    it('test get_selection_imports', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });

        /**
         * E dans B
         * B dans F
         * C dans F et indépendant de E et B
         * card C > card B
         */
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B(); // 2020-02-01 2 TYPE_MONTH
        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E(); // 2020-02-01 3 TYPE_DAY
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F(); // 2020-02-01 4 TYPE_ROLLING_YEAR_MONTH_START
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C(); // 2020-03-01 2 TYPE_MONTH

        let var_data_F2: FakeDataVO = FakeDataHandler.get_var_data_F();
        var_data_F2.var_id = 2;
        var_data_F2.ts_ranges.forEach((ts_range: TSRange) => {
            ts_range.segment_type = TimeSegment.TYPE_DAY;
        });
        // [2020-02-01, 2021-01-01] 2 TYPE_MONTH

        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_E], var_data_B)).to.deep.equal([var_data_E]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_B], var_data_F2)).to.deep.equal([var_data_F2]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2], var_data_F2)).to.deep.equal([var_data_F2]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F2)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_B], var_data_F2)).to.deep.equal([var_data_F2]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F2)).to.deep.equal([var_data_C, var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_C, var_data_B], var_data_F2)).to.deep.equal([var_data_F2]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F2)).to.deep.equal([var_data_C, var_data_B]);
        expect(() => VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_F2)).to.throw();
        expect(() => VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F)).to.throw(); //.to.deep.equal([var_data_B]);
    });
});
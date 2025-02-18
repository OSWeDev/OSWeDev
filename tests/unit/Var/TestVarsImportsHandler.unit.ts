import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

/* tslint:disable:no-unused-expression */
import { expect, test } from "playwright-test-coverage";
import VarsImportsHandler from '../../../src/server/modules/Var/VarsImportsHandler';
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import MatroidController from '../../../src/shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../src/shared/modules/Var/ModuleVar';
import VarsController from '../../../src/shared/modules/Var/VarsController';
import VarDAG from '../../../src/server/modules/Var/vos/VarDAG';
import VarDAGNode from '../../../src/server/modules/Var/vos/VarDAGNode';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './fakes/FakeVarControllerDsEmpDistant';
import FakeVarsInit from './fakes/FakeVarsInit';
import FakeDataVO from './fakes/vos/FakeDataVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import ConfigurationService from '../../../src/server/env/ConfigurationService';

// test('VarsImportsHandler: test load_imports_and_split_nodes', async () => {

//     FakeDataHandler.initializeDayDataRangesVO();

//     let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
//     let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
//     let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

//     expect(VarsImportsHandler.getInstance().load_imports_and_split_nodes(var_data_A, var_data_B)).toStrictEqual(1);
// });

ConsoleHandler.init('test');
ConfigurationService.setEnvParams({});
ConfigurationService.IS_UNIT_TEST_MODE = true;

test('VarsImportsHandler: test aggregate_imports_and_remaining_datas', async () => {

    // VarsController.clear_all_inits();
    // VarsServerController.clear_all_inits();

    await FakeVarsInit.initAll();
    await ModuleVar.getInstance().initializeasync({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });

    await FakeVarControllerDsDistant.getInstance().initialize();
    await FakeVarControllerDsEmpDistant.getInstance().initialize();
    await FakeVarControllerDeps.getInstance().initialize();
    VarsController.initialize({
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

    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    const var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
    const var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
    const var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
    const selected_imports: FakeDataVO[] = [var_data_C, var_data_B];
    const remaning_calcs: FakeDataVO[] = MatroidController.matroids_cut_matroids_get_remainings(
        [var_data_C, var_data_B],
        [var_data_F]);

    const node_F = await VarDAGNode.getInstance(new VarDAG(), var_data_F, true);
    await VarsImportsHandler.getInstance().aggregate_imports_and_remaining_datas(node_F, selected_imports, remaning_calcs);
    expect(node_F.is_aggregator).toStrictEqual(true);
    expect(node_F.aggregated_datas).toStrictEqual({
        [var_data_C.index]: var_data_C,
        [var_data_B.index]: var_data_B,
        [remaning_calcs[0].index]: remaning_calcs[0]
    });
    expect(remaning_calcs.length).toStrictEqual(1);
});

test('VarsImportsHandler: test sort_matroids_per_cardinal_desc with var_confs', async () => {

    // VarsController.clear_all_inits();
    // VarsServerController.clear_all_inits();

    await FakeVarsInit.initAll();
    await ModuleVar.getInstance().initializeasync({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });

    await FakeVarControllerDsDistant.getInstance().initialize();
    await FakeVarControllerDsEmpDistant.getInstance().initialize();
    await FakeVarControllerDeps.getInstance().initialize();
    VarsController.initialize({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });

    const var_data_C: FakeDataVO = FakeDataHandler.get_var_data_A_A3(); // 3 jours
    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_A_A2(); // 2 jours
    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_C(); // 31 jours après correction du param sur le segment de date puisqu'on déclare la var avant

    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_B)).toBeLessThanOrEqual(-1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_A)).toStrictEqual(0);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_A)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_C)).toBeLessThanOrEqual(-1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_A)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_C)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_B)).toBeLessThanOrEqual(-1);
});

test('VarsImportsHandler: test sort_matroids_per_cardinal_desc', async () => {

    await FakeVarsInit.initAll();
    const var_data_C: FakeDataVO = FakeDataHandler.get_var_data_A_A3(); // 3 jours
    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_A_A2(); // 2 jours
    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_C(); // 1 mois => var déclarée donc on corrige auto le segment_type => 31 day

    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_B)).toBeLessThanOrEqual(-1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_A)).toStrictEqual(0);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_A)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_A, var_data_C)).toBeLessThanOrEqual(-1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_A)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_B, var_data_C)).toBeGreaterThanOrEqual(1);
    expect(VarsImportsHandler.getInstance()['sort_matroids_per_cardinal_desc'](var_data_C, var_data_B)).toBeLessThanOrEqual(-1);
});


test('VarsImportsHandler: test get_selection_imports', async () => {

    // VarsController.clear_all_inits();
    // VarsServerController.clear_all_inits();

    await FakeVarsInit.initAll();

    await ModuleVar.getInstance().initializeasync({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });

    await FakeVarControllerDsDistant.getInstance().initialize();
    await FakeVarControllerDsEmpDistant.getInstance().initialize();
    await FakeVarControllerDeps.getInstance().initialize();
    VarsController.initialize({
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
    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B(); // 2020-02-01 2 TYPE_MONTH
    const var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E(); // 2020-02-01 3 TYPE_DAY
    const var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F(); // 2020-02-01 4 TYPE_ROLLING_YEAR_MONTH_START
    const var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C(); // 2020-03-01 2 TYPE_MONTH

    const var_data_F2: FakeDataVO = FakeDataHandler.get_var_data_F();
    var_data_F2.var_id = 2;
    var_data_F2.ts_ranges.forEach((ts_range: TSRange) => {
        ts_range.segment_type = TimeSegment.TYPE_DAY;
    });
    // [2020-02-01, 2021-01-01] 2 TYPE_MONTH

    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_B)).toStrictEqual([var_data_B]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_E], var_data_B)).toStrictEqual([var_data_E]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_B)).toStrictEqual([var_data_B]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_B], var_data_F2)).toStrictEqual([var_data_F2]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2], var_data_F2)).toStrictEqual([var_data_F2]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F2)).toStrictEqual([var_data_B]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_B], var_data_F2)).toStrictEqual([var_data_F2]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F2)).toStrictEqual([var_data_C, var_data_B]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F2, var_data_C, var_data_B], var_data_F2)).toStrictEqual([var_data_F2]);
    expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F2)).toStrictEqual([var_data_C, var_data_B]);
    expect(() => VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_F2)).toThrow();
    expect(() => VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F)).toThrow(); //.toStrictEqual([var_data_B]);
});
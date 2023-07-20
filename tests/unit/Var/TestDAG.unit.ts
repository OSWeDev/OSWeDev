/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from "playwright-test-coverage";
import VarDAG from '../../../src/shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../src/shared/modules/Var/graph/VarDAGNode';
import DAGController from '../../../src/shared/modules/Var/graph/dagbase/DAGController';
import DAGNodeDep from '../../../src/shared/modules/Var/graph/dagbase/DAGNodeDep';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeVarsInit from './fakes/FakeVarsInit';
import FakeDataVO from './fakes/vos/FakeDataVO';
import RangeHandler from '../../../src/shared/tools/RangeHandler';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import FakeTriangularVarsInit from './fakes/vars_triangular_dag/FakeTriangularVarsInit';
import FakeTriangularValidDataHandler from './fakes/vars_triangular_dag/FakeTriangularValidDataHandler';
import VarDAGNodeDep from '../../../src/shared/modules/Var/graph/VarDAGNodeDep';

test('DAG: test semaphore getInstance()', async () => {

    await FakeVarsInit.initAll();

    let dag: VarDAG = new VarDAG();

    let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();

    let dagnodeA: VarDAGNode = null;
    let dagnodeB: VarDAGNode = null;
    let dagnodeC: VarDAGNode = null;
    let dagnodeD: VarDAGNode = null;
    let dagnodeE: VarDAGNode = null;
    let dagnodeF: VarDAGNode = null;
    let dagnodeG: VarDAGNode = null;

    let promises = [
        (async () => {
            dagnodeA = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeB = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeC = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeD = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeE = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeF = await VarDAGNode.getInstance(dag, var_data_A, true);
        })(),
        (async () => {
            dagnodeG = await VarDAGNode.getInstance(dag, var_data_A, true);
        })()
    ];

    await Promise.all(promises);

    expect(dagnodeA.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeA.aggregated_datas).toStrictEqual({});
    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(false);
    expect(dagnodeA.incoming_deps).toStrictEqual({});
    expect(dagnodeA.is_aggregator).toStrictEqual(false);
    expect(dagnodeA.outgoing_deps).toStrictEqual({});
    expect(dagnodeA.var_data).toStrictEqual(var_data_A);
    expect(dagnodeA.var_dag).toStrictEqual(dag);

    expect(dagnodeB.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeB.aggregated_datas).toStrictEqual({});
    expect(dagnodeB.hasIncoming).toStrictEqual(false);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.incoming_deps).toStrictEqual({});
    expect(dagnodeB.is_aggregator).toStrictEqual(false);
    expect(dagnodeB.outgoing_deps).toStrictEqual({});
    expect(dagnodeB.var_data).toStrictEqual(var_data_A);
    expect(dagnodeB.var_dag).toStrictEqual(dag);

    expect(dagnodeC.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeC.aggregated_datas).toStrictEqual({});
    expect(dagnodeC.hasIncoming).toStrictEqual(false);
    expect(dagnodeC.hasOutgoing).toStrictEqual(false);
    expect(dagnodeC.incoming_deps).toStrictEqual({});
    expect(dagnodeC.is_aggregator).toStrictEqual(false);
    expect(dagnodeC.outgoing_deps).toStrictEqual({});
    expect(dagnodeC.var_data).toStrictEqual(var_data_A);
    expect(dagnodeC.var_dag).toStrictEqual(dag);

    expect(dagnodeD.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeD.aggregated_datas).toStrictEqual({});
    expect(dagnodeD.hasIncoming).toStrictEqual(false);
    expect(dagnodeD.hasOutgoing).toStrictEqual(false);
    expect(dagnodeD.incoming_deps).toStrictEqual({});
    expect(dagnodeD.is_aggregator).toStrictEqual(false);
    expect(dagnodeD.outgoing_deps).toStrictEqual({});
    expect(dagnodeD.var_data).toStrictEqual(var_data_A);
    expect(dagnodeD.var_dag).toStrictEqual(dag);

    expect(dagnodeE.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeE.aggregated_datas).toStrictEqual({});
    expect(dagnodeE.hasIncoming).toStrictEqual(false);
    expect(dagnodeE.hasOutgoing).toStrictEqual(false);
    expect(dagnodeE.incoming_deps).toStrictEqual({});
    expect(dagnodeE.is_aggregator).toStrictEqual(false);
    expect(dagnodeE.outgoing_deps).toStrictEqual({});
    expect(dagnodeE.var_data).toStrictEqual(var_data_A);
    expect(dagnodeE.var_dag).toStrictEqual(dag);

    expect(dagnodeF.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeF.aggregated_datas).toStrictEqual({});
    expect(dagnodeF.hasIncoming).toStrictEqual(false);
    expect(dagnodeF.hasOutgoing).toStrictEqual(false);
    expect(dagnodeF.incoming_deps).toStrictEqual({});
    expect(dagnodeF.is_aggregator).toStrictEqual(false);
    expect(dagnodeF.outgoing_deps).toStrictEqual({});
    expect(dagnodeF.var_data).toStrictEqual(var_data_A);
    expect(dagnodeF.var_dag).toStrictEqual(dag);

    expect(dagnodeG.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeG.aggregated_datas).toStrictEqual({});
    expect(dagnodeG.hasIncoming).toStrictEqual(false);
    expect(dagnodeG.hasOutgoing).toStrictEqual(false);
    expect(dagnodeG.incoming_deps).toStrictEqual({});
    expect(dagnodeG.is_aggregator).toStrictEqual(false);
    expect(dagnodeG.outgoing_deps).toStrictEqual({});
    expect(dagnodeG.var_data).toStrictEqual(var_data_A);
    expect(dagnodeG.var_dag).toStrictEqual(dag);

    expect(dag.nb_nodes).toStrictEqual(1);
    expect(dag.nodes).toStrictEqual({ "1|LmreE": dagnodeA });
    expect(dag.leafs).toStrictEqual({ "1|LmreE": dagnodeA });
    expect(dag.roots).toStrictEqual({ "1|LmreE": dagnodeA });
});

// FIXME UNCOMMENT WHEN ISSUE https://github.com/microsoft/playwright/issues/24173 is solved
// test('DAG: test getInstance() maxrange', async () => {
//     ConsoleHandler.init();

//     await FakeVarsInit.initAll();

//     let dag: VarDAG = new VarDAG();

//     let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
//     var_data_A.ts_ranges = [RangeHandler.getMaxTSRange()];

//     let node_A = null;
//     let throws = false;
//     try {
//         node_A = await VarDAGNode.getInstance(dag, var_data_A, true);
//         ConsoleHandler.error('Should not be able to create a node with a maxrange');
//         throw new Error('Should not be able to create a node with a maxrange');
//     } catch (error) {
//         throws = true;
//     }
//     expect(throws).toStrictEqual(true);
//     expect(node_A).toStrictEqual(null);

//     expect(dag.nb_nodes).toStrictEqual(0);
// });

// FIXME DELETE WHEN ISSUE https://github.com/microsoft/playwright/issues/24173 is solved
// test('Playwright promise rejection with finally', async () => {
//     let p = new Promise((resolve, reject) => {
//         reject('failed');
//     });

//     p.finally(() => {
//         console.log('finally');
//     });

//     let has_failed = false;
//     try {
//         await p;
//     } catch (e) {
//         has_failed = true;
//     }
//     expect(has_failed).toStrictEqual(true);
// });

// test('Playwright promise rejection without finally', async () => {
//     let p = new Promise((resolve, reject) => {
//         reject('failed');
//     });

//     let has_failed = false;
//     try {
//         await p;
//     } catch (e) {
//         has_failed = true;
//     }
//     expect(has_failed).toStrictEqual(true);
// });

test('DAG: test remove nodes', async () => {

    await FakeTriangularVarsInit.initAll();

    let dag: VarDAG = await FakeTriangularValidDataHandler.get_fake_triangular_dag();

    let var_data_A: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_A();
    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    let var_data_B: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_B();
    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, true);

    let var_data_C: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_C();
    let dagnodeC: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_C, true);

    let var_data_E: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_E();
    let dagnodeE: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_E, true);

    let var_data_F: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_F();
    let dagnodeF: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_F, true);

    let var_data_G: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_G();
    let dagnodeG: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_G, true);

    let var_data_H: FakeDataVO = FakeTriangularValidDataHandler.get_var_data_H();
    let dagnodeH: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_H, true);

    expect(dag.nb_nodes).toStrictEqual(7);
    expect(dag.nodes).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA,
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_C_index()]: dagnodeC,
        [FakeTriangularValidDataHandler.get_expected_var_data_E_index()]: dagnodeE,
        [FakeTriangularValidDataHandler.get_expected_var_data_F_index()]: dagnodeF,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.leafs).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_E_index()]: dagnodeE,
        [FakeTriangularValidDataHandler.get_expected_var_data_F_index()]: dagnodeF,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.roots).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA
    });

    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(true);
    expect(dagnodeA.var_data).toStrictEqual(var_data_A);
    expect(dagnodeA.var_dag).toStrictEqual(dag);
    expect(dagnodeA.outgoing_deps).toStrictEqual({
        AB: new VarDAGNodeDep('AB', dagnodeA, dagnodeB),
        AC: new VarDAGNodeDep('AC', dagnodeA, dagnodeC)
    });
    expect(dagnodeA.incoming_deps).toStrictEqual({});

    expect(dagnodeB.hasIncoming).toStrictEqual(true);
    expect(dagnodeB.hasOutgoing).toStrictEqual(true);
    expect(dagnodeB.var_data).toStrictEqual(var_data_B);
    expect(dagnodeB.var_dag).toStrictEqual(dag);
    expect(dagnodeB.outgoing_deps).toStrictEqual({
        BE: new VarDAGNodeDep('BE', dagnodeB, dagnodeE),
        BF: new VarDAGNodeDep('BF', dagnodeB, dagnodeF)
    });
    expect(dagnodeB.incoming_deps).toStrictEqual({
        AB: [new VarDAGNodeDep('AB', dagnodeA, dagnodeB)]
    });

    expect(dagnodeC.hasIncoming).toStrictEqual(true);
    expect(dagnodeC.hasOutgoing).toStrictEqual(true);
    expect(dagnodeC.var_data).toStrictEqual(var_data_C);
    expect(dagnodeC.var_dag).toStrictEqual(dag);
    expect(dagnodeC.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', dagnodeC, dagnodeG),
        CH: new VarDAGNodeDep('CH', dagnodeC, dagnodeH)
    });
    expect(dagnodeC.incoming_deps).toStrictEqual({
        AC: [new VarDAGNodeDep('AC', dagnodeA, dagnodeC)]
    });

    expect(dagnodeE.hasIncoming).toStrictEqual(true);
    expect(dagnodeE.hasOutgoing).toStrictEqual(false);
    expect(dagnodeE.var_data).toStrictEqual(var_data_E);
    expect(dagnodeE.var_dag).toStrictEqual(dag);
    expect(dagnodeE.outgoing_deps).toStrictEqual({});
    expect(dagnodeE.incoming_deps).toStrictEqual({
        BE: [new VarDAGNodeDep('BE', dagnodeB, dagnodeE)]
    });

    expect(dagnodeF.hasIncoming).toStrictEqual(true);
    expect(dagnodeF.hasOutgoing).toStrictEqual(false);
    expect(dagnodeF.var_data).toStrictEqual(var_data_F);
    expect(dagnodeF.var_dag).toStrictEqual(dag);
    expect(dagnodeF.outgoing_deps).toStrictEqual({});
    expect(dagnodeF.incoming_deps).toStrictEqual({
        BF: [new VarDAGNodeDep('BF', dagnodeB, dagnodeF)]
    });

    expect(dagnodeG.hasIncoming).toStrictEqual(true);
    expect(dagnodeG.hasOutgoing).toStrictEqual(false);
    expect(dagnodeG.var_data).toStrictEqual(var_data_G);
    expect(dagnodeG.var_dag).toStrictEqual(dag);
    expect(dagnodeG.outgoing_deps).toStrictEqual({});
    expect(dagnodeG.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', dagnodeC, dagnodeG)]
    });

    expect(dagnodeH.hasIncoming).toStrictEqual(true);
    expect(dagnodeH.hasOutgoing).toStrictEqual(false);
    expect(dagnodeH.var_data).toStrictEqual(var_data_H);
    expect(dagnodeH.var_dag).toStrictEqual(dag);
    expect(dagnodeH.outgoing_deps).toStrictEqual({});
    expect(dagnodeH.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', dagnodeC, dagnodeH)]
    });

    dagnodeE.unlinkFromDAG();

    expect(dag.nb_nodes).toStrictEqual(6);
    expect(dag.nodes).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA,
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_C_index()]: dagnodeC,
        [FakeTriangularValidDataHandler.get_expected_var_data_F_index()]: dagnodeF,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.leafs).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_F_index()]: dagnodeF,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.roots).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA
    });

    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(true);
    expect(dagnodeA.var_dag).toStrictEqual(dag);
    expect(dagnodeA.outgoing_deps).toStrictEqual({
        AB: new VarDAGNodeDep('AB', dagnodeA, dagnodeB),
        AC: new VarDAGNodeDep('AC', dagnodeA, dagnodeC)
    });
    expect(dagnodeA.incoming_deps).toStrictEqual({});

    expect(dagnodeB.hasIncoming).toStrictEqual(true);
    expect(dagnodeB.hasOutgoing).toStrictEqual(true);
    expect(dagnodeB.var_dag).toStrictEqual(dag);
    expect(dagnodeB.outgoing_deps).toStrictEqual({
        BF: new VarDAGNodeDep('BF', dagnodeB, dagnodeF)
    });
    expect(dagnodeB.incoming_deps).toStrictEqual({
        AB: [new VarDAGNodeDep('AB', dagnodeA, dagnodeB)]
    });

    expect(dagnodeC.hasIncoming).toStrictEqual(true);
    expect(dagnodeC.hasOutgoing).toStrictEqual(true);
    expect(dagnodeC.var_dag).toStrictEqual(dag);
    expect(dagnodeC.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', dagnodeC, dagnodeG),
        CH: new VarDAGNodeDep('CH', dagnodeC, dagnodeH)
    });
    expect(dagnodeC.incoming_deps).toStrictEqual({
        AC: [new VarDAGNodeDep('AC', dagnodeA, dagnodeC)]
    });

    expect(dagnodeE.hasIncoming).toStrictEqual(false);
    expect(dagnodeE.hasOutgoing).toStrictEqual(false);
    expect(dagnodeE.var_dag).toBeNull();
    expect(dagnodeE.outgoing_deps).toBeUndefined();
    expect(dagnodeE.incoming_deps).toBeUndefined();

    expect(dagnodeF.hasIncoming).toStrictEqual(true);
    expect(dagnodeF.hasOutgoing).toStrictEqual(false);
    expect(dagnodeF.var_dag).toStrictEqual(dag);
    expect(dagnodeF.outgoing_deps).toStrictEqual({});
    expect(dagnodeF.incoming_deps).toStrictEqual({
        BF: [new VarDAGNodeDep('BF', dagnodeB, dagnodeF)]
    });

    expect(dagnodeG.hasIncoming).toStrictEqual(true);
    expect(dagnodeG.hasOutgoing).toStrictEqual(false);
    expect(dagnodeG.var_dag).toStrictEqual(dag);
    expect(dagnodeG.outgoing_deps).toStrictEqual({});
    expect(dagnodeG.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', dagnodeC, dagnodeG)]
    });

    expect(dagnodeH.hasIncoming).toStrictEqual(true);
    expect(dagnodeH.hasOutgoing).toStrictEqual(false);
    expect(dagnodeH.var_dag).toStrictEqual(dag);
    expect(dagnodeH.outgoing_deps).toStrictEqual({});
    expect(dagnodeH.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', dagnodeC, dagnodeH)]
    });

    dagnodeF.unlinkFromDAG();

    expect(dag.nb_nodes).toStrictEqual(5);
    expect(dag.nodes).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA,
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_C_index()]: dagnodeC,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.leafs).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.roots).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_A_index()]: dagnodeA
    });

    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(true);
    expect(dagnodeA.var_dag).toStrictEqual(dag);
    expect(dagnodeA.outgoing_deps).toStrictEqual({
        AB: new VarDAGNodeDep('AB', dagnodeA, dagnodeB),
        AC: new VarDAGNodeDep('AC', dagnodeA, dagnodeC)
    });

    expect(dagnodeB.hasIncoming).toStrictEqual(true);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.var_dag).toStrictEqual(dag);
    expect(dagnodeB.outgoing_deps).toStrictEqual({});
    expect(dagnodeB.incoming_deps).toStrictEqual({
        AB: [new VarDAGNodeDep('AB', dagnodeA, dagnodeB)]
    });

    expect(dagnodeC.hasIncoming).toStrictEqual(true);
    expect(dagnodeC.hasOutgoing).toStrictEqual(true);
    expect(dagnodeC.var_dag).toStrictEqual(dag);
    expect(dagnodeC.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', dagnodeC, dagnodeG),
        CH: new VarDAGNodeDep('CH', dagnodeC, dagnodeH)
    });
    expect(dagnodeC.incoming_deps).toStrictEqual({
        AC: [new VarDAGNodeDep('AC', dagnodeA, dagnodeC)]
    });

    expect(dagnodeE.hasIncoming).toStrictEqual(false);
    expect(dagnodeE.hasOutgoing).toStrictEqual(false);
    expect(dagnodeE.var_dag).toBeNull();
    expect(dagnodeE.outgoing_deps).toBeUndefined();
    expect(dagnodeE.incoming_deps).toBeUndefined();

    expect(dagnodeF.hasIncoming).toStrictEqual(false);
    expect(dagnodeF.hasOutgoing).toStrictEqual(false);
    expect(dagnodeF.var_dag).toBeNull();
    expect(dagnodeF.outgoing_deps).toBeUndefined();
    expect(dagnodeF.incoming_deps).toBeUndefined();

    expect(dagnodeG.hasIncoming).toStrictEqual(true);
    expect(dagnodeG.hasOutgoing).toStrictEqual(false);
    expect(dagnodeG.var_dag).toStrictEqual(dag);
    expect(dagnodeG.outgoing_deps).toStrictEqual({});
    expect(dagnodeG.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', dagnodeC, dagnodeG)]
    });

    expect(dagnodeH.hasIncoming).toStrictEqual(true);
    expect(dagnodeH.hasOutgoing).toStrictEqual(false);
    expect(dagnodeH.var_dag).toStrictEqual(dag);
    expect(dagnodeH.outgoing_deps).toStrictEqual({});
    expect(dagnodeH.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', dagnodeC, dagnodeH)]
    });

    dagnodeA.unlinkFromDAG();

    expect(dag.nb_nodes).toStrictEqual(4);
    expect(dag.nodes).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_C_index()]: dagnodeC,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.leafs).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_G_index()]: dagnodeG,
        [FakeTriangularValidDataHandler.get_expected_var_data_H_index()]: dagnodeH
    });
    expect(dag.roots).toStrictEqual({
        [FakeTriangularValidDataHandler.get_expected_var_data_B_index()]: dagnodeB,
        [FakeTriangularValidDataHandler.get_expected_var_data_C_index()]: dagnodeC
    });

    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(false);
    expect(dagnodeA.var_dag).toBeNull();
    expect(dagnodeA.outgoing_deps).toBeUndefined();
    expect(dagnodeA.incoming_deps).toBeUndefined();

    expect(dagnodeB.hasIncoming).toStrictEqual(false);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.var_dag).toStrictEqual(dag);
    expect(dagnodeB.outgoing_deps).toStrictEqual({});
    expect(dagnodeB.incoming_deps).toStrictEqual({});

    expect(dagnodeC.hasIncoming).toStrictEqual(false);
    expect(dagnodeC.hasOutgoing).toStrictEqual(true);
    expect(dagnodeC.var_dag).toStrictEqual(dag);
    expect(dagnodeC.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', dagnodeC, dagnodeG),
        CH: new VarDAGNodeDep('CH', dagnodeC, dagnodeH)
    });
    expect(dagnodeC.incoming_deps).toStrictEqual({});

    expect(dagnodeE.hasIncoming).toStrictEqual(false);
    expect(dagnodeE.hasOutgoing).toStrictEqual(false);
    expect(dagnodeE.var_dag).toBeNull();
    expect(dagnodeE.outgoing_deps).toBeUndefined();
    expect(dagnodeE.incoming_deps).toBeUndefined();

    expect(dagnodeF.hasIncoming).toStrictEqual(false);
    expect(dagnodeF.hasOutgoing).toStrictEqual(false);
    expect(dagnodeF.var_dag).toBeNull();
    expect(dagnodeF.outgoing_deps).toBeUndefined();
    expect(dagnodeF.incoming_deps).toBeUndefined();

    expect(dagnodeG.hasIncoming).toStrictEqual(true);
    expect(dagnodeG.hasOutgoing).toStrictEqual(false);
    expect(dagnodeG.var_dag).toStrictEqual(dag);
    expect(dagnodeG.outgoing_deps).toStrictEqual({});
    expect(dagnodeG.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', dagnodeC, dagnodeG)]
    });

    expect(dagnodeH.hasIncoming).toStrictEqual(true);
    expect(dagnodeH.hasOutgoing).toStrictEqual(false);
    expect(dagnodeH.var_dag).toStrictEqual(dag);
    expect(dagnodeH.outgoing_deps).toStrictEqual({});
    expect(dagnodeH.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', dagnodeC, dagnodeH)]
    });
});

test('DAG: test add nodes', async () => {

    await FakeVarsInit.initAll();

    let dag: VarDAG = new VarDAG();

    let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    expect(dagnodeA.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeA.aggregated_datas).toStrictEqual({});
    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(false);
    expect(dagnodeA.incoming_deps).toStrictEqual({});
    expect(dagnodeA.is_aggregator).toStrictEqual(false);
    expect(dagnodeA.outgoing_deps).toStrictEqual({});
    expect(dagnodeA.var_data).toStrictEqual(var_data_A);
    expect(dagnodeA.var_dag).toStrictEqual(dag);

    expect(dag.nb_nodes).toStrictEqual(1);
    expect(dag.nodes).toStrictEqual({ "1|LmreE": dagnodeA });
    expect(dag.leafs).toStrictEqual({ "1|LmreE": dagnodeA });
    expect(dag.roots).toStrictEqual({ "1|LmreE": dagnodeA });

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, true);

    expect(dagnodeB.var_data.index).toStrictEqual("2|Lsy_M&LycR4");
    expect(dagnodeB.aggregated_datas).toStrictEqual({});
    expect(dagnodeB.hasIncoming).toStrictEqual(false);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.is_aggregator).toStrictEqual(false);
    expect(dagnodeB.incoming_deps).toStrictEqual({});
    expect(dagnodeB.outgoing_deps).toStrictEqual({});
    expect(dagnodeB.var_data).toStrictEqual(var_data_B);
    expect(dagnodeB.var_dag).toStrictEqual(dag);

    expect(dag.nb_nodes).toStrictEqual(2);
    expect(dag.nodes).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });
    expect(dag.leafs).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });
    expect(dag.roots).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });

    let dagnodeA_bis: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    expect(dagnodeA_bis).toStrictEqual(dagnodeA);

    expect(dag.nb_nodes).toStrictEqual(2);
    expect(dag.nodes).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });
    expect(dag.leafs).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });
    expect(dag.roots).toStrictEqual({ "1|LmreE": dagnodeA, "2|Lsy_M&LycR4": dagnodeB });
});

test('DAG: test add deps', async () => {
    await FakeVarsInit.initAll();

    let dag: VarDAG = new VarDAG();

    let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();

    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();

    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, true);

    expect(dag.nb_nodes).toStrictEqual(2);
    expect(dag.nodes).toStrictEqual({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
    expect(dag.leafs).toStrictEqual({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
    expect(dag.roots).toStrictEqual({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });

    expect(dagnodeB.var_data.index).toStrictEqual("2|Lsy_M&LycR4");
    expect(dagnodeB.aggregated_datas).toStrictEqual({});
    expect(dagnodeB.is_aggregator).toStrictEqual(false);
    expect(dagnodeB.hasIncoming).toStrictEqual(false);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.incoming_deps).toStrictEqual({});
    expect(dagnodeB.outgoing_deps).toStrictEqual({});

    expect(dagnodeA.var_data.index).toStrictEqual("1|LmreE");
    expect(dagnodeA.aggregated_datas).toStrictEqual({});
    expect(dagnodeA.is_aggregator).toStrictEqual(false);
    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(false);
    expect(dagnodeA.incoming_deps).toStrictEqual({});
    expect(dagnodeA.outgoing_deps).toStrictEqual({});

    dagnodeA.addOutgoingDep("AB", dagnodeB);

    let dep_ab = {
        incoming_node: dagnodeA,
        outgoing_node: dagnodeB,
        dep_name: "AB"
    } as DAGNodeDep<VarDAGNode>;

    expect(dag.nb_nodes).toStrictEqual(2);
    expect(dag.nodes).toStrictEqual({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
    expect(dag.leafs).toStrictEqual({ [var_data_B.index]: dagnodeB });
    expect(dag.roots).toStrictEqual({ [var_data_A.index]: dagnodeA });

    expect(dagnodeB.aggregated_datas).toStrictEqual({});
    expect(dagnodeB.is_aggregator).toStrictEqual(false);
    expect(dagnodeB.hasIncoming).toStrictEqual(true);
    expect(dagnodeB.hasOutgoing).toStrictEqual(false);
    expect(dagnodeB.incoming_deps["AB"][0].dep_name).toStrictEqual(dep_ab.dep_name);
    expect((dagnodeB.incoming_deps["AB"][0].incoming_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeA.var_data._bdd_only_index);
    expect((dagnodeB.incoming_deps["AB"][0].outgoing_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeB.var_data._bdd_only_index);
    expect(dagnodeB.outgoing_deps).toStrictEqual({});

    expect(dagnodeA.aggregated_datas).toStrictEqual({});
    expect(dagnodeA.is_aggregator).toStrictEqual(false);
    expect(dagnodeA.hasIncoming).toStrictEqual(false);
    expect(dagnodeA.hasOutgoing).toStrictEqual(true);
    expect(dagnodeA.outgoing_deps["AB"].dep_name).toStrictEqual(dep_ab.dep_name);
    expect((dagnodeA.outgoing_deps["AB"].incoming_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeA.var_data._bdd_only_index);
    expect((dagnodeA.outgoing_deps["AB"].outgoing_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeB.var_data._bdd_only_index);
    expect(dagnodeA.incoming_deps).toStrictEqual({});
});

test('DAG: test visit bottom->up to node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up to node B => [E, F, B]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_to_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_E_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index()
    );
});

test('DAG: test visit top->bottom from node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom from node B => [B, E, F]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_from_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_E_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index()
    );
});

test('DAG: test visit bottom->up from node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up from node B => [B, A]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_from_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_A_index()
    );
});

test('DAG: test visit top->bottom to node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom to node B => [A, B]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_to_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_A_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index()
    );
});

test('DAG: test visit bottom->up through node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up through node B => [E, F, B, A]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_through_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_E_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_A_index()
    );
});

test('DAG: test visit top->bottom through node', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom through node B => [A, B, E, F]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_through_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_A_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_E_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index()
    );
});





test('DAG: test visit bottom->up to node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'E')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up to node B => [F, B]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_to_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_to_node(
        node_b,
        async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_F_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index()
    );
});

test('DAG: test visit top->bottom from node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'E')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom from node B => [B, F]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_from_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_from_node(
        node_b,
        async (node: VarDAGNode) => {
            visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index);
        },
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index()
    );
});

test('DAG: test visit bottom->up from node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'A')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up from node B => [B]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_from_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_from_node(
        node_b,
        async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_A_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_B_index()
    );
});

test('DAG: test visit top->bottom to node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'A')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom to node B => [A, B]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_to_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_to_node(
        node_b,
        async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_A_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_B_index()
    );
});

test('DAG: test visit bottom->up through node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'E')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up through node B => [F, B, A]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_bottom_up_through_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_bottom_up_through_node(
        node_b,
        async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_F_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_A_index()
    );
});

test('DAG: test visit top->bottom through node with condition', async () => {
    await FakeVarsInit.initAll();

    /**
     * exemple : (condition != 'E')
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom through node B => [A, B, F]
     */

    let dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

    let visit_res: string = null;

    await DAGController.visit_top_bottom_through_node(null, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));
    expect(visit_res).toBeNull();

    await DAGController.visit_top_bottom_through_node(
        node_b,
        async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
        (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
    );

    expect(visit_res).toStrictEqual(
        FakeDataHandler.get_expected_var_data_A_index() + ',' +
        FakeDataHandler.get_expected_var_data_B_index() + ',' +
        FakeDataHandler.get_expected_var_data_F_index()
    );
});
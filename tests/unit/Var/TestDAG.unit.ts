/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import DAGController from '../../../src/shared/modules/Var/graph/dagbase/DAGController';
import DAGNodeDep from '../../../src/shared/modules/Var/graph/dagbase/DAGNodeDep';
import VarDAGNode from '../../../src/shared/modules/Var/graph/VarDAGNode';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';
import VarDAG from '../../../src/shared/modules/Var/graph/VarDAG';
import VarsComputeController from '../../../src/server/modules/Var/VarsComputeController';
import FakeVarsInit from './fakes/FakeVarsInit';

test('DAG: test add nodes', async () => {

    await FakeVarsInit.initAll();

    let dag: VarDAG = new VarDAG();

    let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, VarsComputeController, true);

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
    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, VarsComputeController, true);

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

    let dagnodeA_bis: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, VarsComputeController, true);

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

    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, VarsComputeController, true);

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();

    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, VarsComputeController, true);

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
    expect(dagnodeB.incoming_deps["AB"].dep_name).toStrictEqual(dep_ab.dep_name);
    expect((dagnodeB.incoming_deps["AB"].incoming_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeA.var_data._bdd_only_index);
    expect((dagnodeB.incoming_deps["AB"].outgoing_node as VarDAGNode).var_data._bdd_only_index).toStrictEqual(dagnodeB.var_data._bdd_only_index);
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
    await DAGController.getInstance().visit_bottom_up_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_top_bottom_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_bottom_up_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_top_bottom_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_bottom_up_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_top_bottom_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

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
    await DAGController.getInstance().visit_bottom_up_to_node(
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
    await DAGController.getInstance().visit_top_bottom_from_node(
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
    await DAGController.getInstance().visit_bottom_up_from_node(
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
    await DAGController.getInstance().visit_top_bottom_to_node(
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
    await DAGController.getInstance().visit_bottom_up_through_node(
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
    await DAGController.getInstance().visit_top_bottom_through_node(
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
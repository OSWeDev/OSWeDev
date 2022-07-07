/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import DAGNodeDep from '../../../shared/modules/Var/graph/dagbase/DAGNodeDep';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';

describe('DAG', () => {

    it('test add nodes', async () => {
        FakeDataHandler.initializeFakeDataVO();

        let dag: VarDAG = new VarDAG(null);

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        expect(dagnodeA.var_data.index).to.equal("1_[[1577836800,1577923200)]");
        expect(dagnodeA.aggregated_datas).to.deep.equal({});
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming_deps).to.deep.equal({});
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.outgoing_deps).to.deep.equal({});
        expect(dagnodeA.var_data).to.deep.equal(var_data_A);
        expect(dagnodeA.dag).to.deep.equal(dag);

        expect(dag.nb_nodes).to.equal(1);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA });

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B);

        expect(dagnodeB.var_data.index).to.equal("2_[[1580515200,1583020800)]");
        expect(dagnodeB.aggregated_datas).to.deep.equal({});
        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.incoming_deps).to.deep.equal({});
        expect(dagnodeB.outgoing_deps).to.deep.equal({});
        expect(dagnodeB.var_data).to.deep.equal(var_data_B);
        expect(dagnodeB.dag).to.deep.equal(dag);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });

        let dagnodeA_bis: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        expect(dagnodeA_bis).to.equal(dagnodeA);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800,1577923200)]": dagnodeA, "2_[[1580515200,1583020800)]": dagnodeB });
    });

    it('test add deps', async () => {
        FakeDataHandler.initializeFakeDataVO();

        let dag: VarDAG = new VarDAG(null);

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();

        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();

        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.leafs).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.roots).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });

        expect(dagnodeB.var_data.index).to.equal("2_[[1580515200,1583020800)]");
        expect(dagnodeB.aggregated_datas).to.deep.equal({});
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming_deps).to.deep.equal({});
        expect(dagnodeB.outgoing_deps).to.deep.equal({});

        expect(dagnodeA.var_data.index).to.equal("1_[[1577836800,1577923200)]");
        expect(dagnodeA.aggregated_datas).to.deep.equal({});
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming_deps).to.deep.equal({});
        expect(dagnodeA.outgoing_deps).to.deep.equal({});

        dagnodeA.addOutgoingDep("AB", dagnodeB);

        let dep_ab = {
            incoming_node: dagnodeA,
            outgoing_node: dagnodeB,
            dep_name: "AB"
        } as DAGNodeDep<VarDAGNode>;

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.leafs).to.deep.equal({ [var_data_B.index]: dagnodeB });
        expect(dag.roots).to.deep.equal({ [var_data_A.index]: dagnodeA });

        expect(dagnodeB.aggregated_datas).to.deep.equal({});
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.hasIncoming).to.equal(true);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming_deps).to.deep.equal({ AB: dep_ab });
        expect(dagnodeB.outgoing_deps).to.deep.equal({});

        expect(dagnodeA.aggregated_datas).to.deep.equal({});
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(true);
        expect(dagnodeA.outgoing_deps).to.deep.equal({ AB: dep_ab });
        expect(dagnodeA.incoming_deps).to.deep.equal({});
    });

    it('test visit bottom->up to node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_E_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index()
        );
    });

    it('test visit top->bottom from node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_E_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index()
        );
    });

    it('test visit bottom->up from node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_from_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_A_index()
        );
    });

    it('test visit top->bottom to node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_to_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_A_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index()
        );
    });

    it('test visit bottom->up through node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_E_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_A_index()
        );
    });

    it('test visit top->bottom through node', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_through_node(node_b, async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index));

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_A_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_E_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index()
        );
    });





    it('test visit bottom->up to node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_to_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_F_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index()
        );
    });

    it('test visit top->bottom from node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_from_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index()
        );
    });

    it('test visit bottom->up from node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_from_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_A_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_B_index()
        );
    });

    it('test visit top->bottom to node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_to_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_A_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_B_index()
        );
    });

    it('test visit bottom->up through node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_bottom_up_through_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_F_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_A_index()
        );
    });

    it('test visit top->bottom through node with condition', async () => {
        FakeDataHandler.initializeFakeDataVO();

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

        let dag: VarDAG = FakeDataHandler.get_fake_triangular_dag();
        let node_b = dag.nodes[FakeDataHandler.get_expected_var_data_B_index()];

        let visit_res: string = null;
        await DAGController.getInstance().visit_top_bottom_through_node(
            node_b,
            async (node: VarDAGNode) => visit_res = (visit_res ? visit_res + ',' + node.var_data.index : node.var_data.index),
            (node: VarDAGNode) => node.var_data.index != FakeDataHandler.get_expected_var_data_E_index()
        );

        expect(visit_res).to.equal(
            FakeDataHandler.get_expected_var_data_A_index() + ',' +
            FakeDataHandler.get_expected_var_data_B_index() + ',' +
            FakeDataHandler.get_expected_var_data_F_index()
        );
    });
});
import { expect } from 'chai';
import 'mocha';
import DAG from '../../../shared/modules/Var/graph/dag/DAG';
import DAGNode from '../../../shared/modules/Var/graph/dag/DAGNode';

describe('DAG', () => {

    it('test add nodes', async () => {

        let dag: DAG<DAGNode> = new DAG();

        let dagnodeA: DAGNode = DAGNode.getInstance("A", dag);

        expect(dagnodeA.name).to.equal("A");
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming).to.deep.equal({});
        expect(dagnodeA.outgoing).to.deep.equal({});
        expect(dagnodeA.incomingNames).to.deep.equal([]);
        expect(dagnodeA.dag).to.deep.equal(dag);
        expect(dagnodeA.outgoingNames).to.deep.equal([]);
        expect(dagnodeA.marked_for_deletion).to.equal(false);
        expect(dagnodeA.outgoingDepIds).to.deep.equal([]);
        expect(dagnodeA.value).to.equal(null);

        expect(dag.nodes_names.length).to.equal(1);
        expect(dag.nodes).to.deep.equal({ A: dagnodeA });
        expect(dag.leafs).to.deep.equal({ A: dagnodeA });
        expect(dag.roots).to.deep.equal({ A: dagnodeA });

        let dagnodeB: DAGNode = DAGNode.getInstance("B", dag);

        expect(dagnodeB.name).to.equal("B");
        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming).to.deep.equal({});
        expect(dagnodeB.outgoing).to.deep.equal({});
        expect(dagnodeB.incomingNames).to.deep.equal([]);
        expect(dagnodeB.dag).to.deep.equal(dag);
        expect(dagnodeB.outgoingNames).to.deep.equal([]);
        expect(dagnodeB.marked_for_deletion).to.equal(false);
        expect(dagnodeB.outgoingDepIds).to.deep.equal([]);
        expect(dagnodeB.value).to.equal(null);

        expect(dag.nodes_names.length).to.equal(2);
        expect(dag.nodes).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.leafs).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.roots).to.deep.equal({ A: dagnodeA, B: dagnodeB });

        let dagnodeA_bis: DAGNode = DAGNode.getInstance("A", dag);

        expect(dagnodeA_bis).to.equal(dagnodeA);

        expect(dag.nodes_names.length).to.equal(2);
        expect(dag.nodes).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.leafs).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.roots).to.deep.equal({ A: dagnodeA, B: dagnodeB });
    });

    it('test add edges', async () => {
        let dag: DAG<DAGNode> = new DAG();

        let dagnodeA: DAGNode = DAGNode.getInstance("A", dag);
        let dagnodeB: DAGNode = DAGNode.getInstance("B", dag);

        expect(dag.nodes_names.length).to.equal(2);
        expect(dag.nodes).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.leafs).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.roots).to.deep.equal({ A: dagnodeA, B: dagnodeB });

        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming).to.deep.equal({});
        expect(dagnodeB.outgoing).to.deep.equal({});
        expect(dagnodeB.incomingNames).to.deep.equal([]);
        expect(dagnodeB.outgoingNames).to.deep.equal([]);
        expect(dagnodeB.outgoingDepIds).to.deep.equal([]);

        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming).to.deep.equal({});
        expect(dagnodeA.outgoing).to.deep.equal({});
        expect(dagnodeA.incomingNames).to.deep.equal([]);
        expect(dagnodeA.outgoingNames).to.deep.equal([]);
        expect(dagnodeA.outgoingDepIds).to.deep.equal([]);

        dag.addEdge("A", "B", "AB");

        expect(dag.nodes_names.length).to.equal(2);
        expect(dag.nodes).to.deep.equal({ A: dagnodeA, B: dagnodeB });
        expect(dag.leafs).to.deep.equal({ B: dagnodeB });
        expect(dag.roots).to.deep.equal({ A: dagnodeA });

        expect(dagnodeB.hasIncoming).to.equal(true);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming).to.deep.equal({ A: dagnodeA });
        expect(dagnodeB.outgoing).to.deep.equal({});
        expect(dagnodeB.incomingNames).to.deep.equal(["A"]);
        expect(dagnodeB.outgoingNames).to.deep.equal([]);
        expect(dagnodeB.outgoingDepIds).to.deep.equal([]);

        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(true);
        expect(dagnodeA.incoming).to.deep.equal({});
        expect(dagnodeA.outgoing).to.deep.equal({ B: dagnodeB });
        expect(dagnodeA.incomingNames).to.deep.equal([]);
        expect(dagnodeA.outgoingNames).to.deep.equal(["B"]);
        expect(dagnodeA.outgoingDepIds).to.deep.equal([AB: dagnodeB]);
    });

    it('test remove nodes', async () => { });

    it('test visit bottom->up to node', async () => {
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
    });

    it('test visit top->bottom from node', async () => {
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
    });

    it('test visit bottom->up from node', async () => {
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
    });

    it('test visit top->bottom to node', async () => {
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

    });

    it('test visit bottom->up throught node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * bottom->up throught node B => [E, F, B, A]
         */
    });

    it('test visit top->bottom throught node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * top->bottom throught node B => [A, B, E, F]
         */

    });
});

// import SimpleVarConfVO from '../../../shared/modules/Var/simple_vars/SimpleVarConfVO';
// import VarsController from '../../../shared/modules/Var/VarsController';
// import FakeVarController from './fakes/FakeVarController';
// import FakeVarDAGVisitorEmpty from './fakes/FakeVarDAGVisitorEmpty';
// import FakeDataVO from './fakes/vos/FakeDataVO';
// import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
// import VarDataBaseVO from '../../../shared/modules/Var/params/VarDataBaseVO';

// let varConf: SimpleVarConfVO = new SimpleVarConfVO();
// varConf.id = 1;
// varConf.name = "varConf";
// varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;

// let index1: string = "1_20190101_1_1";
// let index2: string = "1_20190102_1_1";
// let index3: string = "1_20190103_1_1";
// let index4: string = "1_20190104_1_1";
// let index5: string = "1_20190105_1_1";

// let node_param1: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
// let node_param2: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
// let node_param3: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
// let node_param4: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
// let node_param5: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);

// function getTestDag_simple_linear(marker: string, index_root: string = null): VarDAG {
//     let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);
//     let node1 = dag.add(index1, node_param1);
//     if ((!index_root) || (index_root == index1)) {
//         node1.addMarker(marker, dag);
//     }

//     let node2 = dag.add(index2, node_param2);
//     if ((!index_root) || (index_root == index2)) {
//         node2.addMarker(marker, dag);
//     }

//     let node3 = dag.add(index3, node_param3);
//     if ((!index_root) || (index_root == index3)) {
//         node3.addMarker(marker, dag);
//     }

//     dag.addEdge(index3, index2);
//     dag.addEdge(index2, index1);

//     return dag;
// }


// function getTestDag_simple_branches(marker: string, index_root: string = null): VarDAG {
//     let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);
//     let node1 = dag.add(index1, node_param1);
//     if ((!index_root) || (index_root == index1)) {
//         node1.addMarker(marker, dag);
//     }

//     let node2 = dag.add(index2, node_param2);
//     if ((!index_root) || (index_root == index2)) {
//         node2.addMarker(marker, dag);
//     }

//     let node3 = dag.add(index3, node_param3);
//     if ((!index_root) || (index_root == index3)) {
//         node3.addMarker(marker, dag);
//     }

//     let node4 = dag.add(index4, node_param4);
//     if ((!index_root) || (index_root == index4)) {
//         node3.addMarker(marker, dag);
//     }

//     let node5 = dag.add(index5, node_param5);
//     if ((!index_root) || (index_root == index5)) {
//         node3.addMarker(marker, dag);
//     }

//     dag.addEdge(index1, index2);
//     dag.addEdge(index2, index3);
//     dag.addEdge(index2, index4);
//     dag.addEdge(index2, index5);

//     return dag;
// }


// describe('DAGController', () => {


//     it('test deletedNode linear propagation not_registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.deletedNode(index2, () => true);

//         expect(dag.nodes_names).to.deep.equal([index3]);
//     });

//     it('test deletedNode linear no_propagation not_registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.deletedNode(index2, () => false);

//         expect(dag.nodes_names).to.deep.equal([index3]);
//     });


//     it('test deletedNode linear propagation registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.nodes[index2].addMarker(VarDAG.VARDAG_MARKER_REGISTERED, dag);
//         dag.deletedNode(index2, () => true);

//         expect(dag.nodes_names).to.deep.equal([index3]);
//     });

//     it('test deletedNode linear no_propagation registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.nodes[index1].addMarker(VarDAG.VARDAG_MARKER_REGISTERED, dag);
//         dag.deletedNode(index2, () => false);

//         expect(dag.nodes_names).to.deep.equal([index1, index3]);
//     });


//     it('test deletedNode branches propagation not_registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_branches(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.deletedNode(index2, () => true);

//         expect(dag.nodes_names).to.deep.equal([index1]);
//     });

//     it('test deletedNode branches no_propagation not_registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_branches(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.deletedNode(index2, () => false);

//         expect(dag.nodes_names).to.deep.equal([index1]);
//         expect(dag.nodes_names).to.deep.equal([index1]);
//     });

//     it('test deletedNode branches propagation registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_branches(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.nodes[index3].addMarker(VarDAG.VARDAG_MARKER_REGISTERED, dag);
//         dag.deletedNode(index2, () => true);

//         expect(dag.nodes_names).to.deep.equal([index1]);
//     });

//     it('test deletedNode branches no_propagation registered', async () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let dag = getTestDag_simple_branches(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);

//         dag.nodes[index3].addMarker(VarDAG.VARDAG_MARKER_REGISTERED, dag);
//         dag.deletedNode(index2, () => false);

//         expect(dag.nodes_names).to.deep.equal([index1, index3]);
//     });


//     // it('visit_dag - simple_linear empty allroots true true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots true true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots true false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots true false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots false true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots false true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots false false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear empty allroots false false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorEmpty(),

//     //         FakeVarDAGVisitorEmpty.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorEmpty.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorEmpty.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });





//     // it('visit_dag - simple_linear simplemarker allroots true true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots true true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots true false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots true false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots false true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots false true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots false false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker allroots false false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });


//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });



//     // it('visit_dag - simple_linear simplemarker index1root true true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root true true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root true false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root true false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         true,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index3].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root false true true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root false true false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         true,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root false false true nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         true,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });

//     // it('visit_dag - simple_linear simplemarker index1root false false false nowait passthrough visit', async () => {

//     //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//     //     let dag = getTestDag_simple_linear(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, index1);
//     //     let initial_dag = cloneDeep(dag);

//     //     await DAGController.getInstance().visit_dag(
//     //         dag,
//     //         new FakeVarDAGVisitorSimpleMarker(),

//     //         FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker,
//     //         FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker,

//     //         false,
//     //         false,
//     //         false,

//     //         (node: VarDAGNode) => true,
//     //         (node: VarDAGNode) => true,

//     //         (node: VarDAGNode) => false,
//     //         async (vardag: VarDAG, node_names: string[]) => { });

//     //     let test_result: VarDAG = cloneDeep(initial_dag);

//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index1].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);
//     //     test_result.nodes[index1].removeMarker(FakeVarDAGVisitorSimpleMarker.MARKER_to_visit_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, test_result);
//     //     test_result.nodes[index2].addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visited_node_marker, test_result);

//     //     expect(dag).to.deep.equal(test_result);
//     // });
// });
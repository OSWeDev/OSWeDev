// import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
// import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
// APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
// import { expect } from 'chai';
// import 'mocha';
// import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
// import VarDAG from '../../../src/shared/modules/Var/graph/var/VarDAG';
// import VarDAGNode from '../../../src/shared/modules/Var/graph/var/VarDAGNode';
// import VarDAGDefineNodeDeps from '../../../src/shared/modules/Var/graph/var/visitors/VarDAGDefineNodeDeps';
// import IVarDataVOBase from '../../../src/shared/modules/Var/interfaces/IVarDataVOBase';
// import VarDataBaseVO from '../../../src/shared/modules/Var/params/VarDataBaseVO';
// import SimpleVarConfVO from '../../../src/shared/modules/Var/simple_vars/SimpleVarConfVO';
// import VarsController from '../../../src/shared/modules/Var/VarsController';
// import RangeHandler from '../../../src/shared/tools/RangeHandler';
// import FakeVarController from '../Var/fakes/FakeVarController';
// import FakeDataVO from '../Var/fakes/vos/FakeDataVO';
// import moment from 'moment';

// describe('VarDAGDefineNodeDeps', () => {

//     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
//     varConf.id = 1;
//     varConf.name = "varConf";
//     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


//     it('test clear_node_deps', () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         VarDAGDefineNodeDeps.clear_node_deps(null, null);

//         let index1: string = "1_20190101_1_1";
//         let index2: string = "1_20190102_1_1";
//         let index3: string = "1_20190103_1_1";

//         let node_param1: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
//         let node_param2: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
//         let node_param3: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);

//         let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);
//         let node = dag.add(index1, node_param1);

//         /**
//          * TODO FIXME : VarDAG tests indépendants de clear_node_deps
//          */
//         expect(dag.nodes_names.length).toStrictEqual(1);
//         expect(dag.nodes_names).toStrictEqual([index1]);
//         expect(dag.roots).toStrictEqual({
//             [index1]: node
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index1]: node
//         });
//         expect(node.outgoingNames.length).toStrictEqual(0);
//         expect(node.incomingNames.length).toStrictEqual(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node, dag);
//         expect(dag.nodes_names.length).toStrictEqual(1);
//         expect(dag.nodes_names).toStrictEqual([index1]);
//         expect(dag.roots).toStrictEqual({
//             [index1]: node
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index1]: node
//         });
//         expect(node.outgoingNames.length).toStrictEqual(0);
//         expect(node.incomingNames.length).toStrictEqual(0);

//         dag.deletedNode(node.name, () => true);

//         expect(dag.nodes_names.length).toStrictEqual(0);
//         expect(dag.nodes_names).toStrictEqual([]);
//         expect(dag.roots).toStrictEqual({});
//         expect(dag.leafs).toStrictEqual({});

//         VarDAGDefineNodeDeps.clear_node_deps(node, dag);

//         expect(dag.nodes_names.length).toStrictEqual(0);
//         expect(dag.nodes_names).toStrictEqual([]);
//         expect(dag.roots).toStrictEqual({});
//         expect(dag.leafs).toStrictEqual({});

//         let node1 = dag.add(index1, node_param1);
//         let node2 = dag.add(index2, node_param2);
//         let node3 = dag.add(index3, node_param3);

//         dag.addEdge(node3.name, node2.name);
//         dag.addEdge(node2.name, node1.name);

//         expect(dag.nodes_names.length).toStrictEqual(3);
//         expect(dag.nodes_names).toStrictEqual([index1, index2, index3]);
//         expect(dag.roots).toStrictEqual({
//             [index3]: node3
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index1]: node1
//         });
//         expect(node1.outgoingNames.length).toStrictEqual(0);
//         expect(node1.incomingNames.length).toStrictEqual(1);

//         expect(node2.outgoingNames.length).toStrictEqual(1);
//         expect(node2.incomingNames.length).toStrictEqual(1);

//         expect(node3.outgoingNames.length).toStrictEqual(1);
//         expect(node3.incomingNames.length).toStrictEqual(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node2, dag);

//         expect(dag.nodes_names.length).toStrictEqual(2);
//         expect(dag.nodes_names).toStrictEqual([index2, index3]);
//         expect(dag.roots).toStrictEqual({
//             [index3]: node3
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index2]: node2
//         });

//         expect(node2.outgoingNames.length).toStrictEqual(0);
//         expect(node2.incomingNames.length).toStrictEqual(1);

//         expect(node3.outgoingNames.length).toStrictEqual(1);
//         expect(node3.incomingNames.length).toStrictEqual(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node3, dag);

//         expect(dag.nodes_names.length).toStrictEqual(1);
//         expect(dag.nodes_names).toStrictEqual([index3]);
//         expect(dag.roots).toStrictEqual({
//             [index3]: node3
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index3]: node3
//         });
//         expect(node3.outgoingNames.length).toStrictEqual(0);
//         expect(node3.incomingNames.length).toStrictEqual(0);

//         dag.deletedNode(node3.name, () => true);


//         node1 = dag.add(index1, node_param1);
//         node2 = dag.add(index2, node_param2);
//         node3 = dag.add(index3, node_param3);

//         dag.addEdge(node3.name, node2.name);
//         dag.addEdge(node2.name, node1.name);

//         expect(dag.nodes_names.length).toStrictEqual(3);
//         expect(dag.nodes_names).toStrictEqual([index1, index2, index3]);
//         expect(dag.roots).toStrictEqual({
//             [index3]: node3
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index1]: node1
//         });
//         expect(node1.outgoingNames.length).toStrictEqual(0);
//         expect(node1.incomingNames.length).toStrictEqual(1);

//         expect(node2.outgoingNames.length).toStrictEqual(1);
//         expect(node2.incomingNames.length).toStrictEqual(1);

//         expect(node3.outgoingNames.length).toStrictEqual(1);
//         expect(node3.incomingNames.length).toStrictEqual(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node3, dag);

//         expect(dag.nodes_names.length).toStrictEqual(1);
//         expect(dag.nodes_names).toStrictEqual([index3]);
//         expect(dag.roots).toStrictEqual({
//             [index3]: node3
//         });
//         expect(dag.leafs).toStrictEqual({
//             [index3]: node3
//         });
//         expect(node3.outgoingNames.length).toStrictEqual(0);
//         expect(node3.incomingNames.length).toStrictEqual(0);
//     });

//     it('test add_node_deps', () => {

//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let index1: string = "1_2019-01-01_1_1";
//         let index2: string = "1_2019-01-02_1_1";
//         let index3: string = "1_2019-01-03_1_1";

//         VarDAGDefineNodeDeps.add_node_deps(null, null, null, null);

//         let param1: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.create_single_elt_TSRange(moment("2019-01-01").utc(true), TimeSegment.TYPE_DAY)]);
//         let param2: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.create_single_elt_TSRange(moment("2019-01-02").utc(true), TimeSegment.TYPE_DAY)]);
//         let param3: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.create_single_elt_TSRange(moment("2019-01-03").utc(true), TimeSegment.TYPE_DAY)]);

//         let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);

//         // let node1 = dag.add(index1, node_param1);
//         // let node2 = dag.add(index2, node_param2);
//         let node3 = dag.add(index3, param3);

//         let new_nodes: { [index: string]: VarDAGNode } = {};

//         VarDAGDefineNodeDeps.add_node_deps(node3, dag, [param2], new_nodes);

//         expect(new_nodes[index2].param).toStrictEqual(param2);
//         let node2 = dag.nodes[index2];

//         expect(dag.nodes_names.length).toStrictEqual(2);
//         expect(dag.nodes_names).toStrictEqual([index3, index2]);
//         expect(dag.roots[index3]).toStrictEqual(node3);
//         expect(dag.leafs[index2]).toStrictEqual(node2);
//         expect(node2.outgoingNames.length).toStrictEqual(0);
//         expect(node2.incomingNames.length).toStrictEqual(1);

//         expect(node3.outgoingNames.length).toStrictEqual(1);
//         expect(node3.incomingNames.length).toStrictEqual(0);

//         VarDAGDefineNodeDeps.add_node_deps(node2, dag, [param1], new_nodes);
//         expect(new_nodes[index1].param).toStrictEqual(param1);
//         let node1 = dag.nodes[index1];

//         expect(dag.nodes_names.length).toStrictEqual(3);
//         expect(dag.nodes_names).toStrictEqual([index3, index2, index1]);
//         expect(dag.roots[index3]).toStrictEqual(node3);
//         expect(dag.leafs[index1]).toStrictEqual(node1);
//         expect(node1.outgoingNames.length).toStrictEqual(0);
//         expect(node1.incomingNames.length).toStrictEqual(1);

//         expect(node2.outgoingNames.length).toStrictEqual(1);
//         expect(node2.incomingNames.length).toStrictEqual(1);

//         expect(node3.outgoingNames.length).toStrictEqual(1);
//         expect(node3.incomingNames.length).toStrictEqual(0);
//     });
// });
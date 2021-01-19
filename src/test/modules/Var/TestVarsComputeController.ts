// /* tslint:disable:no-unused-expression */
// import ServerAPIController from '../../../server/modules/API/ServerAPIController';
// import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
// APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

// import { expect } from 'chai';
// import 'mocha';
// import VarsComputeController from '../../../server/modules/Var/VarsComputeController';
// import MatroidController from '../../../shared/modules/Matroid/MatroidController';
// import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
// import FakeDataHandler from './fakes/FakeDataHandler';
// import FakeDataVO from './fakes/vos/FakeDataVO';

// describe('VarsComputeController', () => {

//     // compute
//     // compute_node
//     // create_tree
//     // deploy_deps
//     // get_node_deps
//     // it('test compute', async () => {

//     //     FakeDataHandler.initializeDayDataRangesVO();

//     //     /**
//     //      * E dans B
//     //      * B dans F
//     //      * C dans F et indépendant de E et B
//     //      * card C > card B
//     //      */
//     //     let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
//     //     let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
//     //     let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
//     //     let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
//     //     let selected_imports: FakeDataVO[] = [var_data_C, var_data_B];
//     //     let remaning_calcs: FakeDataVO[] = MatroidController.getInstance().matroids_cut_matroids_get_remainings([var_data_C, var_data_B], [var_data_F]);

//     //     let node_F = VarDAGNode.getInstance(new VarDAG(), var_data_F);
//     //     VarsComputeController.getInstance().aggregate_imports_and_remaining_datas(node_F, selected_imports, remaning_calcs);
//     //     expect(node_F.is_aggregator).to.equal(true);
//     //     expect(node_F.aggregated_nodes).to.deep.equal({
//     //         [var_data_C.index]: VarDAGNode.getInstance(node_F.dag, var_data_C),
//     //         [var_data_B.index]: VarDAGNode.getInstance(node_F.dag, var_data_B),
//     //         [remaning_calcs[0].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[0]),
//     //         [remaning_calcs[1].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[1]),
//     //         [remaning_calcs[2].index]: VarDAGNode.getInstance(node_F.dag, remaning_calcs[2]),
//     //     });
//     // });
// });
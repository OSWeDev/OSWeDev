/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from "playwright-test-coverage";
import ConfigurationService from '../../../src/server/env/ConfigurationService';
import DAOUpdateVOHolder from '../../../src/server/modules/DAO/vos/DAOUpdateVOHolder';
import VarsDatasVoUpdateHandler from '../../../src/server/modules/Var/VarsDatasVoUpdateHandler';
import IDistantVOBase from '../../../src/shared/modules/IDistantVOBase';
import VarDataBaseVO from '../../../src/shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeEmpDayDataHandler from './fakes/FakeEmpDayDataHandler';
import FakeEmpDistantHandler from './fakes/FakeEmpDistantHandler';
import FakeVarsInit from './fakes/FakeVarsInit';
import FakeCyclicalDataHandler from './fakes/cyclical/FakeCyclicalDataHandler';

ConsoleHandler.init();
ConfigurationService.setEnvParams({});
ConfigurationService.IS_UNIT_TEST_MODE = true;


// test('VarsDatasVoUpdateHandler: test compute_intersectors', async () => {

//     VarsController.clear_all_inits();
//     VarsServerController.clear_all_inits();

//     FakeDataHandler.initializeFakeDataVO();
//     FakeDistantHandler.initializeFakeDistantVO();
//     await FakeVarControllerDsDistant.getInstance().initialize();
//     await FakeVarControllerDsEmpDistant.getInstance().initialize();
//     await FakeVarControllerDeps.getInstance().initialize();
//     await VarsController.initializeasync({
//         [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
//         [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
//     });
//     VarsServerController.init_varcontrollers_dag();

//     let vo_types: string[] = [];
//     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
//     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
//     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
//     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
//     let markers: { [var_id: number]: number } = {};

//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: {
//             [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A()
//         },
//         [FakeVarControllerDeps.getInstance().varConf.id]: {
//             [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month()
//         }
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: {
//             [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month()
//         }
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: {
//             [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2()
//         },
//         [FakeVarControllerDeps.getInstance().varConf.id]: {
//             [FakeDepsDataHandler.get_ds_var_data_A2_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_month()
//         },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [
//         FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
//         FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     for (let i in intersectors_by_index) {
//         let es = intersectors_by_index[i];
//         for (let j in es) {
//             let e = es[j];
//             let a = e.index;
//         }
//     }
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_empday_data_A().index]: FakeDepsDataHandler.get_ds_var_empday_data_A() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() },
//     });
// });


// test('VarsDatasVoUpdateHandler: test compute_intersectors cyclical', async () => {

//     VarsController.clear_all_inits();
//     VarsServerController.clear_all_inits();

//     FakeCyclicalDataHandler.initializeFakeEmpDayDataVO();
//     await FakeVarControllerCyclA.getInstance().initialize();
//     await FakeVarControllerCyclB.getInstance().initialize();
//     await VarsController.initializeasync({
//         [FakeVarControllerCyclA.getInstance().varConf.name]: FakeVarControllerCyclA.getInstance().varConf,
//         [FakeVarControllerCyclB.getInstance().varConf.name]: FakeVarControllerCyclB.getInstance().varConf,
//     });
//     VarsServerController.init_varcontrollers_dag();

//     let vo_types: string[] = [];
//     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
//     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
//     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
//     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
//     let markers: { [var_id: number]: number } = {};

//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerCyclA.getInstance().varConf.id]: {
//             [FakeCyclicalDataHandler.get_data_A().index]: FakeCyclicalDataHandler.get_data_A()
//         },
//         [FakeVarControllerCyclB.getInstance().varConf.id]: {
//             [FakeCyclicalDataHandler.get_data_A_Var3().index]: FakeCyclicalDataHandler.get_data_A_Var3()
//         }
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerCyclA.getInstance().varConf.id]: {
//             [FakeCyclicalDataHandler.get_data_A().index]: FakeCyclicalDataHandler.get_data_A()
//         },
//         [FakeVarControllerCyclB.getInstance().varConf.id]: {
//             [FakeCyclicalDataHandler.get_data_A_Var3().index]: FakeCyclicalDataHandler.get_data_A_Var3()
//         },
//     });
// });


// test('VarsDatasVoUpdateHandler: test compute_deps_intersectors_and_union', async () => {

//     VarsController.clear_all_inits();
//     VarsServerController.clear_all_inits();

//     FakeDataHandler.initializeFakeDataVO();
//     FakeDistantHandler.initializeFakeDistantVO();
//     await FakeVarControllerDsDistant.getInstance().initialize();
//     await FakeVarControllerDsEmpDistant.getInstance().initialize();
//     await FakeVarControllerDeps.getInstance().initialize();
//     await VarsController.initializeasync({
//         [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
//         [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
//     });
//     VarsServerController.init_varcontrollers_dag();

//     let vo_types: string[] = [];
//     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
//     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
//     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
//     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
//     let markers: { [var_id: number]: number } = {};

//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() }
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() }
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_month() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [
//         FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
//         FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({});

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_empday_data_A().index]: FakeDepsDataHandler.get_ds_var_empday_data_A() },
//     });

//     vo_types = [];
//     vos_update_buffer = {};
//     vos_create_or_delete_buffer = {};
//     intersectors_by_index = {};
//     ctrls_to_update_1st_stage = {};
//     markers = {};

//     VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
//     VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
//     intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
//     await VarsDatasVoUpdateHandler['init_markers'](ctrls_to_update_1st_stage, markers);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
//         intersectors_by_index);
//     await VarsDatasVoUpdateHandler['compute_deps_intersectors_and_union'](
//         VarCtrlDAGNode.getInstance(VarsServerController.varcontrollers_dag, FakeVarControllerDeps.getInstance()),
//         intersectors_by_index);
//     expect(intersectors_by_index).toStrictEqual({
//         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
//         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
//         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() },
//     });
// });


test('VarsDatasVoUpdateHandler: test prepare_updates', async () => {

    // VarsController.clear_all_inits();
    // VarsServerController.clear_all_inits();

    await FakeVarsInit.initAll();

    let vo_types: string[] = [];
    let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    expect(vo_types).toStrictEqual([]);
    expect(vos_update_buffer).toStrictEqual({});
    expect(vos_create_or_delete_buffer).toStrictEqual({});
    expect(VarsDatasVoUpdateHandler['ordered_vos_cud']).toStrictEqual([]);

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    expect(vo_types).toStrictEqual([FakeDistantHandler.get_distant_A()._type]);
    expect(vos_update_buffer).toStrictEqual({});
    expect(vos_create_or_delete_buffer).toStrictEqual({
        [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
    });
    expect(VarsDatasVoUpdateHandler['ordered_vos_cud']).toStrictEqual([]);

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    expect(vo_types).toStrictEqual([FakeDistantHandler.get_distant_A()._type]);
    expect(vos_update_buffer).toStrictEqual({
        [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
    });
    expect(vos_create_or_delete_buffer).toStrictEqual({
        [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
    });
    expect(VarsDatasVoUpdateHandler['ordered_vos_cud']).toStrictEqual([]);

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_Update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    expect(vo_types).toStrictEqual([FakeDistantHandler.get_distant_A()._type]);
    expect(vos_update_buffer).toStrictEqual({
        [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
    });
    expect(vos_create_or_delete_buffer).toStrictEqual({});
    expect(VarsDatasVoUpdateHandler['ordered_vos_cud']).toStrictEqual([]);
});

test('VarsDatasVoUpdateHandler: test init_leaf_intersectors', async () => {

    // VarsController.clear_all_inits();
    // VarsServerController.clear_all_inits();

    await FakeVarsInit.initAll();

    let vo_types: string[] = [];
    let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};


    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({});

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A()
    });

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A()
    });

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2()
    });

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A(),
        [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2()
    });

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [
        FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
        FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A(),
        [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2()
    });

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({});

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({});

    vo_types = [];
    vos_update_buffer = {};
    vos_create_or_delete_buffer = {};
    intersectors_by_index = {};

    VarsDatasVoUpdateHandler['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
    VarsDatasVoUpdateHandler['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    intersectors_by_index = await VarsDatasVoUpdateHandler['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    expect(intersectors_by_index).toStrictEqual({
        [FakeEmpDayDataHandler.get_data_A_day().index]: FakeEmpDayDataHandler.get_data_A_day(),
        [FakeCyclicalDataHandler.get_data_A().index]: FakeCyclicalDataHandler.get_data_A()
    });
});
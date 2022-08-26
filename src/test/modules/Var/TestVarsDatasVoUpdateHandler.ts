/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import DAOUpdateVOHolder from '../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import VarCtrlDAGNode from '../../../server/modules/Var/controllerdag/VarCtrlDAGNode';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import VarServerControllerBase from '../../../server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDepsDataHandler from './fakes/FakeDepsDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeEmpDayDataHandler from './fakes/FakeEmpDayDataHandler';
import FakeEmpDistantHandler from './fakes/FakeEmpDistantHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './fakes/FakeVarControllerDsEmpDistant';
import FakeDataVO from './fakes/vos/FakeDataVO';
import FakeCyclicalDataHandler from './fakes/cyclical/FakeCyclicalDataHandler';
import FakeVarControllerCyclA from './fakes/cyclical/FakeVarControllerCyclA';
import FakeVarControllerCyclB from './fakes/cyclical/FakeVarControllerCyclB';
import VarsCacheController from '../../../server/modules/Var/VarsCacheController';

describe('VarsDatasVoUpdateHandler', () => {

    // it('test compute_intersectors', async () => {

    //     VarsController.getInstance().clear_all_inits();
    //     VarsServerController.getInstance().clear_all_inits();

    //     FakeDataHandler.initializeFakeDataVO();
    //     FakeDistantHandler.initializeFakeDistantVO();
    //     await FakeVarControllerDsDistant.getInstance().initialize();
    //     await FakeVarControllerDsEmpDistant.getInstance().initialize();
    //     await FakeVarControllerDeps.getInstance().initialize();
    //     await VarsController.getInstance().initializeasync({
    //         [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
    //         [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
    //     });
    //     VarsServerController.getInstance().init_varcontrollers_dag();

    //     let vo_types: string[] = [];
    //     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    //     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    //     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
    //     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
    //     let markers: { [var_id: number]: number } = {};

    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
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

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
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

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
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

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
    //         FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
    //         FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     for (let i in intersectors_by_index) {
    //         let es = intersectors_by_index[i];
    //         for (let j in es) {
    //             let e = es[j];
    //             let a = e.index;
    //         }
    //     }
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_empday_data_A().index]: FakeDepsDataHandler.get_ds_var_empday_data_A() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() },
    //     });
    // });


    // it('test compute_intersectors cyclical', async () => {

    //     VarsController.getInstance().clear_all_inits();
    //     VarsServerController.getInstance().clear_all_inits();

    //     FakeCyclicalDataHandler.initializeFakeEmpDayDataVO();
    //     await FakeVarControllerCyclA.getInstance().initialize();
    //     await FakeVarControllerCyclB.getInstance().initialize();
    //     await VarsController.getInstance().initializeasync({
    //         [FakeVarControllerCyclA.getInstance().varConf.name]: FakeVarControllerCyclA.getInstance().varConf,
    //         [FakeVarControllerCyclB.getInstance().varConf.name]: FakeVarControllerCyclB.getInstance().varConf,
    //     });
    //     VarsServerController.getInstance().init_varcontrollers_dag();

    //     let vo_types: string[] = [];
    //     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    //     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    //     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
    //     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
    //     let markers: { [var_id: number]: number } = {};

    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
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

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_index, vos_create_or_delete_buffer, vos_update_buffer);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerCyclA.getInstance().varConf.id]: {
    //             [FakeCyclicalDataHandler.get_data_A().index]: FakeCyclicalDataHandler.get_data_A()
    //         },
    //         [FakeVarControllerCyclB.getInstance().varConf.id]: {
    //             [FakeCyclicalDataHandler.get_data_A_Var3().index]: FakeCyclicalDataHandler.get_data_A_Var3()
    //         },
    //     });
    // });


    // it('test compute_deps_intersectors_and_union', async () => {

    //     VarsController.getInstance().clear_all_inits();
    //     VarsServerController.getInstance().clear_all_inits();

    //     FakeDataHandler.initializeFakeDataVO();
    //     FakeDistantHandler.initializeFakeDistantVO();
    //     await FakeVarControllerDsDistant.getInstance().initialize();
    //     await FakeVarControllerDsEmpDistant.getInstance().initialize();
    //     await FakeVarControllerDeps.getInstance().initialize();
    //     await VarsController.getInstance().initializeasync({
    //         [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
    //         [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
    //     });
    //     VarsServerController.getInstance().init_varcontrollers_dag();

    //     let vo_types: string[] = [];
    //     let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    //     let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    //     let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
    //     let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
    //     let markers: { [var_id: number]: number } = {};

    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() }
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() }
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_month() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
    //         FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
    //         FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A2_Update().index]: FakeDataHandler.get_var_data_A2_Update() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A2_Update_month().index]: FakeDepsDataHandler.get_ds_var_data_A2_Update_month() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({});

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_empday_data_A().index]: FakeDepsDataHandler.get_ds_var_empday_data_A() },
    //     });

    //     vo_types = [];
    //     vos_update_buffer = {};
    //     vos_create_or_delete_buffer = {};
    //     intersectors_by_index = {};
    //     ctrls_to_update_1st_stage = {};
    //     markers = {};

    //     VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
    //     VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
    //     intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
    //     await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
    //         intersectors_by_index);
    //     await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
    //         VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
    //         intersectors_by_index);
    //     expect(intersectors_by_index).to.deep.equal({
    //         [FakeVarControllerDsDistant.getInstance().varConf.id]: { [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A() },
    //         [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: { [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A() },
    //         [FakeVarControllerDeps.getInstance().varConf.id]: { [FakeDepsDataHandler.get_ds_var_data_A_month().index]: FakeDepsDataHandler.get_ds_var_data_A_month() },
    //     });
    // });

    it('test init_markers', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
        });
        VarsServerController.getInstance().init_varcontrollers_dag();

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
        let markers: { [var_id: number]: number } = {};

        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 2
        });
    });

    it('test prepare_updates', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([]);
        expect(vos_update_buffer).to.deep.equal({});
        expect(vos_create_or_delete_buffer).to.deep.equal({});
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({});
        expect(vos_create_or_delete_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
        });
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
        });
        expect(vos_create_or_delete_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
        });
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
        });
        expect(vos_create_or_delete_buffer).to.deep.equal({});
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);
    });

    it('test init_leaf_intersectors', async () => {

        VarsController.getInstance().clear_all_inits();
        VarsServerController.getInstance().clear_all_inits();

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
        });

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};


        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            1: {
                [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            1: {
                [FakeDataHandler.get_var_data_A().index]: FakeDataHandler.get_var_data_A()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            1: {
                [FakeDataHandler.get_var_data_A2().index]: FakeDataHandler.get_var_data_A2()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            1: {
                [FakeDataHandler.get_var_data_A_A2().index]: FakeDataHandler.get_var_data_A_A2()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            1: {
                [FakeDataHandler.get_var_data_A_A2().index]: FakeDataHandler.get_var_data_A_A2()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_index = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        intersectors_by_index = await VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        expect(intersectors_by_index).to.deep.equal({
            2: {
                [FakeEmpDayDataHandler.get_data_A().index]: FakeEmpDayDataHandler.get_data_A()
            }
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            2: FakeVarControllerDsEmpDistant.getInstance()
        });
    });
});
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

describe('VarsDatasVoUpdateHandler', () => {

    it('test compute_intersectors', async () => {
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
        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
        let markers: { [var_id: number]: number } = {};

        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()]
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()]
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2_Update()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_Update_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2_Update()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_Update_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: [FakeEmpDayDataHandler.get_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_empday_data_A()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_intersectors'](ctrls_to_update_1st_stage, markers, intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: [FakeEmpDayDataHandler.get_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()],
        });
    });

    it('test compute_deps_intersectors_and_union', async () => {
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
        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
        let markers: { [var_id: number]: number } = {};

        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()]
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()]
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2_Update()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_Update_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A2_Update()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A2_Update_month()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: [FakeEmpDayDataHandler.get_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_empday_data_A()],
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDsEmpDistant.getInstance()),
            intersectors_by_var_id);
        await VarsDatasVoUpdateHandler.getInstance()['compute_deps_intersectors_and_union'](
            VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, FakeVarControllerDeps.getInstance()),
            intersectors_by_var_id);
        expect(intersectors_by_var_id).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: [FakeDataHandler.get_var_data_A()],
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: [FakeEmpDayDataHandler.get_data_A()],
            [FakeVarControllerDeps.getInstance().varConf.id]: [FakeDepsDataHandler.get_ds_var_data_A_month()],
        });
    });

    it('test init_markers', async () => {
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
        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
        let markers: { [var_id: number]: number } = {};

        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 1
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};
        markers = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        await VarsDatasVoUpdateHandler.getInstance()['init_markers'](ctrls_to_update_1st_stage, markers);
        expect(markers).to.deep.equal({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: 1,
            [FakeVarControllerDeps.getInstance().varConf.id]: 2
        });
    });

    it('test prepare_updates', async () => {

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [];
        let limit = 500;
        limit = VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([]);
        expect(vos_update_buffer).to.deep.equal({});
        expect(vos_create_or_delete_buffer).to.deep.equal({});
        expect(limit).to.equal(500);
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        limit = 500;
        limit = VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({});
        expect(vos_create_or_delete_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
        });
        expect(limit).to.equal(499);
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        limit = 500;
        limit = VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
        });
        expect(vos_create_or_delete_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A()]
        });
        expect(limit).to.equal(498);
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_Update()];
        limit = 500;
        limit = VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        expect(vo_types).to.deep.equal([FakeDistantHandler.get_distant_A()._type]);
        expect(vos_update_buffer).to.deep.equal({
            [FakeDistantHandler.get_distant_A()._type]: [FakeDistantHandler.get_distant_A_Update()]
        });
        expect(vos_create_or_delete_buffer).to.deep.equal({});
        expect(limit).to.equal(499);
        expect(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']).to.deep.equal([]);
    });

    it('test init_leaf_intersectors', async () => {

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
        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};


        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            1: [FakeDataHandler.get_var_data_A()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A(), FakeDistantHandler.get_distant_A_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            1: [FakeDataHandler.get_var_data_A()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            1: [FakeDataHandler.get_var_data_A2()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            1: [FakeDataHandler.get_var_data_A_A2()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [
            FakeDistantHandler.get_distant_A2(), FakeDistantHandler.get_distant_A(),
            FakeDistantHandler.get_distant_A_Update(), FakeDistantHandler.get_distant_A2_Update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            1: [FakeDataHandler.get_var_data_A_A2()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: FakeVarControllerDsDistant.getInstance()
        });

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A_empty_update()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({});
        expect(ctrls_to_update_1st_stage).to.deep.equal({});

        vo_types = [];
        vos_update_buffer = {};
        vos_create_or_delete_buffer = {};
        intersectors_by_var_id = {};
        ctrls_to_update_1st_stage = {};

        VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud'] = [FakeEmpDistantHandler.get_distant_A()];
        VarsDatasVoUpdateHandler.getInstance()['prepare_updates'](500, vos_update_buffer, vos_create_or_delete_buffer, vo_types);
        VarsDatasVoUpdateHandler.getInstance()['init_leaf_intersectors'](vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);
        expect(intersectors_by_var_id).to.deep.equal({
            2: [FakeEmpDayDataHandler.get_data_A()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            2: FakeVarControllerDsEmpDistant.getInstance()
        });
    });
});
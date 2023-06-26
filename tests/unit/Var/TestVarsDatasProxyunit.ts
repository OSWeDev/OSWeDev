/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import DAOUpdateVOHolder from '../../../src/server/modules/DAO/vos/DAOUpdateVOHolder';
import VarServerControllerBase from '../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../src/server/modules/Var/VarsServerController';
import IDistantVOBase from '../../../src/shared/modules/IDistantVOBase';
import VarsController from '../../../src/shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './fakes/FakeVarControllerDsEmpDistant';
import VarsDatasProxy from '../../../src/server/modules/Var/VarsDatasProxy';
import ModuleVar from '../../../src/shared/modules/Var/ModuleVar';

test('VarsDatasVoUpdateHandler: test filter_var_datas_by_indexes', async () => {
    FakeDataHandler.initializeFakeDataVO();
    FakeDistantHandler.initializeFakeDistantVO();
    await ModuleVar.getInstance().initializeasync({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });
    await FakeVarControllerDsDistant.getInstance().initialize();
    await FakeVarControllerDsEmpDistant.getInstance().initialize();
    await FakeVarControllerDeps.getInstance().initialize();
    await VarsController.getInstance().initializeasync({
        [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
        [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
        [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
    });
    VarsServerController.getInstance().init_varcontrollers_dag();

    let vo_types: string[] = [];
    let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    let intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
    let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
    let markers: { [var_id: number]: number } = {};

    let var_datas: VarDataBaseVO[] = [];
    let prepend: boolean = true;
    let donot_insert_if_absent: boolean = true;
    let just_been_loaded_from_db: boolean = true;

    await VarsDatasProxy.getInstance()['filter_var_datas_by_indexes'](var_datas, null, null, true, 'test filter_var_datas_by_indexes', donot_insert_if_absent, just_been_loaded_from_db);
});
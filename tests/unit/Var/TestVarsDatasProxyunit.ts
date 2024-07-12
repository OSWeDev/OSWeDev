/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test } from '@playwright/test';
import DAOUpdateVOHolder from '../../../src/server/modules/DAO/vos/DAOUpdateVOHolder';
import VarServerControllerBase from '../../../src/server/modules/Var/VarServerControllerBase';
import VarsDatasProxy from '../../../src/server/modules/Var/VarsDatasProxy';
import IDistantVOBase from '../../../src/shared/modules/IDistantVOBase';
import VarDataBaseVO from '../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeVarsInit from './fakes/FakeVarsInit';

test('VarsDatasVoUpdateHandler: test filter_var_datas_by_indexes', async () => {
    await FakeVarsInit.initAll();

    const vo_types: string[] = [];
    const vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
    const vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
    const intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
    const ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
    const markers: { [var_id: number]: number } = {};

    const var_datas: VarDataBaseVO[] = [];
    const prepend: boolean = true;
    const donot_insert_if_absent: boolean = true;
    const just_been_loaded_from_db: boolean = true;

    await VarsDatasProxy['filter_var_datas_by_indexes'](var_datas, null, null, true, 'test filter_var_datas_by_indexes', donot_insert_if_absent, just_been_loaded_from_db);
});
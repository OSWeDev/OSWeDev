/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import DAOUpdateVOHolder from '../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import VarServerControllerBase from '../../../server/modules/Var/VarServerControllerBase';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';

describe('VarsDatasVoUpdateHandler', () => {

    // compute_intersectors
    // compute_deps_intersectors_and_union
    // init_markers
    // init_leaf_intersectors

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
        FakeVarControllerDsDistant.getInstance();

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = [];


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
            1: [FakeDistantHandler.get_distant_A()]
        });
        expect(ctrls_to_update_1st_stage).to.deep.equal({
            1: [FakeVarControllerDsDistant.getInstance()]
        });


    });

});
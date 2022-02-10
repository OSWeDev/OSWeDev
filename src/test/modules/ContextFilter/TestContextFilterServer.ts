import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import * as chai from 'chai';
import { expect, assert } from 'chai';
import 'mocha';
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterServerController from '../../../server/modules/ContextFilter/ContextFilterServerController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import FieldPathWrapper from '../../../server/modules/ContextFilter/vos/FieldPathWrapper';

describe('ContextFilterServer', () => {

    //#region test_get_paths_from_moduletable

    /**
     * Test 1 :
     *  de user à lang via user.lang_id
     */
    it('test get_paths_from_moduletable - User => Lang', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            LangVO.API_TYPE_ID,
            {
                [UserVO.API_TYPE_ID]: true
            },
            {
                [UserVO.API_TYPE_ID]: true,
                [LangVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
        ]);
        expect(deployed_deps_from).to.deep.equal({});
        expect(this_path_next_turn_paths).to.deep.equal([]);
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test get_paths_from_moduletable - Lang => User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            UserVO.API_TYPE_ID,
            {
                [LangVO.API_TYPE_ID]: true
            },
            {
                [UserVO.API_TYPE_ID]: true,
                [LangVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
        ]);
        expect(deployed_deps_from).to.deep.equal({});
        expect(this_path_next_turn_paths).to.deep.equal([]);
    });

    /**
     * Test 3 :
     *  de userrole à user via userrole.user_id puis de userrole à role via userrole.role_id
     */
    it('test get_paths_from_moduletable - Userrole => User & Role', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            UserVO.API_TYPE_ID,
            {
                [UserRoleVO.API_TYPE_ID]: true
            },
            {
                [UserVO.API_TYPE_ID]: true,
                [UserRoleVO.API_TYPE_ID]: true,
                [RoleVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('user_id'), false)
        ]);
        expect(deployed_deps_from).to.deep.equal({});
        expect(this_path_next_turn_paths).to.deep.equal([]);

        this_path_next_turn_paths = [];
        deployed_deps_from = {};
        path = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            UserVO.API_TYPE_ID,
            {
                [UserRoleVO.API_TYPE_ID]: true
            },
            {
                [UserVO.API_TYPE_ID]: true,
                [UserRoleVO.API_TYPE_ID]: true,
                [RoleVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        expect(path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('role_id'), false)
        ]);
        expect(deployed_deps_from).to.deep.equal({});
        expect(this_path_next_turn_paths).to.deep.equal([]);
    });

    /**
     * Test 4 :
     *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
     */
    it('test get_paths_from_moduletable - UserRoleVO => AnonymizationUserConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            AnonymizationUserConfVO.API_TYPE_ID,
            {
                [UserRoleVO.API_TYPE_ID]: true
            },
            {
                [AnonymizationUserConfVO.API_TYPE_ID]: true,
                [AnonymizationFieldConfVO.API_TYPE_ID]: true,
                [UserVO.API_TYPE_ID]: true,
                [UserRoleVO.API_TYPE_ID]: true,
                [RoleVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal(null);
        expect(this_path_next_turn_paths).to.deep.equal([[
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
        ]]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });

        let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
        path = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            this_path_next_turn_paths[0],
            this_path_next_turn_paths_2,
            AnonymizationUserConfVO.API_TYPE_ID,
            {
                [UserRoleVO.API_TYPE_ID]: true
            },
            {
                [AnonymizationUserConfVO.API_TYPE_ID]: true,
                [AnonymizationFieldConfVO.API_TYPE_ID]: true,
                [UserVO.API_TYPE_ID]: true,
                [UserRoleVO.API_TYPE_ID]: true,
                [RoleVO.API_TYPE_ID]: true
            },
            deployed_deps_from);

        expect(path).to.deep.equal([
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
        ]);
        expect(this_path_next_turn_paths_2).to.deep.equal(false);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test get_path_between_types - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID],
            AnonymizationFieldConfVO.API_TYPE_ID
        );

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            UserRoleVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'),
        ]);
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test get_path_between_types - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            [RoleVO.API_TYPE_ID],
            AnonymizationFieldConfVO.API_TYPE_ID
        );

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            UserRoleVO_modultable.getFieldFromId('role_id'),
            UserRoleVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'),
        ]);
    });

    //#endregion test_get_paths_from_moduletable

    //#region test_get_path_between_types

    /**
     * Test 1 :
     *  de user à lang via user.lang_id
     */
    it('test get_path_between_types - User => Lang', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            [UserVO.API_TYPE_ID],
            LangVO.API_TYPE_ID
        );

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            user_modultable.getFieldFromId('lang_id')
        ]);
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test get_path_between_types - Lang => User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            [LangVO.API_TYPE_ID],
            UserVO.API_TYPE_ID
        );

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            user_modultable.getFieldFromId('lang_id')
        ]);
    });

    /**
     * Test 3 :
     *  de userrole à user via userrole.user_id puis de userrole+user à role via userrole.role_id
     */
    it('test get_path_between_types - Userrole => User & Role', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID],
            UserVO.API_TYPE_ID
        );

        let userrole_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            userrole_modultable.getFieldFromId('user_id'),
        ]);

        path = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            RoleVO.API_TYPE_ID
        );
        expect(path).to.deep.equal([
            userrole_modultable.getFieldFromId('role_id'),
        ]);
    });

    /**
     * Test 4 :
     *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
     */
    it('test get_path_between_types - UserRoleVO => AnonymizationUserConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID],
            AnonymizationUserConfVO.API_TYPE_ID
        );

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            UserRoleVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('user_id')
        ]);
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test get_path_between_types - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID],
            AnonymizationFieldConfVO.API_TYPE_ID
        );

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            UserRoleVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'),
        ]);
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test get_path_between_types - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            [RoleVO.API_TYPE_ID],
            AnonymizationFieldConfVO.API_TYPE_ID
        );

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        expect(path).to.deep.equal([
            UserRoleVO_modultable.getFieldFromId('role_id'),
            UserRoleVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('user_id'),
            AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'),
        ]);
    });
    //#endregion test_get_path_between_types

    //#region test_updates_jointures

    /**
     * Test 1 :
     *  de user à lang via user.lang_id
     */
    it('test updates_jointures - User => Lang', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n: number = 1;
        let tables_aliases_by_type: { [vo_type: string]: string } = {
            user: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            LangVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [user_modultable.getFieldFromId('lang_id')],
            aliases_n
        );

        expect(jointures).to.deep.equal(['ref.lang t1 ON t0.lang_id = t1.id']);
        expect(joined_tables_by_vo_type).to.deep.equal({ [LangVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID] });
        expect(tables_aliases_by_type).to.deep.equal({
            [LangVO.API_TYPE_ID]: 't1',
            [UserVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(2);
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test updates_jointures - Lang => User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [LangVO.API_TYPE_ID]: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            UserVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [user_modultable.getFieldFromId('lang_id')],
            aliases_n
        );

        expect(jointures).to.deep.equal(['ref.user t1 ON t1.lang_id = t0.id']);
        expect(joined_tables_by_vo_type).to.deep.equal({ [LangVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID] });
        expect(tables_aliases_by_type).to.deep.equal({
            [LangVO.API_TYPE_ID]: 't1',
            [UserVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(2);
    });

    /**
     * Test 3 :
     *  de user à role via userrole.user_id + userrole.role_id
     */
    it('test updates_jointures - User => Role', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let userrole_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserVO.API_TYPE_ID]: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            RoleVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [userrole_modultable.getFieldFromId('user_id'), userrole_modultable.getFieldFromId('role_id')],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.userroles t1 ON t1.user_id = t0.id',
            'ref.role t2 ON t1.role_id = t2.id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserRoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID],
            [RoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [RoleVO.API_TYPE_ID]: 't2',
            [UserVO.API_TYPE_ID]: 't0',
            [UserRoleVO.API_TYPE_ID]: 't1'
        });
        expect(aliases_n).to.equal(3);
    });

    /**
     * Test 4 :
     *  de userroles à role et user en 2 étapes via userrole.user_id + userrole.role_id
     */
    it('test updates_jointures - UserRole => Role & User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let userrole_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserRoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            UserVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [userrole_modultable.getFieldFromId('user_id')],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 ON t0.user_id = t1.id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserRoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: 't1',
            [UserRoleVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(2);

        // étape 2
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            RoleVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [userrole_modultable.getFieldFromId('role_id')],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 ON t0.user_id = t1.id',
            'ref.role t2 ON t0.role_id = t2.id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserRoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID],
            [RoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [RoleVO.API_TYPE_ID]: 't2',
            [UserVO.API_TYPE_ID]: 't1',
            [UserRoleVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(3);
    });
    //#endregion test_updates_jointures

});
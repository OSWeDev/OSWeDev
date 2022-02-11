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
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';

describe('ContextFilterServer', () => {

    //#region test_reverse_path

    /**
     * Test 0 :
     *  chemin vide
     */
    it('test reverse_path - Empty path', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let path: FieldPathWrapper[] = [];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([]);
    });

    /**
     * Test 1 :
     *  de user à lang via user.lang_id
     */
    it('test reverse_path - User => Lang', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
        ]);
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test reverse_path - Lang => User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
        ]);
    });

    /**
     * Test 3 :
     *  de userrole à user via userrole.user_id puis de userrole à role via userrole.role_id
     */
    it('test reverse_path - Userrole => User & Role', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
        ];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true)
        ]);

        path = [
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false)
        ];

        reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
        ]);
    });

    /**
     * Test 4 :
     *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
     */
    it('test reverse_path - UserRoleVO => AnonymizationUserConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
        ];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
        ]);
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     *  Passage rapide de la relation N/N AnonymizationUserConfVO
     */
    it('test reverse_path - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
        ];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true),
        ]);
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     *  Passage rapide de 2 relations N/N
     */
    it('test reverse_path - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let path: FieldPathWrapper[] = [
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
        ];

        let reverse_path = ContextFilterServerController.getInstance()['reverse_path'](path);

        expect(reverse_path).to.deep.equal([
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true),
        ]);
    });

    //#endregion test_reverse_path

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
            RoleVO.API_TYPE_ID,
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
        expect(this_path_next_turn_paths_2).to.deep.equal([]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     *  Passage rapide de la relation N/N AnonymizationUserConfVO
     */
    it('test get_paths_from_moduletable - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            AnonymizationFieldConfVO.API_TYPE_ID,
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
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
        ]]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: true,
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });

        let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
        path = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            this_path_next_turn_paths[0],
            this_path_next_turn_paths_2,
            AnonymizationFieldConfVO.API_TYPE_ID,
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
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
        ]);
        expect(this_path_next_turn_paths_2).to.deep.equal([]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: true,
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     *  Passage rapide de 2 relations N/N
     */
    it('test get_paths_from_moduletable - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let this_path_next_turn_paths: FieldPathWrapper[][] = [];
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};
        let path: FieldPathWrapper[] = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            [],
            this_path_next_turn_paths,
            AnonymizationFieldConfVO.API_TYPE_ID,
            {
                [RoleVO.API_TYPE_ID]: true
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
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
        ]]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: true,
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });

        let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
        path = ContextFilterServerController.getInstance()['get_paths_from_moduletable'](
            this_path_next_turn_paths[0],
            this_path_next_turn_paths_2,
            AnonymizationFieldConfVO.API_TYPE_ID,
            {
                [RoleVO.API_TYPE_ID]: true
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
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
        ]);
        expect(this_path_next_turn_paths_2).to.deep.equal([]);
        expect(deployed_deps_from).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: true,
            [AnonymizationUserConfVO.API_TYPE_ID]: true
        });
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
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
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
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
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
            new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), true)
        ]);

        path = ContextFilterServerController.getInstance().get_path_between_types(
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
            [UserRoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            RoleVO.API_TYPE_ID
        );
        expect(path).to.deep.equal([
            new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
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
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false)
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
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
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
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false),
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
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
            [
                new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.lang t1 on t1.id = t0.lang_id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [LangVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID]
        });
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
            [
                new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 on t1.lang_id = t0.id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: 't1',
            [LangVO.API_TYPE_ID]: 't0'
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
            [
                new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), false),
                new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.userroles t1 on t1.user_id = t0.id',
            'ref.role t2 on t2.id = t1.role_id'
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
            [
                new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), true),
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 on t1.id = t0.user_id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID],
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
            [
                new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 on t1.id = t0.user_id',
            'ref.role t2 on t2.id = t0.role_id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID],
            [RoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [RoleVO.API_TYPE_ID]: 't2',
            [UserVO.API_TYPE_ID]: 't1',
            [UserRoleVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(3);
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test updates_jointures - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserRoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            AnonymizationFieldConfVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [
                new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
                new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
                new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.user t1 on t1.id = t0.user_id',
            'ref.anonym_user_conf t2 on t2.user_id = t1.id',
            'ref.anonym_field_conf t3 on t3.id = t2.anon_field_id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID],
            [AnonymizationUserConfVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID],
            [AnonymizationFieldConfVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationFieldConfVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: 't3',
            [AnonymizationUserConfVO.API_TYPE_ID]: 't2',
            [UserVO.API_TYPE_ID]: 't1',
            [UserRoleVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(4);
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test updates_jointures - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [RoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            AnonymizationFieldConfVO.API_TYPE_ID,
            joined_tables_by_vo_type,
            tables_aliases_by_type,
            [
                new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false),
                new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
                new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
                new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
            ],
            aliases_n
        );

        expect(jointures).to.deep.equal([
            'ref.userroles t1 on t1.role_id = t0.id',
            'ref.user t2 on t2.id = t1.user_id',
            'ref.anonym_user_conf t3 on t3.user_id = t2.id',
            'ref.anonym_field_conf t4 on t4.id = t3.anon_field_id'
        ]);
        expect(joined_tables_by_vo_type).to.deep.equal({
            [UserRoleVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID],
            [UserVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID],
            [AnonymizationUserConfVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID],
            [AnonymizationFieldConfVO.API_TYPE_ID]: VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationFieldConfVO.API_TYPE_ID],
        });
        expect(tables_aliases_by_type).to.deep.equal({
            [AnonymizationFieldConfVO.API_TYPE_ID]: 't4',
            [AnonymizationUserConfVO.API_TYPE_ID]: 't3',
            [UserVO.API_TYPE_ID]: 't2',
            [UserRoleVO.API_TYPE_ID]: 't1',
            [RoleVO.API_TYPE_ID]: 't0'
        });
        expect(aliases_n).to.equal(5);
    });
    //#endregion test_updates_jointures

    //#region test_build_request_from_active_field_filters_

    /**
     * Test 1 :
     *  select first_name, last_name
     *  de user à lang via user.lang_id
     */
    it('test build_request_from_active_field_filters_ - User => Lang', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = LangVO.API_TYPE_ID;
        filter.field_id = 'code_lang';
        filter.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
        filter.param_text = 'fr-fr';
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [UserVO.API_TYPE_ID, UserVO.API_TYPE_ID],
            ['firstname', 'lastname'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            new SortByVO(UserVO.API_TYPE_ID, 'name', true),
            ['firstname', 'lastname']
        );

        expect(request).to.equal(
            "SELECT DISTINCT t0.firstname as firstname , t0.lastname as lastname  FROM ref.user t0 JOIN ref.lang t1 on t1.id = t0.lang_id WHERE (t1.code_lang = 'fr-fr') ORDER BY t0.name ASC "
        );
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test build_request_from_active_field_filters_ - Lang => User', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = UserVO.API_TYPE_ID;
        filter.field_id = 'firstname';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [LangVO.API_TYPE_ID],
            ['code_lang'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
            new SortByVO(UserVO.API_TYPE_ID, 'phone', true),
            ['code_lang']
        );

        expect(request).to.equal(
            'SELECT DISTINCT t0.code_lang as code_lang  FROM ref.lang t0 JOIN ref.user t1 on t1.lang_id = t0.id WHERE (t1.firstname is NOT NULL) ORDER BY t1.phone ASC '
        );
    });

    /**
     * Test 3 :
     *  de userrole à user via userrole.user_id puis de userrole+user à role via userrole.role_id
     */
    it('test build_request_from_active_field_filters_ - Userrole => User & Role', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = UserVO.API_TYPE_ID;
        filter.field_id = 'firstname';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [UserRoleVO.API_TYPE_ID],
            ['role_id'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
            new SortByVO(UserVO.API_TYPE_ID, 'phone', true),
            ['role_id']
        );

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  FROM ref.userroles t0 JOIN ref.user t1 on t1.id = t0.user_id WHERE (t1.firstname is NOT NULL) ORDER BY t1.phone ASC '
        );

        filter = new ContextFilterVO();
        filter.vo_type = RoleVO.API_TYPE_ID;
        filter.field_id = 'translatable_name';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        request = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [UserRoleVO.API_TYPE_ID],
            ['role_id'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
            new SortByVO(RoleVO.API_TYPE_ID, 'translatable_name', true),
            ['role_id']
        );

        expect(request).to.equal(
            "SELECT DISTINCT t0.role_id as role_id  FROM ref.userroles t0 JOIN ref.role t1 on t1.id = t0.role_id WHERE (t1.translatable_name is NOT NULL) ORDER BY t1.translatable_name ASC "
        );
    });

    /**
     * Test 4 :
     *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
     */
    it('test build_request_from_active_field_filters_ - UserRoleVO => AnonymizationUserConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationUserConfVO.API_TYPE_ID;
        filter.field_id = 'anon_field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [UserRoleVO.API_TYPE_ID],
            ['role_id'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID],
            new SortByVO(AnonymizationUserConfVO.API_TYPE_ID, 'anon_field_id', true),
            ['role_id']
        );

        expect(request).to.equal(
            "SELECT DISTINCT t0.role_id as role_id  FROM ref.userroles t0 JOIN ref.user t1 on t1.id = t0.user_id JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id WHERE (t2.anon_field_id is NOT NULL) ORDER BY t2.anon_field_id ASC "
        );
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test build_request_from_active_field_filters_ - UserRoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter.field_id = 'field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [UserRoleVO.API_TYPE_ID],
            ['role_id'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, 'vo_type', true),
            ['role_id']
        );

        expect(request).to.equal(
            "SELECT DISTINCT t0.role_id as role_id  FROM ref.userroles t0 JOIN ref.user t1 on t1.id = t0.user_id JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id JOIN ref.anonym_field_conf t3 on t3.id = t2.anon_field_id WHERE (t3.field_id is NOT NULL) ORDER BY t3.vo_type ASC "
        );
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test build_request_from_active_field_filters_ - RoleVO => AnonymizationFieldConfVO', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter.field_id = 'field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        let request: string = ContextFilterServerController.getInstance().build_request_from_active_field_filters_(
            [RoleVO.API_TYPE_ID],
            ['translatable_name'],
            ContextFilterHandler.getInstance().get_active_field_filters([filter]),
            [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
            new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, 'vo_type', true),
            ['translatable_name']
        );

        expect(request).to.equal(
            "SELECT DISTINCT t0.translatable_name as translatable_name  FROM ref.role t0 JOIN ref.userroles t1 on t1.role_id = t0.id JOIN ref.user t2 on t2.id = t1.user_id JOIN ref.anonym_user_conf t3 on t3.user_id = t2.id JOIN ref.anonym_field_conf t4 on t4.id = t3.anon_field_id WHERE (t4.field_id is NOT NULL) ORDER BY t4.vo_type ASC "
        );
    });
    //#endregion test_build_request_from_active_field_filters_
});
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
import VOsTypesManager from '../../../src/shared/modules/VO/manager/VOsTypesManager';
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';
import ContextFieldPathServerController from '../../../src/server/modules/ContextFilter/ContextFieldPathServerController';
import LangVO from '../../../src/shared/modules/Translation/vos/LangVO';
import UserRoleVO from '../../../src/shared/modules/AccessPolicy/vos/UserRoleVO';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import AnonymizationUserConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import AnonymizationFieldConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import FieldPathWrapper from '../../../src/shared/modules/ContextFilter/vos/FieldPathWrapper';

ContextFilterTestsTools.getInstance().declare_modultables();

//#region test_reverse_path

/**
 * Test 0 :
 *  chemin vide
 */
test('ContextFieldPathServerController: test reverse_path - Empty path', () => {

    let path: FieldPathWrapper[] = [];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([]);
});

/**
 * Test 1 :
 *  de user à lang via user.lang_id
 */
test('ContextFieldPathServerController: test reverse_path - User => Lang', () => {

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
    ]);
});

/**
 * Test 2 :
 *  de lang à user via user.lang_id
 */
test('ContextFieldPathServerController: test reverse_path - Lang => User', () => {

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
    ]);
});

/**
 * Test 3 :
 *  de userrole à user via userrole.user_id puis de userrole à role via userrole.role_id
 */
test('ContextFieldPathServerController: test reverse_path - Userrole => User & Role', () => {

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
    ];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true)
    ]);

    path = [
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false)
    ];

    reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
    ]);
});

/**
 * Test 4 :
 *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
 */
test('ContextFieldPathServerController: test reverse_path - UserRoleVO => AnonymizationUserConfVO', () => {

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
    ];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
    ]);
});

/**
 * Test 5 :
 *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 *  Passage rapide de la relation N/N AnonymizationUserConfVO
 */
test('ContextFieldPathServerController: test reverse_path - UserRoleVO => AnonymizationFieldConfVO', () => {

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
    ];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
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
test('ContextFieldPathServerController: test reverse_path - RoleVO => AnonymizationFieldConfVO', () => {

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    let path: FieldPathWrapper[] = [
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
    ];

    let reverse_path = ContextFieldPathServerController['reverse_path'](path);

    expect(reverse_path).toStrictEqual([
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
test('ContextFieldPathServerController: test get_paths_from_moduletable - User => Lang', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
    ]);
    expect(deployed_deps_from).toStrictEqual({});
    expect(this_path_next_turn_paths).toStrictEqual([]);
});

/**
 * Test 2 :
 *  de lang à user via user.lang_id
 */
test('ContextFieldPathServerController: test get_paths_from_moduletable - Lang => User', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
    ]);
    expect(deployed_deps_from).toStrictEqual({});
    expect(this_path_next_turn_paths).toStrictEqual([]);
});

/**
 * Test 3 :
 *  de userrole à user via userrole.user_id puis de userrole à role via userrole.role_id
 */
test('ContextFieldPathServerController: test get_paths_from_moduletable - Userrole => User & Role', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('user_id'), false)
    ]);
    expect(deployed_deps_from).toStrictEqual({});
    expect(this_path_next_turn_paths).toStrictEqual([]);

    this_path_next_turn_paths = [];
    deployed_deps_from = {};
    path = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('role_id'), false)
    ]);
    expect(deployed_deps_from).toStrictEqual({});
    expect(this_path_next_turn_paths).toStrictEqual([]);
});

/**
 * Test 4 :
 *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
 */
test('ContextFieldPathServerController: test get_paths_from_moduletable - UserRoleVO => AnonymizationUserConfVO', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual(null);
    expect(this_path_next_turn_paths).toStrictEqual([[
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
    ], [
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
    ]]);
    expect(deployed_deps_from).toStrictEqual({
        [AnonymizationUserConfVO.API_TYPE_ID]: true
    });

    let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
    path = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    expect(path).toStrictEqual([
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
    ]);
    expect(this_path_next_turn_paths_2).toStrictEqual([]);
    expect(deployed_deps_from).toStrictEqual({
        [AnonymizationUserConfVO.API_TYPE_ID]: true
    });
});

/**
 * Test 5 :
 *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 *  Passage rapide de la relation N/N AnonymizationUserConfVO
 */
test('ContextFieldPathServerController: test get_paths_from_moduletable - UserRoleVO => AnonymizationFieldConfVO', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual(null);
    expect(this_path_next_turn_paths).toStrictEqual([[
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
    ]]);
    expect(deployed_deps_from).toStrictEqual({
        [AnonymizationFieldConfVO.API_TYPE_ID]: true,
        [AnonymizationUserConfVO.API_TYPE_ID]: true
    });

    let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
    path = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    expect(path).toStrictEqual([
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false)
    ]);
    expect(this_path_next_turn_paths_2).toStrictEqual([]);
    expect(deployed_deps_from).toStrictEqual({
        [AnonymizationFieldConfVO.API_TYPE_ID]: true,
        [AnonymizationUserConfVO.API_TYPE_ID]: true
    });
});

/**
 * Test 6 :
 *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 *  Passage rapide de 2 relations N/N
 */
test('ContextFieldPathServerController: test get_paths_from_moduletable - RoleVO => AnonymizationFieldConfVO', () => {

    let this_path_next_turn_paths: FieldPathWrapper[][] = [];
    let deployed_deps_from: { [api_type_id: string]: boolean } = {};
    let path: FieldPathWrapper[] = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual(null);
    expect(this_path_next_turn_paths).toStrictEqual([[
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true)
    ]]);
    expect(deployed_deps_from).toStrictEqual({
        [AnonymizationFieldConfVO.API_TYPE_ID]: true,
        [AnonymizationUserConfVO.API_TYPE_ID]: true
    });

    let this_path_next_turn_paths_2: FieldPathWrapper[][] = [];
    path = ContextFieldPathServerController['get_paths_from_moduletable'](
        null,
        null,
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

    expect(path).toStrictEqual([
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), false),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), true)
    ]);
    expect(this_path_next_turn_paths_2).toStrictEqual([]);
    expect(deployed_deps_from).toStrictEqual({
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
test('ContextFieldPathServerController: test get_path_between_types - User => Lang', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
        [UserVO.API_TYPE_ID],
        LangVO.API_TYPE_ID
    );

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
    ]);
});

/**
 * Test 2 :
 *  de lang à user via user.lang_id
 */
test('ContextFieldPathServerController: test get_path_between_types - Lang => User', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID],
        [LangVO.API_TYPE_ID],
        UserVO.API_TYPE_ID
    );

    let user_modultable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
    ]);
});

/**
 * Test 3 :
 *  de userrole à user via userrole.user_id puis de userrole+user à role via userrole.role_id
 */
test('ContextFieldPathServerController: test get_path_between_types - Userrole => User & Role', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
        [UserRoleVO.API_TYPE_ID],
        UserVO.API_TYPE_ID
    );

    let userrole_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), true)
    ]);

    path = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID],
        [UserRoleVO.API_TYPE_ID, UserVO.API_TYPE_ID],
        RoleVO.API_TYPE_ID
    );
    expect(path).toStrictEqual([
        new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
    ]);
});

/**
 * Test 4 :
 *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
 */
test('ContextFieldPathServerController: test get_path_between_types - UserRoleVO => AnonymizationUserConfVO', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
        [UserRoleVO.API_TYPE_ID],
        AnonymizationUserConfVO.API_TYPE_ID
    );

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false)
    ]);
});

/**
 * Test 5 :
 *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextFieldPathServerController: test get_path_between_types - UserRoleVO => AnonymizationFieldConfVO', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
        [UserRoleVO.API_TYPE_ID],
        AnonymizationFieldConfVO.API_TYPE_ID
    );

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
    ]);
});

/**
 * Test 6 :
 *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextFieldPathServerController: test get_path_between_types - RoleVO => AnonymizationFieldConfVO', () => {

    let path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
        null,
        null,
        [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID],
        [RoleVO.API_TYPE_ID],
        AnonymizationFieldConfVO.API_TYPE_ID
    );

    let UserRoleVO_modultable = VOsTypesManager.moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
    let AnonymizationUserConfVO_modultable = VOsTypesManager.moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
    expect(path).toStrictEqual([
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('role_id'), false),
        new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
        new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
    ]);
});
//#endregion test_get_path_between_types
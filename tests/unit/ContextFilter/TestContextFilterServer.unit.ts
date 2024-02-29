import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
import VOsTypesManager from '../../../src/shared/modules/VO/manager/VOsTypesManager';
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterServerController from '../../../src/server/modules/ContextFilter/ContextFilterServerController';
import ModuleTableVO from '../../../src/shared/modules/DAO/vos/ModuleTableVO';
import LangVO from '../../../src/shared/modules/Translation/vos/LangVO';
import UserRoleVO from '../../../src/shared/modules/AccessPolicy/vos/UserRoleVO';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import AnonymizationUserConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import AnonymizationFieldConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import FieldPathWrapper from '../../../src/shared/modules/ContextFilter/vos/FieldPathWrapper';

//#region test_updates_jointures

/**
 * Test 1 :
 *  de user à lang via user.lang_id
 */
test('ContextFilterServer: test updates_jointures - User => Lang', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const user_modultable = ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n: number = 1;
    const tables_aliases_by_type: { [vo_type: string]: string } = {
        user: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), true)
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.lang t1 on t1.id = t0.lang_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [LangVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[LangVO.API_TYPE_ID]
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [LangVO.API_TYPE_ID]: 't1',
        [UserVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(2);
});

/**
 * Test 2 :
 *  de lang à user via user.lang_id
 */
test('ContextFilterServer: test updates_jointures - Lang => User', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const user_modultable = ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n = 1;
    const tables_aliases_by_type = {
        [LangVO.API_TYPE_ID]: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(user_modultable.getFieldFromId('lang_id'), false)
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.user t1 on t1.lang_id = t0.id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID]
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: 't1',
        [LangVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(2);
});

/**
 * Test 3 :
 *  de user à role via userrole.user_id + userrole.role_id
 */
test('ContextFilterServer: test updates_jointures - User => Role', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const userrole_modultable = ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n = 1;
    const tables_aliases_by_type = {
        [UserVO.API_TYPE_ID]: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.userroles t1 on t1.user_id = t0.id',
        'ref.role t2 on t2.id = t1.role_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserRoleVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID],
        [RoleVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[RoleVO.API_TYPE_ID],
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [RoleVO.API_TYPE_ID]: 't2',
        [UserVO.API_TYPE_ID]: 't0',
        [UserRoleVO.API_TYPE_ID]: 't1'
    });
    expect(aliases_n).toStrictEqual(3);
});

/**
 * Test 4 :
 *  de userroles à role et user en 2 étapes via userrole.user_id + userrole.role_id
 */
test('ContextFilterServer: test updates_jointures - UserRole => Role & User', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const userrole_modultable = ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n = 1;
    const tables_aliases_by_type = {
        [UserRoleVO.API_TYPE_ID]: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(userrole_modultable.getFieldFromId('user_id'), true),
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.user t1 on t1.id = t0.user_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID],
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: 't1',
        [UserRoleVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(2);

    // étape 2
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(userrole_modultable.getFieldFromId('role_id'), true)
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.user t1 on t1.id = t0.user_id',
        'ref.role t2 on t2.id = t0.role_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID],
        [RoleVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[RoleVO.API_TYPE_ID],
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [RoleVO.API_TYPE_ID]: 't2',
        [UserVO.API_TYPE_ID]: 't1',
        [UserRoleVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(3);
});

/**
 * Test 5 :
 *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextFilterServer: test updates_jointures - UserRoleVO => AnonymizationFieldConfVO', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const UserRoleVO_modultable = ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID];
    const AnonymizationUserConfVO_modultable = ModuleTableController.module_tables_by_vo_type[AnonymizationUserConfVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n = 1;
    const tables_aliases_by_type = {
        [UserRoleVO.API_TYPE_ID]: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
        joined_tables_by_vo_type,
        tables_aliases_by_type,
        [
            new FieldPathWrapper(UserRoleVO_modultable.getFieldFromId('user_id'), true),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('user_id'), false),
            new FieldPathWrapper(AnonymizationUserConfVO_modultable.getFieldFromId('anon_field_id'), true)
        ],
        aliases_n
    );

    expect(jointures).toStrictEqual([
        'ref.user t1 on t1.id = t0.user_id',
        'ref.anonym_user_conf t2 on t2.user_id = t1.id',
        'ref.anonym_field_conf t3 on t3.id = t2.anon_field_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID],
        [AnonymizationUserConfVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[AnonymizationUserConfVO.API_TYPE_ID],
        [AnonymizationFieldConfVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[AnonymizationFieldConfVO.API_TYPE_ID],
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [AnonymizationFieldConfVO.API_TYPE_ID]: 't3',
        [AnonymizationUserConfVO.API_TYPE_ID]: 't2',
        [UserVO.API_TYPE_ID]: 't1',
        [UserRoleVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(4);
});

/**
 * Test 6 :
 *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextFilterServer: test updates_jointures - RoleVO => AnonymizationFieldConfVO', async () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    const UserRoleVO_modultable = ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID];
    const AnonymizationUserConfVO_modultable = ModuleTableController.module_tables_by_vo_type[AnonymizationUserConfVO.API_TYPE_ID];
    const jointures: string[] = [];
    const joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    let aliases_n = 1;
    const tables_aliases_by_type = {
        [RoleVO.API_TYPE_ID]: 't0'
    };
    aliases_n = await ContextFilterServerController.updates_jointures(
        null, //todo
        '',
        jointures,
        null,
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

    expect(jointures).toStrictEqual([
        'ref.userroles t1 on t1.role_id = t0.id',
        'ref.user t2 on t2.id = t1.user_id',
        'ref.anonym_user_conf t3 on t3.user_id = t2.id',
        'ref.anonym_field_conf t4 on t4.id = t3.anon_field_id'
    ]);
    expect(joined_tables_by_vo_type).toStrictEqual({
        [UserRoleVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserRoleVO.API_TYPE_ID],
        [UserVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID],
        [AnonymizationUserConfVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[AnonymizationUserConfVO.API_TYPE_ID],
        [AnonymizationFieldConfVO.API_TYPE_ID]: ModuleTableController.module_tables_by_vo_type[AnonymizationFieldConfVO.API_TYPE_ID],
    });
    expect(tables_aliases_by_type).toStrictEqual({
        [AnonymizationFieldConfVO.API_TYPE_ID]: 't4',
        [AnonymizationUserConfVO.API_TYPE_ID]: 't3',
        [UserVO.API_TYPE_ID]: 't2',
        [UserRoleVO.API_TYPE_ID]: 't1',
        [RoleVO.API_TYPE_ID]: 't0'
    });
    expect(aliases_n).toStrictEqual(5);
});
//#endregion test_updates_jointures
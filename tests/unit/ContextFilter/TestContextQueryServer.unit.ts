import { test, expect } from "playwright-test-coverage";
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import ContextQueryServerController from '../../../src/server/modules/ContextFilter/ContextQueryServerController';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../src/shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';
import AnonymizationFieldConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from '../../../src/shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import ContextFilterVO, { filter } from '../../../src/shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../src/shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../src/shared/modules/ContextFilter/vos/ContextQueryVO';
import ParameterizedQueryWrapper from '../../../src/shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import SortByVO from '../../../src/shared/modules/ContextFilter/vos/SortByVO';
import LangVO from '../../../src/shared/modules/Translation/vos/LangVO';
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import ConfigurationService from '../../../src/server/env/ConfigurationService';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

ConsoleHandler.init();
ContextFilterTestsTools.getInstance().declare_modultables();
ConfigurationService.setEnvParams({});

//#region test_.build_select_query

/**
 * Test 1 :
 *  select first_name, last_name
 *  de user à lang via user.lang_id
 */
test('ContextQueryServer: test .build_select_query - User => Lang', async () => {

    const filter_ = new ContextFilterVO();
    filter_.vo_type = LangVO.API_TYPE_ID;
    filter_.field_id = 'code_lang';
    filter_.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
    filter_.param_text = 'fr-fr';

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID).using(LangVO.API_TYPE_ID).add_fields([
        new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'firstname', 'firstname'),
        new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'lastname', 'lastname'),
    ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().name, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.firstname as firstname , t0.lastname as lastname  FROM ref.user t0 LEFT JOIN ref.lang t1 on t1.id = t0.lang_id WHERE (LOWER(t1.code_lang) = 'fr-fr')  ORDER BY t0.name ASC "
    );
    expect(request.params).toStrictEqual([]);
});

/**
 * Test 2 :
 *  de lang à user via user.lang_id
 */
test('ContextQueryServer: test .build_select_query - Lang => User', async () => {

    const filter_ = new ContextFilterVO();
    filter_.vo_type = UserVO.API_TYPE_ID;
    filter_.field_id = 'firstname';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    const context_query: ContextQueryVO = query(LangVO.API_TYPE_ID).using(UserVO.API_TYPE_ID).add_fields([
        new ContextQueryFieldVO(LangVO.API_TYPE_ID, 'code_lang', 'code_lang'),
    ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().phone, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.code_lang as code_lang  FROM ref.lang t0 LEFT JOIN ref.user t1 on t1.lang_id = t0.id WHERE (t1.firstname is NOT NULL)  ORDER BY t1.phone ASC "
    );
});

/**
 * Test 3 :
 *  de userrole à user via userrole.user_id puis de userrole+user à role via userrole.role_id
 */
test('ContextQueryServer: test .build_select_query - Userrole => User & Role', async () => {

    let filter_ = new ContextFilterVO();
    filter_.vo_type = UserVO.API_TYPE_ID;
    filter_.field_id = 'firstname';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    let context_query: ContextQueryVO = query(UserRoleVO.API_TYPE_ID).using([UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID]).add_fields([
        new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
    ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().phone, true));

    let request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.role_id as role_id  FROM ref.userroles t0 LEFT JOIN ref.user t1 on t1.id = t0.user_id WHERE (t1.firstname is NOT NULL)  ORDER BY t1.phone ASC "
    );

    filter_ = new ContextFilterVO();
    filter_.vo_type = RoleVO.API_TYPE_ID;
    filter_.field_id = 'translatable_name';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    context_query = query(UserRoleVO.API_TYPE_ID).using([UserVO.API_TYPE_ID, LangVO.API_TYPE_ID, RoleVO.API_TYPE_ID]);
    context_query.add_fields([
        new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
    ]);
    context_query.add_filters([filter_]);
    context_query.set_sort(new SortByVO(RoleVO.API_TYPE_ID, field_names<RoleVO>().translatable_name, true));

    request = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.role_id as role_id  FROM ref.userroles t0 LEFT JOIN ref.role t1 on t1.id = t0.role_id WHERE (t1.translatable_name is NOT NULL)  ORDER BY t1.translatable_name ASC "
    );
});

/**
 * Test 4 :
 *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
 */
test('ContextQueryServer: test .build_select_query - UserRoleVO => AnonymizationUserConfVO', async () => {

    const filter_ = new ContextFilterVO();
    filter_.vo_type = AnonymizationUserConfVO.API_TYPE_ID;
    filter_.field_id = 'anon_field_id';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    const context_query: ContextQueryVO = query(UserRoleVO.API_TYPE_ID).using([UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID]).add_fields([
        new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
    ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(AnonymizationUserConfVO.API_TYPE_ID, field_names<AnonymizationUserConfVO>().anon_field_id, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.role_id as role_id  FROM ref.userroles t0 LEFT JOIN ref.user t1 on t1.id = t0.user_id LEFT JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id WHERE (t2.anon_field_id is NOT NULL)  ORDER BY t2.anon_field_id ASC "
    );
});

/**
 * Test 5 :
 *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextQueryServer: test .build_select_query - UserRoleVO => AnonymizationFieldConfVO', async () => {

    const filter_ = new ContextFilterVO();
    filter_.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
    filter_.field_id = 'field_id';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    const context_query: ContextQueryVO = query(UserRoleVO.API_TYPE_ID).using([
        UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID])
        .add_fields([
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().vo_type, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.role_id as role_id  FROM ref.userroles t0 LEFT JOIN ref.user t1 on t1.id = t0.user_id LEFT JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id LEFT JOIN ref.anonym_field_conf t3 on t3.id = t2.anon_field_id WHERE (t3.field_id is NOT NULL)  ORDER BY t3.vo_type ASC "
    );
});

/**
 * Test 6 :
 *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
 */
test('ContextQueryServer: test .build_select_query - RoleVO => AnonymizationFieldConfVO', async () => {

    const filter_ = new ContextFilterVO();
    filter_.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
    filter_.field_id = 'field_id';
    filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

    const context_query: ContextQueryVO = query(UserRoleVO.API_TYPE_ID).using([
        UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID]
    ).add_fields([
        new ContextQueryFieldVO(RoleVO.API_TYPE_ID, 'translatable_name', 'translatable_name'),
    ]).add_filters([filter_]);
    context_query.set_sort(new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().vo_type, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t1.translatable_name as translatable_name  FROM ref.userroles t0 LEFT JOIN ref.role t1 on t1.id = t0.role_id LEFT JOIN ref.user t2 on t2.id = t0.user_id LEFT JOIN ref.anonym_user_conf t3 on t3.user_id = t2.id LEFT JOIN ref.anonym_field_conf t4 on t4.id = t3.anon_field_id WHERE (t4.field_id is NOT NULL)  ORDER BY t4.vo_type ASC "
    );
});

/**
 * Test 7 :
 *  select where ((first_name = 'a') and (lastname = 'b')) or ((first_name = 'b') and (lastname = 'a'))
 */
test('ContextQueryServer: test .build_select_query AND OR combinaison', async () => {

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
        .field('firstname').field('lastname')
        .add_filters([
            filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'))
                .or(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('b').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('a')))
        ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().name, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.firstname , t0.lastname  FROM ref.user t0 WHERE ( (( ((t0.firstname = 'a') AND (t0.lastname = 'b')) ) OR ( ((t0.firstname = 'b') AND (t0.lastname = 'a')) )) )  ORDER BY t0.name ASC "
    );
    expect(request.params).toStrictEqual([]);
});

/**
 * Test 8 :
 *  More and and or
 */
test('ContextQueryServer: test .build_select_query AND OR combinaison ++', async () => {

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
        .field('firstname').field('lastname')
        .add_filters([

            ContextFilterVO.or([
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a')
                    .and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'))
                    .and(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c'))
                    .and(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d')),
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a1')
                    .and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b1'))
                    .and(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c1'))
                    .and(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d1')),
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a2')
                    .and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b2'))
                    .and(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c2'))
                    .and(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d2'))
            ])
        ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().name, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.firstname , t0.lastname  FROM ref.user t0 WHERE ( (( (( (( ((t0.firstname = 'a1') AND (t0.lastname = 'b1')) ) AND (t0.name = 'c1')) ) AND (t0.password = crypt('d1', t0.password))) ) OR ( (( (( (( ((t0.firstname = 'a') AND (t0.lastname = 'b')) ) AND (t0.name = 'c')) ) AND (t0.password = crypt('d', t0.password))) ) OR ( (( (( ((t0.firstname = 'a2') AND (t0.lastname = 'b2')) ) AND (t0.name = 'c2')) ) AND (t0.password = crypt('d2', t0.password))) )) )) )  ORDER BY t0.name ASC "
    );
    expect(request.params).toStrictEqual([]);
});

/**
 * Test 9 :
 *  More and and or
 */
test('ContextQueryServer: test .build_select_query AND OR combinaison ++2', async () => {

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
        .field('firstname').field('lastname')
        .add_filters([

            ContextFilterVO.and([
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a')
                    .or(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'))
                    .or(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c'))
                    .or(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d')),
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a1')
                    .or(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b1'))
                    .or(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c1'))
                    .or(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d1')),
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a2')
                    .or(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b2'))
                    .or(filter(UserVO.API_TYPE_ID, 'name').by_text_eq('c2'))
                    .or(filter(UserVO.API_TYPE_ID, 'password').by_text_eq('d2'))
            ])
        ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, field_names<UserVO>().name, true));

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.firstname , t0.lastname  FROM ref.user t0 WHERE ( (( (( ((t0.firstname = 'a1') OR (t0.lastname = 'b1')) ) OR (t0.name = 'c1')) ) OR (t0.password = crypt('d1', t0.password))) ) AND ( (( (( ((t0.firstname = 'a') OR (t0.lastname = 'b')) ) OR (t0.name = 'c')) ) OR (t0.password = crypt('d', t0.password))) ) AND ( (( (( ((t0.firstname = 'a2') OR (t0.lastname = 'b2')) ) OR (t0.name = 'c2')) ) OR (t0.password = crypt('d2', t0.password))) )  ORDER BY t0.name ASC "
    );
    expect(request.params).toStrictEqual([]);
});

/**
 * Test 10 :
 *  Having auto
 */
test('ContextQueryServer: test .build_select_query having auto', async () => {

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID).field('id');
    context_query.add_filters([
        filter(RoleVO.API_TYPE_ID).by_id_in(query(RoleVO.API_TYPE_ID).field('id'), context_query).or(
            filter(UserVO.API_TYPE_ID).by_id_not_in(query(UserRoleVO.API_TYPE_ID).field('user_id').exec_as_server(), context_query)
        )
    ]).exec_as_server();

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.id  FROM ref.user t0 LEFT JOIN ref.userroles t1 on t1.user_id = t0.id LEFT JOIN ref.role t2 on t2.id = t1.role_id WHERE ( ((t2.id IN (SELECT __t0.id  FROM ref.role __t0 )) OR (t0.id NOT IN (SELECT __t0.user_id  FROM ref.userroles __t0 ))) ) "
    );
});

/**
 * Test 11 :
 *  Having auto simple
 */
test('ContextQueryServer: test .build_select_query having auto simple', async () => {

    const context_query: ContextQueryVO = query(RoleVO.API_TYPE_ID).filter_by_id(15, UserVO.API_TYPE_ID).exec_as_server();

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.id , t0.translatable_name , t0.parent_role_id , t0.weight  FROM ref.role t0 LEFT JOIN ref.userroles t1 on t1.role_id = t0.id LEFT JOIN ref.user t2 on t2.id = t1.user_id WHERE (t2.id = 15) "
    );
});

/**
 * Test 12 :
 *  or chaines
 */
test('ContextQueryServer: test .build_select_query chained OR', async () => {

    const context_query: ContextQueryVO = query(UserVO.API_TYPE_ID);

    const f1 = ContextFilterVO.or([
        filter(RoleVO.API_TYPE_ID).by_id_in(query(RoleVO.API_TYPE_ID).field('id').exec_as_server(), context_query),
        filter(UserVO.API_TYPE_ID).by_id_not_in(query(UserRoleVO.API_TYPE_ID).field('user_id').exec_as_server(), context_query),
        filter(UserVO.API_TYPE_ID).by_id(15)
    ]);

    let filter_ = filter(UserVO.API_TYPE_ID).by_id(15);
    const compl = ContextFilterVO.or([
        filter(UserVO.API_TYPE_ID).by_id_in(
            query(UserVO.API_TYPE_ID).field('id').exec_as_server(), context_query),
        filter(UserVO.API_TYPE_ID).by_id_in(
            query(UserVO.API_TYPE_ID).field('id').exec_as_server(), context_query)
    ]);
    filter_ = filter_.or(compl);

    context_query.add_filters([f1]).add_filters([filter_]).exec_as_server();

    const request: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query(context_query);

    expect(request.query).toStrictEqual(
        "SELECT t0.id , t0.name , t0.firstname , t0.lastname , t0.email , t0.phone , t0.blocked , t0.password , t0.password_change_date , t0.reminded_pwd_1 , t0.reminded_pwd_2 , t0.invalidated , t0.lang_id , t0.recovery_challenge , t0.recovery_expiration , t0.logged_once , t0.creation_date  FROM ref.user t0 LEFT JOIN ref.userroles t1 on t1.user_id = t0.id LEFT JOIN ref.role t2 on t2.id = t1.role_id WHERE ( ((t0.id NOT IN (SELECT __t0.user_id  FROM ref.userroles __t0 )) OR ( ((t2.id IN (SELECT __t0.id  FROM ref.role __t0 )) OR (t0.id = 15)) )) ) AND ( ((t0.id = 15) OR ( ((t0.id IN (SELECT __t0.id  FROM ref.user __t0 )) OR (t0.id IN (SELECT __t0.id  FROM ref.user __t0 ))) )) ) "
    );
});
//#endregion test_.build_select_query
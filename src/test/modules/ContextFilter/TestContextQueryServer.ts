import { expect } from 'chai';
import 'mocha';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import ContextQueryServerController from '../../../server/modules/ContextFilter/ContextQueryServerController';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();




describe('ContextQueryServer', () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    //#region test_.build_select_query

    /**
     * Test 1 :
     *  select first_name, last_name
     *  de user à lang via user.lang_id
     */
    it('test .build_select_query - User => Lang', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = LangVO.API_TYPE_ID;
        filter_.field_id = 'code_lang';
        filter_.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
        filter_.param_text = 'fr-fr';

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = UserVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'firstname', 'firstname'),
            new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'lastname', 'lastname'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(UserVO.API_TYPE_ID, 'name', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT DISTINCT t0.firstname as firstname , t0.lastname as lastname  " +
            "FROM ref.user t0 " +
            "LEFT JOIN ref.lang t1 on t1.id = t0.lang_id " +
            "WHERE (t1.code_lang = 'fr-fr') " +
            "ORDER BY t0.name ASC "
        );
    });

    /**
     * Test 2 :
     *  de lang à user via user.lang_id
     */
    it('test .build_select_query - Lang => User', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = UserVO.API_TYPE_ID;
        filter_.field_id = 'firstname';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = LangVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(LangVO.API_TYPE_ID, 'code_lang', 'code_lang'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(UserVO.API_TYPE_ID, 'phone', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.code_lang as code_lang  ' +
            'FROM ref.lang t0 ' +
            'LEFT JOIN ref.user t1 on t1.lang_id = t0.id ' +
            'WHERE (t1.firstname is NOT NULL) ' +
            'ORDER BY t1.phone ASC '
        );
    });

    /**
     * Test 3 :
     *  de userrole à user via userrole.user_id puis de userrole+user à role via userrole.role_id
     */
    it('test .build_select_query - Userrole => User & Role', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = UserVO.API_TYPE_ID;
        filter_.field_id = 'firstname';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(UserVO.API_TYPE_ID, 'phone', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.user t1 on t1.id = t0.user_id ' +
            'WHERE (t1.firstname is NOT NULL) ' +
            'ORDER BY t1.phone ASC '
        );

        filter_ = new ContextFilterVO();
        filter_.vo_type = RoleVO.API_TYPE_ID;
        filter_.field_id = 'translatable_name';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        context_query = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID, RoleVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(RoleVO.API_TYPE_ID, 'translatable_name', true);

        request = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.role t1 on t1.id = t0.role_id ' +
            'WHERE (t1.translatable_name is NOT NULL) ' +
            'ORDER BY t1.translatable_name ASC '
        );
    });

    /**
     * Test 4 :
     *  de UserRoleVO à AnonymizationUserConfVO via userrole.user_id => AnonymizationUserConfVO.user_id
     */
    it('test .build_select_query - UserRoleVO => AnonymizationUserConfVO', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = AnonymizationUserConfVO.API_TYPE_ID;
        filter_.field_id = 'anon_field_id';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(AnonymizationUserConfVO.API_TYPE_ID, 'anon_field_id', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.user t1 on t1.id = t0.user_id ' +
            'LEFT JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id ' +
            'WHERE (t2.anon_field_id is NOT NULL) ' +
            'ORDER BY t2.anon_field_id ASC '
        );
    });

    /**
     * Test 5 :
     *  de UserRoleVO à AnonymizationFieldConfVO via userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test .build_select_query - UserRoleVO => AnonymizationFieldConfVO', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter_.field_id = 'field_id';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [
            UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, 'vo_type', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.user t1 on t1.id = t0.user_id ' +
            'LEFT JOIN ref.anonym_user_conf t2 on t2.user_id = t1.id ' +
            'LEFT JOIN ref.anonym_field_conf t3 on t3.id = t2.anon_field_id ' +
            'WHERE (t3.field_id is NOT NULL) ' +
            'ORDER BY t3.vo_type ASC '
        );
    });

    /**
     * Test 6 :
     *  de RoleVO à AnonymizationFieldConfVO via userrole.role_id => userrole.user_id => AnonymizationUserConfVO.user_id => AnonymizationUserConfVO.anon_field_id
     */
    it('test .build_select_query - RoleVO => AnonymizationFieldConfVO', async () => {

        let filter_ = new ContextFilterVO();
        filter_.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter_.field_id = 'field_id';
        filter_.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [
            UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(RoleVO.API_TYPE_ID, 'translatable_name', 'translatable_name'),
        ];
        context_query.filters = [filter_];
        context_query.sort_by = new SortByVO(AnonymizationFieldConfVO.API_TYPE_ID, 'vo_type', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t1.translatable_name as translatable_name  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.role t1 on t1.id = t0.role_id ' +
            'LEFT JOIN ref.user t2 on t2.id = t0.user_id ' +
            'LEFT JOIN ref.anonym_user_conf t3 on t3.user_id = t2.id ' +
            'LEFT JOIN ref.anonym_field_conf t4 on t4.id = t3.anon_field_id ' +
            'WHERE (t4.field_id is NOT NULL) ' +
            'ORDER BY t4.vo_type ASC '
        );
    });

    /**
     * Test 7 :
     *  select where ((first_name = 'a') and (lastname = 'b')) or ((first_name = 'b') and (lastname = 'a'))
     */
    it('test .build_select_query AND OR combinaison', async () => {

        let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
            .field('firstname').field('lastname')
            .add_filters([
                filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'))
                    .or(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('b').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('a')))
            ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, 'name', true));

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT DISTINCT t0.firstname as firstname , t0.lastname as lastname  " +
            "FROM ref.user t0 " +
            "WHERE ( (( ((t0.firstname = \'a\') AND (t0.lastname = \'b\')) ) OR ( ((t0.firstname = \'b\') AND (t0.lastname = \'a\')) )) ) " +
            "ORDER BY t0.name ASC "
        );
    });

    /**
     * Test 8 :
     *  More and and or
     */
    it('test .build_select_query AND OR combinaison ++', async () => {

        let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
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
            ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, 'name', true));

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT DISTINCT t0.firstname as firstname , t0.lastname as lastname  " +
            "FROM ref.user t0 " +
            "WHERE ( (( (( (( ((t0.firstname = 'a1') AND (t0.lastname = 'b1')) ) AND (t0.name = 'c1')) ) AND (t0.password = 'd1')) ) OR ( (( (( (( ((t0.firstname = 'a') AND (t0.lastname = 'b')) ) AND (t0.name = 'c')) ) AND (t0.password = 'd')) ) OR ( (( (( ((t0.firstname = 'a2') AND (t0.lastname = 'b2')) ) AND (t0.name = 'c2')) ) AND (t0.password = 'd2')) )) )) ) " +
            "ORDER BY t0.name ASC "
        );
    });

    /**
     * Test 9 :
     *  More and and or
     */
    it('test .build_select_query AND OR combinaison ++2', async () => {

        let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
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
            ]).set_sort(new SortByVO(UserVO.API_TYPE_ID, 'name', true));

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT DISTINCT t0.firstname as firstname , t0.lastname as lastname  " +
            "FROM ref.user t0 " +
            "WHERE ( (( (( (( ((t0.firstname = 'a1') OR (t0.lastname = 'b1')) ) OR (t0.name = 'c1')) ) OR (t0.password = 'd1')) ) AND ( (( (( (( ((t0.firstname = 'a') OR (t0.lastname = 'b')) ) OR (t0.name = 'c')) ) OR (t0.password = 'd')) ) AND ( (( (( ((t0.firstname = 'a2') OR (t0.lastname = 'b2')) ) OR (t0.name = 'c2')) ) OR (t0.password = 'd2')) )) )) ) " +
            "ORDER BY t0.name ASC "
        );
    });

    /**
     * Test 10 :
     *  Having auto
     */
    it('test .build_select_query having auto', async () => {

        let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID).field('id').add_filters([
            filter(RoleVO.API_TYPE_ID).by_id_in(query(RoleVO.API_TYPE_ID).field('id')).or(
                filter(UserVO.API_TYPE_ID).by_id_not_in(query(UserRoleVO.API_TYPE_ID).field('user_id').ignore_access_hooks())
            )
        ]).ignore_access_hooks();

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT DISTINCT t0.id as id  FROM ref.user t0 LEFT JOIN ref.userroles t1 on t1.user_id = t0.id LEFT JOIN ref.role t2 on t2.id = t1.role_id WHERE ( ((t2.id IN (SELECT DISTINCT t0.id as id  FROM ref.role t0)) OR (t0.id NOT IN (SELECT DISTINCT t0.user_id as user_id  FROM ref.userroles t0))) )"
        );
    });

    /**
     * Test 11 :
     *  Having auto simple
     */
    it('test .build_select_query having auto simple', async () => {

        let context_query: ContextQueryVO = query(RoleVO.API_TYPE_ID).filter_by_id(15, UserVO.API_TYPE_ID).ignore_access_hooks();

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT t0.*  FROM ref.role t0 LEFT JOIN ref.userroles t1 on t1.role_id = t0.id LEFT JOIN ref.user t2 on t2.id = t1.user_id WHERE (t2.id = 15)"
        );
    });

    /**
     * Test 12 :
     *  or chaines
     */
    it('test .build_select_query chained OR', async () => {

        let f1 = ContextFilterVO.or([
            filter(RoleVO.API_TYPE_ID).by_id_in(query(RoleVO.API_TYPE_ID).field('id').ignore_access_hooks()),
            filter(UserVO.API_TYPE_ID).by_id_not_in(query(UserRoleVO.API_TYPE_ID).field('user_id').ignore_access_hooks()),
            filter(UserVO.API_TYPE_ID).by_id(15)
        ]);

        let filter_ = filter(UserVO.API_TYPE_ID).by_id(15);
        let compl = ContextFilterVO.or([
            filter(UserVO.API_TYPE_ID).by_id_in(
                query(UserVO.API_TYPE_ID).field('id').ignore_access_hooks()),
            filter(UserVO.API_TYPE_ID).by_id_in(
                query(UserVO.API_TYPE_ID).field('id').ignore_access_hooks())
        ]);
        filter_ = filter_.or(compl);

        let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID).add_filters([f1]).add_filters([filter_]).ignore_access_hooks();

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            "SELECT t0.*  FROM ref.user t0 LEFT JOIN ref.userroles t1 on t1.user_id = t0.id LEFT JOIN ref.role t2 on t2.id = t1.role_id WHERE ( ((t0.id NOT IN (SELECT DISTINCT t0.user_id as user_id  FROM ref.userroles t0)) OR ( ((t2.id IN (SELECT DISTINCT t0.id as id  FROM ref.role t0)) OR (t0.id = 15)) )) ) AND ( ((t0.id = 15) OR ( ((t0.id IN (SELECT DISTINCT t0.id as id  FROM ref.user t0)) OR (t0.id IN (SELECT DISTINCT t0.id as id  FROM ref.user t0))) )) )"
        );
    });
    //#endregion test_.build_select_query
});
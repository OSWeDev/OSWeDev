import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, assert } from 'chai';
import 'mocha';

import ContextQueryServerController from '../../../server/modules/ContextFilter/ContextQueryServerController';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';


describe('ContextQueryServer', () => {

    ContextFilterTestsTools.getInstance().declare_modultables();

    //#region test_.build_select_query

    /**
     * Test 1 :
     *  select first_name, last_name
     *  de user à lang via user.lang_id
     */
    it('test .build_select_query - User => Lang', async () => {

        let filter = new ContextFilterVO();
        filter.vo_type = LangVO.API_TYPE_ID;
        filter.field_id = 'code_lang';
        filter.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
        filter.param_text = 'fr-fr';

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = UserVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'firstname', 'firstname'),
            new ContextQueryFieldVO(UserVO.API_TYPE_ID, 'lastname', 'lastname'),
        ];
        context_query.filters = [filter];
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

        let filter = new ContextFilterVO();
        filter.vo_type = UserVO.API_TYPE_ID;
        filter.field_id = 'firstname';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = LangVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(LangVO.API_TYPE_ID, 'code_lang', 'code_lang'),
        ];
        context_query.filters = [filter];
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

        let filter = new ContextFilterVO();
        filter.vo_type = UserVO.API_TYPE_ID;
        filter.field_id = 'firstname';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter];
        context_query.sort_by = new SortByVO(UserVO.API_TYPE_ID, 'phone', true);

        let request: string = await ContextQueryServerController.getInstance().build_select_query(context_query);

        expect(request).to.equal(
            'SELECT DISTINCT t0.role_id as role_id  ' +
            'FROM ref.userroles t0 ' +
            'LEFT JOIN ref.user t1 on t1.id = t0.user_id ' +
            'WHERE (t1.firstname is NOT NULL) ' +
            'ORDER BY t1.phone ASC '
        );

        filter = new ContextFilterVO();
        filter.vo_type = RoleVO.API_TYPE_ID;
        filter.field_id = 'translatable_name';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        context_query = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID, RoleVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter];
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

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationUserConfVO.API_TYPE_ID;
        filter.field_id = 'anon_field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, LangVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter];
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

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter.field_id = 'field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [
            UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(UserRoleVO.API_TYPE_ID, 'role_id', 'role_id'),
        ];
        context_query.filters = [filter];
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

        let filter = new ContextFilterVO();
        filter.vo_type = AnonymizationFieldConfVO.API_TYPE_ID;
        filter.field_id = 'field_id';
        filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.active_api_type_ids = [
            UserVO.API_TYPE_ID, UserRoleVO.API_TYPE_ID, RoleVO.API_TYPE_ID, AnonymizationUserConfVO.API_TYPE_ID, AnonymizationFieldConfVO.API_TYPE_ID];
        context_query.base_api_type_id = UserRoleVO.API_TYPE_ID;
        context_query.fields = [
            new ContextQueryFieldVO(RoleVO.API_TYPE_ID, 'translatable_name', 'translatable_name'),
        ];
        context_query.filters = [filter];
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
    //#endregion test_.build_select_query
});
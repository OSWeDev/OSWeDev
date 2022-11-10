import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

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
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import FieldPathWrapper from '../../../server/modules/ContextFilter/vos/FieldPathWrapper';

describe('ContextFilterServer', () => {

    //#region test_updates_jointures

    /**
     * Test 1 :
     *  de user à lang via user.lang_id
     */
    it('test updates_jointures - User => Lang', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n: number = 1;
        let tables_aliases_by_type: { [vo_type: string]: string } = {
            user: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            null,
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
    it('test updates_jointures - Lang => User', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [LangVO.API_TYPE_ID]: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            null,
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
    it('test updates_jointures - User => Role', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let userrole_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserVO.API_TYPE_ID]: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
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
    it('test updates_jointures - UserRole => Role & User', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let userrole_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserRoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            null,
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
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
            jointures,
            null,
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
    it('test updates_jointures - UserRoleVO => AnonymizationFieldConfVO', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [UserRoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
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
    it('test updates_jointures - RoleVO => AnonymizationFieldConfVO', async () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let UserRoleVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserRoleVO.API_TYPE_ID];
        let AnonymizationUserConfVO_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[AnonymizationUserConfVO.API_TYPE_ID];
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let aliases_n = 1;
        let tables_aliases_by_type = {
            [RoleVO.API_TYPE_ID]: 't0'
        };
        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
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
});
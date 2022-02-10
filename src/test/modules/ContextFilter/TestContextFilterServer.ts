import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import * as chai from 'chai';
import { expect, assert } from 'chai';
import 'mocha';
import ContextFilterTestsTools from './tools/ContextFilterTestsTools';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import UserLogVO from '../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleContextFilterServer from '../../../server/modules/ContextFilter/ModuleContextFilterServer';

describe('ContextFilterServer', () => {

    it('test updates_jointures', () => {

        ContextFilterTestsTools.getInstance().declare_modultables();

        let user_modultable = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        ModuleContextFilterServer.
            updates_jointures(
                jointures: string[],
                targeted_type: string,
                joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
                tables_aliases_by_type: { [vo_type: string]: string },
                path: Array < ModuleTableField < any >>,
                aliases_n: number
            )
    });
});
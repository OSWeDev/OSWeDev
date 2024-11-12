/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ParamsServerController from '../../../server/modules/Params/ParamsServerController';

export default class MailParamsInit implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): MailParamsInit {
        if (!MailParamsInit.instance) {
            MailParamsInit.instance = new MailParamsInit();
        }
        return MailParamsInit.instance;
    }

    private static instance: MailParamsInit = null;

    get uid(): string {
        return 'MailParamsInit';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        await ParamsServerController.setParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS, "20");
        await ParamsServerController.setParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS, "3");
        await ParamsServerController.setParamValue(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS, "90");
        await ParamsServerController.setParamValue(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS, "2");
    }
}
/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

export default class Patch20200731MailParamsInit implements IGeneratorWorker {

    public static getInstance(): Patch20200731MailParamsInit {
        if (!Patch20200731MailParamsInit.instance) {
            Patch20200731MailParamsInit.instance = new Patch20200731MailParamsInit();
        }
        return Patch20200731MailParamsInit.instance;
    }

    private static instance: Patch20200731MailParamsInit = null;

    get uid(): string {
        return 'Patch20200731MailParamsInit';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        await ModuleParams.getInstance().setParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS, "20");
        await ModuleParams.getInstance().setParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS, "3");
        await ModuleParams.getInstance().setParamValue(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS, "90");
        await ModuleParams.getInstance().setParamValue(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS, "2");
    }
}
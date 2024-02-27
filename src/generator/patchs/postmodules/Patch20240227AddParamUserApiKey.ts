/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from "pg-promise";
import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleParams from "../../../shared/modules/Params/ModuleParams";

export default class Patch20240227AddParamUserApiKey implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240227AddParamUserApiKey {
        if (!Patch20240227AddParamUserApiKey.instance) {
            Patch20240227AddParamUserApiKey.instance = new Patch20240227AddParamUserApiKey();
        }
        return Patch20240227AddParamUserApiKey.instance;
    }

    private static instance: Patch20240227AddParamUserApiKey = null;

    get uid(): string {
        return 'Patch20240227AddParamUserApiKey';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValueAsBoolean(ModuleAccessPolicy.PARAM_NAME_ACTIVATED_USER_API_KEY, false);
    }
}
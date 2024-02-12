/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230517InitParamsStats implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20230517InitParamsStats {
        if (!Patch20230517InitParamsStats.instance) {
            Patch20230517InitParamsStats.instance = new Patch20230517InitParamsStats();
        }
        return Patch20230517InitParamsStats.instance;
    }

    private static instance: Patch20230517InitParamsStats = null;

    get uid(): string {
        return 'Patch20230517InitParamsStats';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        await ModuleParams.getInstance().setParamValueAsNumber("StatsController.UNSTACK_THROTTLE_SERVER", 60000);
        await ModuleParams.getInstance().setParamValueAsNumber("StatsController.UNSTACK_THROTTLE_CLIENT", 5000);
    }
}
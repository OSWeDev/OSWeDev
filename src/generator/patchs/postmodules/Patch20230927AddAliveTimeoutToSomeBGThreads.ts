/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import BGThreadServerController from '../../../server/modules/BGThread/BGThreadServerController';
import VarsBGThreadNameHolder from '../../../server/modules/Var/VarsBGThreadNameHolder';
import AccessPolicyDeleteSessionBGThread from '../../../server/modules/AccessPolicy/bgthreads/AccessPolicyDeleteSessionBGThread';
import DataImportBGThread from '../../../server/modules/DataImport/bgthreads/DataImportBGThread';
import MaintenanceBGThread from '../../../server/modules/Maintenance/bgthreads/MaintenanceBGThread';
import StatsInvalidatorBGThread from '../../../server/modules/Stats/bgthreads/StatsInvalidatorBGThread';
import StatsUnstackerBGThread from '../../../server/modules/Stats/bgthreads/StatsUnstackerBGThread';
import SupervisionBGThread from '../../../server/modules/Supervision/bgthreads/SupervisionBGThread';

export default class Patch20230927AddAliveTimeoutToSomeBGThreads implements IGeneratorWorker {

    public static getInstance(): Patch20230927AddAliveTimeoutToSomeBGThreads {
        if (!Patch20230927AddAliveTimeoutToSomeBGThreads.instance) {
            Patch20230927AddAliveTimeoutToSomeBGThreads.instance = new Patch20230927AddAliveTimeoutToSomeBGThreads();
        }
        return Patch20230927AddAliveTimeoutToSomeBGThreads.instance;
    }

    private static instance: Patch20230927AddAliveTimeoutToSomeBGThreads = null;

    get uid(): string {
        return 'Patch20230927AddAliveTimeoutToSomeBGThreads';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        // 10 minutes pour le timeout sur les vars. ça ne devrait plus arriver en fait
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + VarsBGThreadNameHolder.bgthread_name,
            10 * 60
        );

        // les threads dont les actions sont beaucoup plus courtes que l'attente, on met un simple garde-fou très lointain
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + AccessPolicyDeleteSessionBGThread.getInstance().name,
            AccessPolicyDeleteSessionBGThread.getInstance().MAX_timeout * 100
        );
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + MaintenanceBGThread.getInstance().name,
            MaintenanceBGThread.getInstance().MAX_timeout * 100
        );
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + StatsInvalidatorBGThread.getInstance().name,
            StatsInvalidatorBGThread.getInstance().MAX_timeout * 100
        );
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + StatsUnstackerBGThread.getInstance().name,
            StatsUnstackerBGThread.getInstance().MAX_timeout * 100
        );
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + SupervisionBGThread.getInstance().name,
            SupervisionBGThread.getInstance().MAX_timeout * 100
        );

        // 5 heures pour le timeout sur les imports => attention un import de plus de 5 heures sera considéré comme mort du coup, c'est juste un garde-fou
        await ModuleParams.getInstance().setParamValueAsNumber(
            BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + DataImportBGThread.getInstance().name,
            60 * 60 * 5
        );
    }
}
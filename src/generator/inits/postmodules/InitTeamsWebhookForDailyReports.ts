/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleTeamsAPIServer from '../../../server/modules/TeamsAPI/ModuleTeamsAPIServer';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class InitTeamsWebhookForDailyReports implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): InitTeamsWebhookForDailyReports {
        if (!InitTeamsWebhookForDailyReports.instance) {
            InitTeamsWebhookForDailyReports.instance = new InitTeamsWebhookForDailyReports();
        }
        return InitTeamsWebhookForDailyReports.instance;
    }

    private static instance: InitTeamsWebhookForDailyReports = null;

    get uid(): string {
        return 'InitTeamsWebhookForDailyReports';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValue(ModuleTeamsAPIServer.TEAMS_HOST_PARAM_NAME, 'outlook.office.com');
    }
}
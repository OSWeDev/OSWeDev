/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleTeamsAPIServer from '../../../server/modules/TeamsAPI/ModuleTeamsAPIServer';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200914InitTeamsWebhookForDailyReports implements IGeneratorWorker {

    public static getInstance(): Patch20200914InitTeamsWebhookForDailyReports {
        if (!Patch20200914InitTeamsWebhookForDailyReports.instance) {
            Patch20200914InitTeamsWebhookForDailyReports.instance = new Patch20200914InitTeamsWebhookForDailyReports();
        }
        return Patch20200914InitTeamsWebhookForDailyReports.instance;
    }

    private static instance: Patch20200914InitTeamsWebhookForDailyReports = null;

    get uid(): string {
        return 'Patch20200914InitTeamsWebhookForDailyReports';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValue(ModuleTeamsAPIServer.TEAMS_HOST_PARAM_NAME, 'outlook.office.com');
    }
}
/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231120AddUniqCronPlanificationUID implements IGeneratorWorker {

    public static getInstance(): Patch20231120AddUniqCronPlanificationUID {
        if (!Patch20231120AddUniqCronPlanificationUID.instance) {
            Patch20231120AddUniqCronPlanificationUID.instance = new Patch20231120AddUniqCronPlanificationUID();
        }
        return Patch20231120AddUniqCronPlanificationUID.instance;
    }

    private static instance: Patch20231120AddUniqCronPlanificationUID = null;

    get uid(): string {
        return 'Patch20231120AddUniqCronPlanificationUID';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("delete from ref.module_cron_cronworkplan where id in (select a.id  from ref.module_cron_cronworkplan a join ref.module_cron_cronworkplan b on a.id < b.id where a.planification_uid = b.planification_uid);");
            await db.query('ALTER TABLE ref.module_cron_cronworkplan ADD CONSTRAINT uniq_planification_uid UNIQUE (planification_uid);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
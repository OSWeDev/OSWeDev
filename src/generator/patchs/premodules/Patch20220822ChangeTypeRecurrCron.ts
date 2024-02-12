/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220822ChangeTypeRecurrCron implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20220822ChangeTypeRecurrCron {
        if (!Patch20220822ChangeTypeRecurrCron.instance) {
            Patch20220822ChangeTypeRecurrCron.instance = new Patch20220822ChangeTypeRecurrCron();
        }
        return Patch20220822ChangeTypeRecurrCron.instance;
    }

    private static instance: Patch20220822ChangeTypeRecurrCron = null;

    get uid(): string {
        return 'Patch20220822ChangeTypeRecurrCron';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 1 where type_recurrence = 10;");
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 2 where type_recurrence = 20;");
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 3 where type_recurrence = 30;");
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 4 where type_recurrence = 40;");
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 5 where type_recurrence = 50;");
            await db.none("update ref.module_cron_cronworkplan set type_recurrence = 6 where type_recurrence = 60;");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
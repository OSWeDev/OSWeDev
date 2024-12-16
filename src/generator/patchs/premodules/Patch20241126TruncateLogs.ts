/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241126TruncateLogs implements IGeneratorWorker {

    private static instance: Patch20241126TruncateLogs = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241126TruncateLogs';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241126TruncateLogs {
        if (!Patch20241126TruncateLogs.instance) {
            Patch20241126TruncateLogs.instance = new Patch20241126TruncateLogs();
        }
        return Patch20241126TruncateLogs.instance;
    }

    public async work(db: IDatabase<any>) {
        for (let i = 0; i < 5; i++) {
            try {
                await db.query('TRUNCATE TABLE module_logger_logger_log.module_logger_logger_log_' + i + ' CASCADE');
            } catch (error) {
                ConsoleHandler.log('Possible que la table n\'existe pas encore, pas grave');
            }
        }
    }
}
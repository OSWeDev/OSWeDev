/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241126TruncateLogsUpdated20122024 implements IGeneratorWorker {

    private static instance: Patch20241126TruncateLogsUpdated20122024 = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241126TruncateLogsUpdated20122024';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241126TruncateLogsUpdated20122024 {
        if (!Patch20241126TruncateLogsUpdated20122024.instance) {
            Patch20241126TruncateLogsUpdated20122024.instance = new Patch20241126TruncateLogsUpdated20122024();
        }
        return Patch20241126TruncateLogsUpdated20122024.instance;
    }

    public async work(db: IDatabase<any>) {
        try {

            await db.query(`DO $$
                DECLARE
                    table_record RECORD;
                BEGIN
                    FOR table_record IN
                        SELECT tablename
                        FROM pg_tables
                        WHERE schemaname = 'module_logger_logger_log'
                    LOOP
                        EXECUTE 'TRUNCATE TABLE module_logger_logger_log.'
                            || quote_ident(table_record.tablename)
                            || ' CASCADE';
                    END LOOP;
                END;
                $$;
            `);
        } catch (error) {
            ConsoleHandler.log('Possible que la table n\'existe pas encore, pas grave');
        }
    }
}
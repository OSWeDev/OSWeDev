/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20122024TruncateLogsUpdated implements IGeneratorWorker {

    private static instance: Patch20122024TruncateLogsUpdated = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20122024TruncateLogsUpdated';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20122024TruncateLogsUpdated {
        if (!Patch20122024TruncateLogsUpdated.instance) {
            Patch20122024TruncateLogsUpdated.instance = new Patch20122024TruncateLogsUpdated();
        }
        return Patch20122024TruncateLogsUpdated.instance;
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
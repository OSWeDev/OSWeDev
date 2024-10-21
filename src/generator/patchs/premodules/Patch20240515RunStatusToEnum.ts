/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240515RunStatusToEnum implements IGeneratorWorker {


    private static instance: Patch20240515RunStatusToEnum = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240515RunStatusToEnum';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240515RunStatusToEnum {
        if (!Patch20240515RunStatusToEnum.instance) {
            Patch20240515RunStatusToEnum.instance = new Patch20240515RunStatusToEnum();
        }
        return Patch20240515RunStatusToEnum.instance;
    }

    public async work(db: IDatabase<any>) {
        try {

            await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_run ADD COLUMN status_int INTEGER;');
            await db.query("UPDATE ref.module_gpt_gpt_assistant_run SET status_int = " +
                "CASE status " +
                "WHEN 'queued' THEN 0 " +
                "WHEN 'in_progress' THEN 1 " +
                "WHEN 'requires_action' THEN 2 " +
                "WHEN 'cancelling' THEN 3 " +
                "WHEN 'cancelled' THEN 4 " +
                "WHEN 'failed' THEN 5 " +
                "WHEN 'completed' THEN 6 " +
                "WHEN 'incomplete' THEN 7 " +
                "WHEN 'expired' THEN 8 " +
                "END;");
            await db.query("ALTER TABLE ref.module_gpt_gpt_assistant_run DROP COLUMN status;");
            await db.query("ALTER TABLE ref.module_gpt_gpt_assistant_run RENAME COLUMN status_int TO status;");
        } catch (error) {
            ConsoleHandler.warn('Patch20240515RunStatusToEnum: OK sur montée de version depuis 0.31.x ou <');
        }
    }
}
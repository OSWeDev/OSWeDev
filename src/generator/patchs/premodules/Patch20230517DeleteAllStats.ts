/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230517DeleteAllStats implements IGeneratorWorker {

    public static getInstance(): Patch20230517DeleteAllStats {
        if (!Patch20230517DeleteAllStats.instance) {
            Patch20230517DeleteAllStats.instance = new Patch20230517DeleteAllStats();
        }
        return Patch20230517DeleteAllStats.instance;
    }

    private static instance: Patch20230517DeleteAllStats = null;

    get uid(): string {
        return 'Patch20230517DeleteAllStats';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("DROP SCHEMA IF EXISTS module_stats_stat CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_thread CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_category CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_event CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_subcategory CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_type CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stat CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_groupe_sec_dr CASCADE;");
            await db.query("DROP TABLE IF EXISTS ref.module_stats_stats_groupe CASCADE;");

        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
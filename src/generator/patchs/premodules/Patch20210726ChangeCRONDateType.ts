/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20210726ChangeCRONDateType implements IGeneratorWorker {

    public static getInstance(): Patch20210726ChangeCRONDateType {
        if (!Patch20210726ChangeCRONDateType.instance) {
            Patch20210726ChangeCRONDateType.instance = new Patch20210726ChangeCRONDateType();
        }
        return Patch20210726ChangeCRONDateType.instance;
    }

    private static instance: Patch20210726ChangeCRONDateType = null;

    get uid(): string {
        return 'Patch20210726ChangeCRONDateType';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de module_cron_cronworkplan en tstz :
     * date_heure_planifiee
     */
    public async work(db: IDatabase<any>) {
        try {
            await this.change_type_column_date_to_tstz(db, 'ref.module_cron_cronworkplan', 'date_heure_planifiee');
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }

    private async change_type_column_date_to_tstz(db: IDatabase<any>, table_full_name: string, column_name: string) {
        await db.none("alter table " + table_full_name + " add column " + column_name + "__tmp__ bigint;");
        await db.none("update " + table_full_name + " set " + column_name + "__tmp__ = extract(epoch from " + column_name + ":: date);");
        await db.none("alter table " + table_full_name + " drop column " + column_name + ";");
        await db.none("alter table " + table_full_name + " rename column " + column_name + "__tmp__ to " + column_name + ";");
    }
}
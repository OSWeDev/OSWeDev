/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210803ChangeDIHDateType implements IGeneratorWorker {

    public static getInstance(): Patch20210803ChangeDIHDateType {
        if (!Patch20210803ChangeDIHDateType.instance) {
            Patch20210803ChangeDIHDateType.instance = new Patch20210803ChangeDIHDateType();
        }
        return Patch20210803ChangeDIHDateType.instance;
    }

    private static instance: Patch20210803ChangeDIHDateType = null;

    get uid(): string {
        return 'Patch20210803ChangeDIHDateType';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await this.change_type_column_date_to_tstz(db, 'ref.module_data_import_dih', 'segment_date_index');
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
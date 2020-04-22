import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

/* istanbul ignore next: no unit tests on patchs */
export default class Patch20191008ChangeDILDateType implements IGeneratorWorker {

    public static getInstance(): Patch20191008ChangeDILDateType {
        if (!Patch20191008ChangeDILDateType.instance) {
            Patch20191008ChangeDILDateType.instance = new Patch20191008ChangeDILDateType();
        }
        return Patch20191008ChangeDILDateType.instance;
    }

    private static instance: Patch20191008ChangeDILDateType = null;

    get uid(): string {
        return 'Patch20191008ChangeDILDateType';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportLogVO en tstz :
     * date
     */
    public async work(db: IDatabase<any>) {
        try {
            await this.change_type_column_date_to_tstz(db, 'ref.module_data_import_dil', 'date');
        } catch (error) {
            console.error('Patch20191008ChangeDILDateType : ' + error);
        }
    }

    private async change_type_column_date_to_tstz(db: IDatabase<any>, table_full_name: string, column_name: string) {
        await db.none("alter table " + table_full_name + " add column " + column_name + "__tmp__ bigint;");
        await db.none("update " + table_full_name + " set " + column_name + "__tmp__ = extract(epoch from " + column_name + ":: date);");
        await db.none("alter table " + table_full_name + " drop column " + column_name + ";");
        await db.none("alter table " + table_full_name + " rename column " + column_name + "__tmp__ to " + column_name + ";");
    }
}
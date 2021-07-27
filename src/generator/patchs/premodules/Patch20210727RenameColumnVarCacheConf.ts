/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210727RenameColumnVarCacheConf implements IGeneratorWorker {

    public static getInstance(): Patch20210727RenameColumnVarCacheConf {
        if (!Patch20210727RenameColumnVarCacheConf.instance) {
            Patch20210727RenameColumnVarCacheConf.instance = new Patch20210727RenameColumnVarCacheConf();
        }
        return Patch20210727RenameColumnVarCacheConf.instance;
    }

    private static instance: Patch20210727RenameColumnVarCacheConf = null;

    get uid(): string {
        return 'Patch20210727RenameColumnVarCacheConf';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.none('ALTER TABLE ref.module_var_var_cache_conf RENAME COLUMN cache_timeout_ms TO cache_timeout_secs;');
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
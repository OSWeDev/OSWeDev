/* istanbul ignore file: not a usefull test to write */

import { IDatabase } from 'pg-promise';

export default class GeneratorPreModulesPatchDBController {

    public static getInstance(): GeneratorPreModulesPatchDBController {
        if (!GeneratorPreModulesPatchDBController.instance) {
            GeneratorPreModulesPatchDBController.instance = new GeneratorPreModulesPatchDBController();
        }
        return GeneratorPreModulesPatchDBController.instance;
    }

    protected static instance: GeneratorPreModulesPatchDBController = null;

    private constructor() { }

    public async drop_table(db: IDatabase<any>, table_name: string) {
        try {
            if ((!table_name) || (table_name.indexOf(';') >= 0) || (table_name.indexOf(' ') >= 0)) {
                return null;
            }
            await db.none("DROP TABLE " + table_name + ";");
        } catch (error) {
            console.error('Si erreur != table ou colonne inexistante, il faut regarder manuellement :' + error);
        }
    }

    public async drop_column(db: IDatabase<any>, table_name: string, column_name: string) {
        try {
            if ((!table_name) || (table_name.indexOf(';') >= 0) || (table_name.indexOf(' ') >= 0)) {
                return null;
            }
            if ((!column_name) || (column_name.indexOf(';') >= 0) || (column_name.indexOf(' ') >= 0)) {
                return null;
            }
            await db.none("ALTER TABLE " + table_name + " DROP COLUMN " + column_name + ";");
        } catch (error) {
            console.error('Si erreur != table ou colonne inexistante, il faut regarder manuellement :' + error);
        }
    }
}
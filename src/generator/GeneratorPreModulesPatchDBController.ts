import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../shared/tools/ConsoleHandler';

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
            await db.none("DROP TABLE " + table_name + ";");
        } catch (error) {
            ConsoleHandler.getInstance().error('Si erreur != table ou colonne inexistante, il faut regarder manuellement :' + error);
        }
    }

    public async drop_column(db: IDatabase<any>, table_name: string, column_name: string) {
        try {
            await db.none("ALTER TABLE " + table_name + " DROP COLUMN " + column_name + ";");
        } catch (error) {
            ConsoleHandler.getInstance().error('Si erreur != table ou colonne inexistante, il faut regarder manuellement :' + error);
        }
    }
}
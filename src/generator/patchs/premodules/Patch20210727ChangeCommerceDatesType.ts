/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210727ChangeCommerceDatesType implements IGeneratorWorker {

    public static getInstance(): Patch20210727ChangeCommerceDatesType {
        if (!Patch20210727ChangeCommerceDatesType.instance) {
            Patch20210727ChangeCommerceDatesType.instance = new Patch20210727ChangeCommerceDatesType();
        }
        return Patch20210727ChangeCommerceDatesType.instance;
    }

    private static instance: Patch20210727ChangeCommerceDatesType = null;

    get uid(): string {
        return 'Patch20210727ChangeCommerceDatesType';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await this.change_type_column_date_to_tstz(db, 'ref.module_commerce_commande_commerce_commande', 'date');
            await this.change_type_column_date_to_tstz(db, 'ref.module_commerce_abonnement_commerce_abonnement', 'echeance');
            await this.change_type_column_date_to_tstz(db, 'ref.module_commerce_abonnement_commerce_abonnement', 'resiliation');
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
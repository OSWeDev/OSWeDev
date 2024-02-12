/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20220222RemoveVorfieldreffrombdd implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20220222RemoveVorfieldreffrombdd {
        if (!Patch20220222RemoveVorfieldreffrombdd.instance) {
            Patch20220222RemoveVorfieldreffrombdd.instance = new Patch20220222RemoveVorfieldreffrombdd();
        }
        return Patch20220222RemoveVorfieldreffrombdd.instance;
    }

    private static instance: Patch20220222RemoveVorfieldreffrombdd = null;

    get uid(): string {
        return 'Patch20220222RemoveVorfieldreffrombdd';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('DELETE from ref.module_dashboardbuilder_vo_field_ref;');
            await db.query('DELETE from ref.module_dashboardbuilder_table_column_desc;');
        } catch (error) {
            ConsoleHandler.log('Patch20220222RemoveVorfieldreffrombdd error ' + error);
        }
    }
}
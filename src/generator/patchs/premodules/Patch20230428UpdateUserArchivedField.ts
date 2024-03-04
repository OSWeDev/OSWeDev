/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230428UpdateUserArchivedField implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20230428UpdateUserArchivedField {
        if (!Patch20230428UpdateUserArchivedField.instance) {
            Patch20230428UpdateUserArchivedField.instance = new Patch20230428UpdateUserArchivedField();
        }
        return Patch20230428UpdateUserArchivedField.instance;
    }

    private static instance: Patch20230428UpdateUserArchivedField = null;

    get uid(): string {
        return 'Patch20230428UpdateUserArchivedField';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("UPDATE ref.user SET archived=false WHERE archived is NULL;");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
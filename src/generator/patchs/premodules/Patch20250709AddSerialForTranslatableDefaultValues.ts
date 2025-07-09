/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250709AddSerialForTranslatableDefaultValues implements IGeneratorWorker {

    private static instance: Patch20250709AddSerialForTranslatableDefaultValues = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250709AddSerialForTranslatableDefaultValues';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250709AddSerialForTranslatableDefaultValues {
        if (!Patch20250709AddSerialForTranslatableDefaultValues.instance) {
            Patch20250709AddSerialForTranslatableDefaultValues.instance = new Patch20250709AddSerialForTranslatableDefaultValues();
        }
        return Patch20250709AddSerialForTranslatableDefaultValues.instance;
    }


    public async work(db: IDatabase<any>) {
        await db.query("CREATE SEQUENCE IF NOT EXISTS global_translatable_string_default_value_seq;");
    }
}
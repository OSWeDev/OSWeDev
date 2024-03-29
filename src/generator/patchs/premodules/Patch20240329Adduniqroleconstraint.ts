/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329Adduniqroleconstraint implements IGeneratorWorker {

    private static instance: Patch20240329Adduniqroleconstraint = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329Adduniqroleconstraint';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329Adduniqroleconstraint {
        if (!Patch20240329Adduniqroleconstraint.instance) {
            Patch20240329Adduniqroleconstraint.instance = new Patch20240329Adduniqroleconstraint();
        }
        return Patch20240329Adduniqroleconstraint.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_access_policy_role ADD CONSTRAINT uniq_module_access_policy_role_translatable_name UNIQUE (translatable_name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}
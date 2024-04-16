/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329Adduniquserconstraints implements IGeneratorWorker {


    private static instance: Patch20240329Adduniquserconstraints = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329Adduniquserconstraints';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329Adduniquserconstraints {
        if (!Patch20240329Adduniquserconstraints.instance) {
            Patch20240329Adduniquserconstraints.instance = new Patch20240329Adduniquserconstraints();
        }
        return Patch20240329Adduniquserconstraints.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.user ADD CONSTRAINT uniq_user_email UNIQUE (email);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
        try {
            await db.query('ALTER TABLE ref.user ADD CONSTRAINT uniq_user_phone UNIQUE (phone);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
        try {
            await db.query('ALTER TABLE ref.user ADD CONSTRAINT uniq_user_name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}
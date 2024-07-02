/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240415Adduniqmail_id implements IGeneratorWorker {


    private static instance: Patch20240415Adduniqmail_id = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240415Adduniqmail_id';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240415Adduniqmail_id {
        if (!Patch20240415Adduniqmail_id.instance) {
            Patch20240415Adduniqmail_id.instance = new Patch20240415Adduniqmail_id();
        }
        return Patch20240415Adduniqmail_id.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_mailer_mail ADD CONSTRAINT uniq__module_mailer_mail__message_id UNIQUE (message_id);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}
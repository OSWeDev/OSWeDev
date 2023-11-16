/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231116AddUniqPhoneUserConstraint implements IGeneratorWorker {

    public static getInstance(): Patch20231116AddUniqPhoneUserConstraint {
        if (!Patch20231116AddUniqPhoneUserConstraint.instance) {
            Patch20231116AddUniqPhoneUserConstraint.instance = new Patch20231116AddUniqPhoneUserConstraint();
        }
        return Patch20231116AddUniqPhoneUserConstraint.instance;
    }

    private static instance: Patch20231116AddUniqPhoneUserConstraint = null;

    get uid(): string {
        return 'Patch20231116AddUniqPhoneUserConstraint';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("update ref.user set phone = null where id in (select a.id  from ref.user a join ref.user b on a.id < b.id where a.phone = b.phone);");
            await db.query('select b.id, a.* from ref.user a join ref.user b on a.id < b.id where a.phone = b.phone;');
            await db.query('ALTER TABLE ref.user ADD CONSTRAINT uniq_phone UNIQUE (phone);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
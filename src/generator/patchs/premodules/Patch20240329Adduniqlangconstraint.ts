/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329Adduniqlangconstraint implements IGeneratorWorker {

    private static instance: Patch20240329Adduniqlangconstraint = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329Adduniqlangconstraint';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329Adduniqlangconstraint {
        if (!Patch20240329Adduniqlangconstraint.instance) {
            Patch20240329Adduniqlangconstraint.instance = new Patch20240329Adduniqlangconstraint();
        }
        return Patch20240329Adduniqlangconstraint.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_translation_lang ADD CONSTRAINT uniq_module_translation_lang_code_lang UNIQUE (code_lang);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}
/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329Adduniqtranslatabletextconstraint implements IGeneratorWorker {

    private static instance: Patch20240329Adduniqtranslatabletextconstraint = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329Adduniqtranslatabletextconstraint';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329Adduniqtranslatabletextconstraint {
        if (!Patch20240329Adduniqtranslatabletextconstraint.instance) {
            Patch20240329Adduniqtranslatabletextconstraint.instance = new Patch20240329Adduniqtranslatabletextconstraint();
        }
        return Patch20240329Adduniqtranslatabletextconstraint.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_translation_translatable_text ADD CONSTRAINT uniq_module_translation_translatable_text_code_lang UNIQUE (code_text);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}
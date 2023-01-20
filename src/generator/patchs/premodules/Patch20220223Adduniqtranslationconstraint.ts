/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220223Adduniqtranslationconstraint implements IGeneratorWorker {

    public static getInstance(): Patch20220223Adduniqtranslationconstraint {
        if (!Patch20220223Adduniqtranslationconstraint.instance) {
            Patch20220223Adduniqtranslationconstraint.instance = new Patch20220223Adduniqtranslationconstraint();
        }
        return Patch20220223Adduniqtranslationconstraint.instance;
    }

    private static instance: Patch20220223Adduniqtranslationconstraint = null;

    get uid(): string {
        return 'Patch20220223Adduniqtranslationconstraint';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_translation_translation ADD CONSTRAINT uniq_translation UNIQUE (lang_id, text_id);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
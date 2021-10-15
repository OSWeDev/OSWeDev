/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20211004ChangeLang implements IGeneratorWorker {

    public static getInstance(): Patch20211004ChangeLang {
        if (!Patch20211004ChangeLang.instance) {
            Patch20211004ChangeLang.instance = new Patch20211004ChangeLang();
        }
        return Patch20211004ChangeLang.instance;
    }

    private static instance: Patch20211004ChangeLang = null;

    get uid(): string {
        return 'Patch20211004ChangeLang';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.query("UPDATE ref.module_translation_lang set code_lang='fr-fr' where code_lang='fr';");
            await db.query("UPDATE ref.module_translation_lang set code_lang='en-us' where code_lang='en';");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}
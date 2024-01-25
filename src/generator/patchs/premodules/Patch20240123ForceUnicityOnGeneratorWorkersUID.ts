/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240123ForceUnicityOnGeneratorWorkersUID implements IGeneratorWorker {

    public static getInstance(): Patch20240123ForceUnicityOnGeneratorWorkersUID {
        if (!Patch20240123ForceUnicityOnGeneratorWorkersUID.instance) {
            Patch20240123ForceUnicityOnGeneratorWorkersUID.instance = new Patch20240123ForceUnicityOnGeneratorWorkersUID();
        }
        return Patch20240123ForceUnicityOnGeneratorWorkersUID.instance;
    }

    private static instance: Patch20240123ForceUnicityOnGeneratorWorkersUID = null;

    get uid(): string {
        return 'Patch20240123ForceUnicityOnGeneratorWorkersUID';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.none('DELETE FROM generator.workers ' +
                'WHERE id NOT IN ( ' +
                'SELECT MIN(id) ' +
                'FROM generator.workers ' +
                'GROUP BY uid ' +
                ');');
            await db.none('ALTER TABLE generator.workers ' +
                'ADD CONSTRAINT uid_unique UNIQUE(uid);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
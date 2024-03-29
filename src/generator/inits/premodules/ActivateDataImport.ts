/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class ActivateDataImport implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): ActivateDataImport {
        if (!ActivateDataImport.instance) {
            ActivateDataImport.instance = new ActivateDataImport();
        }
        return ActivateDataImport.instance;
    }

    private static instance: ActivateDataImport = null;

    get uid(): string {
        return 'ActivateDataImport';
    }

    private constructor() { }

    /**
     * Objectif : Forcer le module import actif pour les anciens projets, maintenant que le module de trad l'utilise
     */
    public async work(db: IDatabase<any>) {
        try {

            await db.none("update admin.modules set actif = true where name = 'data_import';");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}
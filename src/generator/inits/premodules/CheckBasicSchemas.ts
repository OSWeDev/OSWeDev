/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CheckBasicSchemas implements IGeneratorWorker {

    public static getInstance(): CheckBasicSchemas {
        if (!CheckBasicSchemas.instance) {
            CheckBasicSchemas.instance = new CheckBasicSchemas();
        }
        return CheckBasicSchemas.instance;
    }

    private static instance: CheckBasicSchemas = null;

    get uid(): string {
        return 'CheckBasicSchemas';
    }

    private constructor() { }

    /**
     * Objectif : on crée les schémas qui sont nécessaires et qui manquent au besoin
     */
    public async work(db: IDatabase<any>) {
        try {

            await db.none("CREATE SCHEMA IF NOT EXISTS admin");
            await db.none("CREATE SCHEMA IF NOT EXISTS generator");
            await db.none("CREATE SCHEMA IF NOT EXISTS ref");
        } catch (error) {
            console.error('CheckBasicSchemas : ' + error);
        }
    }
}
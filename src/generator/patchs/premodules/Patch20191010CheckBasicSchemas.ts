import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

/* istanbul ignore next: no unit tests on patchs */
export default class Patch20191010CheckBasicSchemas implements IGeneratorWorker {

    public static getInstance(): Patch20191010CheckBasicSchemas {
        if (!Patch20191010CheckBasicSchemas.instance) {
            Patch20191010CheckBasicSchemas.instance = new Patch20191010CheckBasicSchemas();
        }
        return Patch20191010CheckBasicSchemas.instance;
    }

    private static instance: Patch20191010CheckBasicSchemas = null;

    get uid(): string {
        return 'Patch20191010CheckBasicSchemas';
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
            console.error('Patch20191010CheckBasicSchemas : ' + error);
        }
    }
}
import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20191202GeoPoint implements IGeneratorWorker {

    public static getInstance(): Patch20191202GeoPoint {
        if (!Patch20191202GeoPoint.instance) {
            Patch20191202GeoPoint.instance = new Patch20191202GeoPoint();
        }
        return Patch20191202GeoPoint.instance;
    }

    private static instance: Patch20191202GeoPoint = null;

    get uid(): string {
        return 'Patch20191202GeoPoint';
    }

    private constructor() { }

    /**
     * Objectif : Checker les extensions PGSQL obligatoires
     * L'ajout nécessite un compte admin donc à faire manuellement quand on crée la base
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.one("create extension cube;");
        } catch (error) { }

        try {
            await db.one("create extension earthdistance;");
        } catch (error) { }
    }
}
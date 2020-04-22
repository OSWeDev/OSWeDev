/* istanbul ignore file: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20191112CheckExtensions implements IGeneratorWorker {

    public static getInstance(): Patch20191112CheckExtensions {
        if (!Patch20191112CheckExtensions.instance) {
            Patch20191112CheckExtensions.instance = new Patch20191112CheckExtensions();
        }
        return Patch20191112CheckExtensions.instance;
    }

    private static instance: Patch20191112CheckExtensions = null;

    get uid(): string {
        return 'Patch20191112CheckExtensions';
    }

    private constructor() { }

    /**
     * Objectif : Checker les extensions PGSQL obligatoires
     * L'ajout nécessite un compte admin donc à faire manuellement quand on crée la base
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.one("SELECT * FROM pg_extension where extname = 'btree_gist';");
            await db.one("SELECT * FROM pg_extension where extname = 'pgcrypto';");
        } catch (error) {
            ConsoleHandler.getInstance().error('Les extensions suivantes sont obligatoires: "btree_gist" et "pgcrypto". Erreur: ' + error);
            throw new Error('Les extensions suivantes sont obligatoires: "btree_gist" et "pgcrypto".');
        }
    }
}
/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

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
            await db.query("CREATE EXTENSION IF NOT EXISTS btree_gist;");
            await db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
            await db.query("ALTER ROLE " + ConfigurationService.getInstance().getNodeConfiguration().BDD_OWNER + " NOSUPERUSER;");

        } catch (error) {
            ConsoleHandler.getInstance().error('Le rôle de la base doit être initialement configuré en superuser. Ce patch supprime ensuite le droit superuser. Les extensions suivantes sont obligatoires: "btree_gist" et "pgcrypto". Erreur: ' + error);
            throw new Error('Les extensions suivantes sont obligatoires: "btree_gist" et "pgcrypto".');
        }
    }
}
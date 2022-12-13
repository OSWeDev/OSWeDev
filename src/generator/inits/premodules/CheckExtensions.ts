/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CheckExtensions implements IGeneratorWorker {

    public static getInstance(): CheckExtensions {
        if (!CheckExtensions.instance) {
            CheckExtensions.instance = new CheckExtensions();
        }
        return CheckExtensions.instance;
    }

    private static instance: CheckExtensions = null;

    get uid(): string {
        return 'CheckExtensions';
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
            await db.query("CREATE EXTENSION IF NOT EXISTS cube;");
            await db.query("CREATE EXTENSION IF NOT EXISTS earthdistance;");
            await db.query("ALTER ROLE " + ConfigurationService.getInstance().node_configuration.BDD_OWNER + " NOSUPERUSER;");

        } catch (error) {
            ConsoleHandler.error('Le rôle de la base doit être initialement configuré en superuser. Ce patch supprime ensuite le droit superuser. Les extensions suivantes sont obligatoires: "btree_gist", "pgcrypto", "cube", "earthdistance". Erreur: ' + error);
            throw new Error('Les extensions suivantes sont obligatoires: "btree_gist", "pgcrypto", "cube", "earthdistance".');
        }
    }
}
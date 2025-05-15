/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CheckExtensionsV2 implements IGeneratorWorker {

    private static instance: CheckExtensionsV2 = null;

    get uid(): string {
        return 'CheckExtensionsV2';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): CheckExtensionsV2 {
        if (!CheckExtensionsV2.instance) {
            CheckExtensionsV2.instance = new CheckExtensionsV2();
        }
        return CheckExtensionsV2.instance;
    }

    private constructor() { }

    /**
     * Objectif : Checker les extensions PGSQL obligatoires
     * L'ajout nécessite un compte admin donc à faire manuellement quand on crée la base
     */
    public async work(db: IDatabase<any>) {
        try {
            let alter_role: number = 0;

            alter_role += (await this.add_extension_if_not_exists(db, "btree_gist"));
            alter_role += (await this.add_extension_if_not_exists(db, "pgcrypto"));
            alter_role += (await this.add_extension_if_not_exists(db, "cube"));
            alter_role += (await this.add_extension_if_not_exists(db, "earthdistance"));
            alter_role += (await this.add_extension_if_not_exists(db, "pg_trgm"));

            const rolsuper_q = await db.query("SELECT rolsuper FROM pg_roles WHERE rolname = '" + ConfigurationService.node_configuration.bdd_owner + "';");
            if (
                rolsuper_q?.length &&
                rolsuper_q[0]?.rolsuper &&
                (alter_role > 0)
            ) {
                await db.query("ALTER ROLE " + ConfigurationService.node_configuration.bdd_owner + " NOSUPERUSER;");
            }

        } catch (error) {
            ConsoleHandler.error('Le rôle de la base doit être initialement configuré en superuser. Ce patch supprime ensuite le droit superuser. Les extensions suivantes sont obligatoires: "btree_gist", "pgcrypto", "cube", "earthdistance". Erreur: ' + error);
            throw new Error('Les extensions suivantes sont obligatoires: "btree_gist", "pgcrypto", "cube", "earthdistance", "pg_trgm".');
        }
    }

    public async add_extension_if_not_exists(db: IDatabase<any>, extname: string): Promise<number> {
        try {
            const ext_exist = await db.query("SELECT * FROM pg_extension WHERE extname='" + extname + "';");

            if (ext_exist?.length > 0) {
                return 0;
            }

            await db.query("CREATE EXTENSION IF NOT EXISTS " + extname + ";");
        } catch (error) {
            ConsoleHandler.error('Le rôle de la base doit être initialement configuré en superuser. Ce patch supprime ensuite le droit superuser. L\'extension suivante est obligatoire: "' + extname + '". Erreur: ' + error);
            throw new Error('L\'extension suivante est obligatoire: "' + extname + '"');
        }

        return 1;
    }
}
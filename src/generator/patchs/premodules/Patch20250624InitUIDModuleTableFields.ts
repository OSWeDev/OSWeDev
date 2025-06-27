/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250624InitUIDModuleTableFields implements IGeneratorWorker {
    private static instance: Patch20250624InitUIDModuleTableFields = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250624InitUIDModuleTableFields';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250624InitUIDModuleTableFields {
        if (!Patch20250624InitUIDModuleTableFields.instance) {
            Patch20250624InitUIDModuleTableFields.instance = new Patch20250624InitUIDModuleTableFields();
        }
        return Patch20250624InitUIDModuleTableFields.instance;
    }

    public async work(db: IDatabase<any>) {
        // Cas des nouveaux projets : si la table module_dao_module_table_field n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dao_module_table_field');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250624InitUIDModuleTableFields: Table "module_dao_module_table_field" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs titre existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs titre dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne titre
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dao_module_table_field' AND column_name = 'uid';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250624InitUIDModuleTableFields: Column "uid" already exists in "module_dao_module_table_field". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne uid (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // uid =  `${vo.module_table_vo_type}.${vo.field_name}`
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dao_module_table_field 
                ADD COLUMN uid TEXT NOT NULL DEFAULT 'N/A';
            `);
        // Maintenant on met à jour les titres des vos existants
        const vos = await db.query("SELECT id, module_table_vo_type, field_name FROM ref.module_dao_module_table_field;");
        if (vos && vos.length > 0) {
            for (const vo of vos) {
                const id = vo.id;
                const uid = `${vo.module_table_vo_type}.${vo.field_name}`;
                await db.query("UPDATE ref.module_dao_module_table_field SET uid = $1 WHERE id = $2;", [uid, id]);
            }
        }

        ConsoleHandler.log('Patch20250624InitUIDModuleTableFields: Successfully added "uid" column and initialized existing vos.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
                ALTER TABLE ref.module_dao_module_table_field 
                ALTER COLUMN uid DROP DEFAULT;
            `);

        // Dans le doute on néttoie les doublons sur cette table à ce stade, le champs va être passé en unique dans la foulée
        await db.query(`DELETE FROM ref.module_dao_module_table_field a
            USING ref.module_dao_module_table_field b
            WHERE a.uid = b.uid
            AND a.id < b.id;
        `);
    }
}
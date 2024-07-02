/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231030ImagePathUnique implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20231030ImagePathUnique {
        if (!Patch20231030ImagePathUnique.instance) {
            Patch20231030ImagePathUnique.instance = new Patch20231030ImagePathUnique();
        }
        return Patch20231030ImagePathUnique.instance;
    }

    private static instance: Patch20231030ImagePathUnique = null;

    get uid(): string {
        return 'Patch20231030ImagePathUnique';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {

            const path_rows = await db.query("select t2.path from ref.module_image_image t1 join ref.module_image_image t2 on t1.id < t2.id WHERE t1.path = t2.path;");
            if (path_rows && path_rows.length) {

                const unique_path_rows: { [path: string]: boolean } = {};
                for (const i in path_rows) {
                    const path_row = path_rows[i];
                    const path = path_row.path;

                    unique_path_rows[path] = true;
                }
                const paths: string[] = Object.keys(unique_path_rows);

                const ref_fields: Array<{
                    table: string,
                    field: string
                }> = await this.get_reffields(db);

                for (const i in paths) {
                    const path = paths[i];

                    ConsoleHandler.log('Patch20231030ImagePathUnique:work:' + i + '/' + paths.length + ':path:' + path);

                    const ids_rows = await db.query("select id from ref.module_image_image where path = $1 order by id desc", [path]);
                    if ((!ids_rows) || (!ids_rows.length) || (ids_rows.length < 2)) {
                        continue;
                    }

                    const kept_id = ids_rows[0].id;
                    const throwed_ids = [];
                    for (let j = 1; j < ids_rows.length; j++) {
                        const throwed_id = ids_rows[j].id;

                        throwed_ids.push(throwed_id);
                        for (const k in ref_fields) {
                            const ref_field = ref_fields[k];

                            await db.none("update " + ref_field.table + " set " + ref_field.field + " = $1 where " + ref_field.field + " = $2", [kept_id, throwed_id]);
                        }
                    }

                    // delete throwed ids
                    await db.none("delete from ref.module_image_image where id in (" + throwed_ids.join(',') + ")");
                }
            }


            // Généré par ChatGPT
            await db.query(`
            WITH Ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY path ORDER BY id DESC) as rn
                FROM ref.module_image_image
            )
            DELETE FROM ref.module_image_image
            WHERE id IN (
                SELECT id
                FROM Ranked
                WHERE rn > 1
            );

            DO $$
                DECLARE
                    v_constraint_exists BOOLEAN;
                BEGIN
                    -- Vérifier l'existence de la contrainte d'unicité sur la colonne path
                    SELECT EXISTS (
                        SELECT 1
                        FROM   pg_index i
                        JOIN   pg_class t ON t.oid = i.indrelid
                        JOIN   pg_namespace n ON n.oid = t.relnamespace
                        JOIN   pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
                        WHERE  n.nspname = 'ref'  -- Nom du schéma
                        AND    t.relname = 'module_image_image'  -- Nom de la table
                        AND    a.attname = 'path'  -- Nom de la colonne
                        AND    i.indisunique IS TRUE
                    ) INTO v_constraint_exists;

                    -- Si la contrainte n'existe pas, ajouter la contrainte d'unicité
                    IF NOT v_constraint_exists THEN
                        EXECUTE 'ALTER TABLE ref.module_image_image ADD UNIQUE (path);';
                    END IF;
            END $$;
            `);

        } catch (error) {
            ConsoleHandler.error('Ignore this error if new project: ' + error);
        }
    }

    private async get_reffields(db: IDatabase<any>): Promise<Array<{
        table: string,
        field: string
    }>> {

        const constraints_rows = await db.query("SELECT conrelid::regclass AS table_name, confrelid::regclass AS foreign_table_name, a.attname AS column_name, af.attname AS foreign_column_name " +
            "FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey) JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY (c.confkey) WHERE confrelid = 'ref.module_image_image'::regclass;");
        if ((!constraints_rows) || (!constraints_rows.length)) {
            return null;
        }

        const ref_fields: Array<{
            table: string,
            field: string
        }> = [];

        for (const i in constraints_rows) {
            const constraints_row = constraints_rows[i];

            ref_fields.push({
                table: constraints_row.table_name,
                field: constraints_row.column_name
            });
        }

        return ref_fields;
    }
}
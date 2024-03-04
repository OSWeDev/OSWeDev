/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231010ForceUnicityVarCacheConfVarID implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20231010ForceUnicityVarCacheConfVarID {
        if (!Patch20231010ForceUnicityVarCacheConfVarID.instance) {
            Patch20231010ForceUnicityVarCacheConfVarID.instance = new Patch20231010ForceUnicityVarCacheConfVarID();
        }
        return Patch20231010ForceUnicityVarCacheConfVarID.instance;
    }

    private static instance: Patch20231010ForceUnicityVarCacheConfVarID = null;

    get uid(): string {
        return 'Patch20231010ForceUnicityVarCacheConfVarID';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        // Généré par ChatGPT
        const query = `
            WITH Ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY var_id ORDER BY id DESC) as rn
                FROM ref.module_var_var_cache_conf
            )
            DELETE FROM ref.module_var_var_cache_conf
            WHERE id IN (
                SELECT id
                FROM Ranked
                WHERE rn > 1
            );

            DO $$
            DECLARE
                v_constraint_exists BOOLEAN;
            BEGIN
                -- Vérifier l'existence de la contrainte d'unicité sur la colonne var_id
                SELECT EXISTS (
                    SELECT 1
                    FROM   pg_index i
                    JOIN   pg_class t ON t.oid = i.indrelid
                    JOIN   pg_namespace n ON n.oid = t.relnamespace
                    JOIN   pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
                    WHERE  n.nspname = 'ref'  -- Nom du schéma
                    AND    t.relname = 'module_var_var_cache_conf'  -- Nom de la table
                    AND    a.attname = 'var_id'  -- Nom de la colonne
                    AND    i.indisunique IS TRUE
                ) INTO v_constraint_exists;

                -- Si la contrainte n'existe pas, ajouter la contrainte d'unicité
                IF NOT v_constraint_exists THEN
                    EXECUTE 'ALTER TABLE ref.module_var_var_cache_conf ADD UNIQUE (var_id);';
                END IF;
            END $$;
            `;

        await db.none(query);
    }
}
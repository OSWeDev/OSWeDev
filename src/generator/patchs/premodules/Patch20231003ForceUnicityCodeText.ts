/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231003ForceUnicityCodeText implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20231003ForceUnicityCodeText {
        if (!Patch20231003ForceUnicityCodeText.instance) {
            Patch20231003ForceUnicityCodeText.instance = new Patch20231003ForceUnicityCodeText();
        }
        return Patch20231003ForceUnicityCodeText.instance;
    }

    private static instance: Patch20231003ForceUnicityCodeText = null;

    get uid(): string {
        return 'Patch20231003ForceUnicityCodeText';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        try {
            // Généré par ChatGPT
            const query = `
                WITH Ranked AS (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY code_text ORDER BY id DESC) as rn
                    FROM ref.module_translation_translatable_text
                )
                DELETE FROM ref.module_translation_translatable_text
                WHERE id IN (
                    SELECT id
                    FROM Ranked
                    WHERE rn > 1
                );

                DO $$
                    DECLARE
                        v_constraint_exists BOOLEAN;
                    BEGIN
                        -- Vérifier l'existence de la contrainte d'unicité sur la colonne code_text
                        SELECT EXISTS (
                            SELECT 1
                            FROM   pg_index i
                            JOIN   pg_class t ON t.oid = i.indrelid
                            JOIN   pg_namespace n ON n.oid = t.relnamespace
                            JOIN   pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
                            WHERE  n.nspname = 'ref'  -- Nom du schéma
                            AND    t.relname = 'module_translation_translatable_text'  -- Nom de la table
                            AND    a.attname = 'code_text'  -- Nom de la colonne
                            AND    i.indisunique IS TRUE
                        ) INTO v_constraint_exists;

                        -- Si la contrainte n'existe pas, ajouter la contrainte d'unicité
                        IF NOT v_constraint_exists THEN
                            EXECUTE 'ALTER TABLE ref.module_translation_translatable_text ADD UNIQUE (code_text);';
                        END IF;
                END $$;
                `;

            await db.none(query);
        } catch (error) {
            console.error('Error running patch : ', error);
        }
    }
}
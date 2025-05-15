/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250515ForeignKeysUserVersioning implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250515ForeignKeysUserVersioning {
        if (!Patch20250515ForeignKeysUserVersioning.instance) {
            Patch20250515ForeignKeysUserVersioning.instance = new Patch20250515ForeignKeysUserVersioning();
        }
        return Patch20250515ForeignKeysUserVersioning.instance;
    }

    private static instance: Patch20250515ForeignKeysUserVersioning = null;

    get uid(): string {
        return 'Patch20250515ForeignKeysUserVersioning';
    }

    private constructor() { }

    /**
     * Objectif : Passer les colonnes de date de DataImportHistoricVO en tstz :
     * segment_date_index
     */
    public async work(db: IDatabase<any>) {
        try {
            await db.query(`DO
                            $$
                            DECLARE
                                schema_name text;
                                v_table_name text;
                                v_column_name text;
                                constraint_name text;
                                        BEGIN
                                        --Boucler sur les schémas ciblés
                                FOR schema_name IN SELECT unnest(ARRAY['versioned', 'trashed', 'trashed__versioned'])
                                        LOOP
                                        --Boucler sur les tables ayant les colonnes ciblées dans chaque schéma
                                    FOR v_table_name, v_column_name IN
                                        SELECT c.table_name, c.column_name
                                        FROM information_schema.columns AS c
                                        WHERE c.table_schema = schema_name
                                        AND c.column_name IN('version_edit_author_id', 'version_author_id')
                                        LOOP
                                        --Vérifier si une contrainte FK existe déjà et la supprimer au besoin
                                        SELECT tc.constraint_name INTO constraint_name
                                        FROM information_schema.table_constraints AS tc
                                        JOIN information_schema.key_column_usage AS kcu
                                            ON tc.constraint_name = kcu.constraint_name
                                        AND tc.table_schema = kcu.table_schema
                                        WHERE tc.table_schema = schema_name
                                        AND tc.table_name = v_table_name
                                        AND kcu.column_name = v_column_name
                                        AND tc.constraint_type = 'FOREIGN KEY';

                                        IF constraint_name IS NOT NULL THEN
                                            EXECUTE format(
                                            'ALTER TABLE %I.%I DROP CONSTRAINT %I;',
                                            schema_name, v_table_name, constraint_name
                                        );
                                        END IF;

                                        --Ajouter la nouvelle contrainte FK vers ref.user(id)
                                        EXECUTE format(
                                            'ALTER TABLE %I.%I ADD CONSTRAINT fk_%s_%s_ref_user FOREIGN KEY (%I) REFERENCES ref.user(id);',
                                            schema_name, v_table_name, v_table_name, v_column_name, v_column_name
                                        );
                                    END LOOP;
                                END LOOP;
                                        END;
                                        $$
                            LANGUAGE plpgsql;`);
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project or never used dashboardbuilder: ' + error);
        }
    }
}
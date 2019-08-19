# BREAKING CHANGE 19-08-2019

 * ATTENTION aux foreach et foreach_ranges sur TSRangeHandler et NumRangeHandler => passent en async, il faut donc les await. Cela permet par contre d'utiliser des callbacks async.

# BREAKING CHANGE 02-08-2019

 *  Suppression du API_TYPE_ID devenu inutile et gênant sur ces 3 apis du moduleDAO
    getVosByExactFieldRange
    filterVosByFieldRanges
    filterVosByFieldRangesIntersections

# Ajout des constructeurs de VO dans la def des tables

 * Gros impacts, quelques outils pour simplifier la mise en place :
    - Rechercher : new DataImportColumnVO(
    - Remplacer  : DataImportColumnVO.createNew(

    - Rechercher : new ModuleTable([^(]*)\(this, ([^. ]+)\.API_TYPE_ID, ([^(])
    - Remplacer  : new ModuleTable$1(this, $2.API_TYPE_ID, () => new $2(), $3

    - Rechercher : register_simple_number_var_data\(([^. ]+)\.API_TYPE_ID, ([^(])
    - Remplacer  : register_simple_number_var_data($1.API_TYPE_ID, () => new $1(), $2


# Gestion des droits V2

 * BREAKING change sur le program plan : ajout de target_validation dans le RDV pour définit le state plus facilement via triggers

 * 
    ALTER TABLE ref.module_access_policy_accpolgrp ADD COLUMN weight bigint NOT NULL DEFAULT 0;
    ALTER TABLE ref.module_access_policy_accpol ADD COLUMN weight bigint NOT NULL DEFAULT 0;
    ALTER TABLE ref.module_access_policy_role ADD COLUMN weight bigint NOT NULL DEFAULT 0;
    ALTER TABLE ref.module_access_policy_accpolgrp DROP COLUMN uniq_id CASCADE;
    ALTER TABLE ref.module_access_policy_accpol DROP COLUMN uniq_id CASCADE;
    Le launch.json qui permet de lancer des tests unitaire sur un fichier cible en debug mais du coup il faut enlever : test/**/*.ts dans la conf mocha... à creuser

# 0.4.7 => 0.4.8
    ALTER TABLE admin.module_sass_resource_planning_skin_configurator ADD COLUMN main_background_header_url text;
    ALTER TABLE admin.module_sass_resource_planning_skin_configurator ALTER COLUMN main_background_int_url DROP DEFAULT;
    ALTER TABLE admin.module_sass_resource_planning_skin_configurator ALTER COLUMN main_background_int_url DROP NOT NULL;

# Modification des imports [<= 0.3.5] -> [*]

## SQL
    CREATE SCHEMA imports;

## Clear duplicates translations if any 
    delete from  ref.module_translation_translation  where id in (select t.id from ref.module_translation_translation t, ref.module_translation_translation t2 where t.id < t2.id and t.lang_id = t2.lang_id and t.text_id = t2.text_id)

## DataImportFileVO => DataImportFormatVO
    Ajout du champ file_id
    Suppression du champ datatable_fullname au profit du champ api_type_id
    Suppression du champ post_traitement_module au profit de post_exec_module_id
    Renommage du champ import_name en import_uid
    Modification du type du champ type qui devient un number :
        XLS => 0
        XLSX => 1
        CSV => 2
    Ajout des colonnes type_column_position, column_labels_row_index

## DataImportHistoricVO
    Suppression du champ target_date au profit de params et segment_date_index
    Suppression du champ filepath au profit de file_id
    Ajout d'un lien vers l'initiateur de l'import : user_id
    Ajout du nom du vo cible : api_type_id
    Renommage de la colonne data_import_file_id en data_import_format_id
    Ajout de la colonne import_type
    Ajout de la colonne segment_type
    Ajout des colonnes nb_row_validated et nb_row_unvalidated
    
    Changement des codes de status des DataImportHistoricVO :
    INFO : IMPORTATION_STATE_UPLOADED => 0 (trigger à la création/modification du champ pour gérer le lancement du formattage)

    TODO : IMPORT_STATE_STARTED 0 => Supprimer ces historiques, pour éviter un réimport
    TODO : IMPORT_STATE_OK 1 => ModuleDataImport.IMPORTATION_STATE_POSTTREATED
    TODO : IMPORT_STATE_NODATA 5 => ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED
    TODO : IMPORT_STATE_FAILED 10 => ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION
    TODO : IMPORT_STATE_POSTTRAITMENT_FAILED 20 => ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT

## DataImportColumnVO
    Renommage de la colonne name en title
    Ajout de la colonne vo_field_name
    Renommage de la colonne data_import_file_id en data_import_format_id
    Ajout de la colonne mandatory

## DataImportLogVO
    Ajout de la colonne code_text    
    Le champ message n'est plus not null
    Renommage de la colonne data_import_file_id en data_import_format_id
    Ajout de la colonne api_type_id

    Le champ log_level est devenu un enum, donc un nombre en base :
        TODO : LOG_LEVEL_DEBUG => 0
        TODO : LOG_LEVEL_INFO => 1
        
        INFO : LOG_LEVEL_SUCCESS => 2
        
        TODO : LOG_LEVEL_WARN => 3
        TODO : LOG_LEVEL_ERROR => 4
        TODO : LOG_LEVEL_FATAL => 5

## NotificationVO
    Ajout du champ dao_notif_id
    Ajout du champ dao_notif_type

# oswedev
OpenSource WeDev

## Outil de développement préféré
Visual Studio Code
### Configuration conseillée 
    * DEPRECATED : Semble ne pas convenir de lancer toutes les taches en meme temps, il faut creuser. Et pour le moment lancer les taches individuellement, et avec une visibilité (donc on commente une ligne) : Installer le plugin    yukidoi.blade-runner
    * Souvent utile pour initialiser une nouvelle base depuis une base existante et en changer le propriétaire : 
        ---- Pour les tables ------------------------------------------------------------------------------------
        DO $$DECLARE r record;
        BEGIN
            FOR r IN SELECT schemaname, tablename 
                FROM pg_tables WHERE NOT schemaname IN ('pg_catalog', 'information_schema')
            LOOP
                EXECUTE 'ALTER TABLE ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' OWNER TO my_new_user;';
            END LOOP;
        END;$$ 
        ---- Pour les sequences -------------------------------------------------------------------------------
        DO $$DECLARE r record;
        BEGIN
            FOR r IN SELECT sequence_schema, sequence_name 
                FROM information_schema.sequences WHERE NOT sequence_schema IN ('pg_catalog', 'information_schema')
            LOOP
                EXECUTE 'ALTER SEQUENCE '|| quote_ident(r.sequence_schema) || '.' || quote_ident(r.sequence_name) ||' OWNER TO my_new_user;';
            END LOOP;
        END;$$
        --- Pour les vues ----------------------------------------------------------------------------------
        DO $$DECLARE r record;
        BEGIN
            FOR r IN SELECT table_schema, table_name 
                FROM information_schema.views WHERE NOT table_schema IN ('pg_catalog', 'information_schema')
            LOOP
                EXECUTE 'ALTER VIEW '|| quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) ||' OWNER TO my_new_user;';
            END LOOP;
        END;$$
        --------------------------------------------------------------------------------------------------------
        ALTER SCHEMA admin
        OWNER TO my_new_user;
        ALTER SCHEMA checks
        OWNER TO my_new_user;

        ALTER SCHEMA computations
        OWNER TO my_new_user;
        ALTER SCHEMA data_import
        OWNER TO my_new_user;
        ALTER SCHEMA day
        OWNER TO my_new_user;
        ALTER SCHEMA fte
        OWNER TO my_new_user;
        ALTER SCHEMA hourly
        OWNER TO my_new_user;
        ALTER SCHEMA imports
        OWNER TO my_new_user;
        ALTER SCHEMA monthly
        OWNER TO my_new_user;
        ALTER SCHEMA public
        OWNER TO my_new_user;
        ALTER SCHEMA ref
        OWNER TO my_new_user;
        ALTER SCHEMA sales
        OWNER TO my_new_user;
        ALTER SCHEMA store
        OWNER TO my_new_user;
        ALTER SCHEMA tasks
        OWNER TO my_new_user;
        ALTER SCHEMA usr
        OWNER TO my_new_user;
        ALTER SCHEMA web
        OWNER TO my_new_user;
        ALTER SCHEMA weekly
        OWNER TO my_new_user;

    * Configurer les tâches (/.vscode/.tasks.json) pour une compilation en watch du typescript de chaque sous-partie. 
Exemple de fichier tasks.json :
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "tsc watch server",
            "type": "shell",
            "command": "tsc",
            "isBackground": true,
            "args": [
                "--watch",
                "--noEmit",
                "--project",
                "./src/server"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "never",
                "echo": false,
                "focus": false,
                "panel": "dedicated"
            },
            "problemMatcher": "$tsc-watch"
        },
        {
            "label": "tsc watch generator",
            "type": "shell",
            "command": "tsc",
            "isBackground": true,
            "args": [
                "--watch",
                "--noEmit",
                "--project",
                "./src/generator"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "never",
                "echo": false,
                "focus": false,
                "panel": "dedicated"
            },
            "problemMatcher": "$tsc-watch"
        }
    ]
}
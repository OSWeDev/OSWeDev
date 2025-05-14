import UserVO from '../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleTableController from '../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../shared/modules/DAO/ModuleTableFieldController';
import CustomComputedFieldInitVO from '../../shared/modules/DAO/vos/CustomComputedFieldInitVO';
import ModuleTableCompositePartialIndexVO from '../../shared/modules/DAO/vos/ModuleTableCompositePartialIndexVO';
import ModuleTableFieldVO from '../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../shared/modules/DAO/vos/ModuleTableVO';
import DashboardGraphVORefVO from '../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import IRange from '../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../shared/modules/DataRender/vos/NumRange';
import IDistantVOBase from '../../shared/modules/IDistantVOBase';
import StatsController from '../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../shared/tools/ObjectHandler';
import RangeHandler from '../../shared/tools/RangeHandler';
import ConfigurationService from '../env/ConfigurationService';
import ContextFilterServerController from './ContextFilter/ContextFilterServerController';
import DAOServerController from './DAO/DAOServerController';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleTableServerController from './DAO/ModuleTableServerController';
import ForkedTasksController from './Fork/ForkedTasksController';
import TableColumnDescriptor from './TableColumnDescriptor';
import TableDescriptor from './TableDescriptor';

export default class ModuleTableDBService {

    private static instance: ModuleTableDBService = null;

    private constructor(private db) {
        ModuleTableDBService.instance = this;
    }

    // istanbul ignore next: cannot test getInstance
    public static getInstance(db): ModuleTableDBService {
        if (!ModuleTableDBService.instance) {
            ModuleTableDBService.instance = new ModuleTableDBService(db);
        }
        return ModuleTableDBService.instance;
    }

    // istanbul ignore next: cannot test datatable_install
    public async datatable_install(moduleTable: ModuleTableVO, queries_to_try_after_creation: string[]): Promise<boolean> {

        await this.create_or_update_datatable(moduleTable, null, queries_to_try_after_creation);

        return true;
    }

    // Après installation de tous les modules
    // istanbul ignore next: nothing to test
    public async datatable_configure(moduleTable: ModuleTableVO) {
        return true;
    }

    /**
     * Returns the tablename, without schema
     */
    public async get_existing_segmentations_tables_of_moduletable(moduleTable: ModuleTableVO): Promise<{ [segmented_value: number]: string }> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'get_existing_segmentations_tables_of_moduletable', '-');

        const database_name = moduleTable.database;
        const tables: TableDescriptor[] = await this.db.query("SELECT * FROM pg_catalog.pg_tables WHERE schemaname = '" + database_name + "';");

        const segments_by_segmented_value: { [segmented_value: number]: string } = {};

        for (const i in tables) {
            const table = tables[i];

            const splits = table.tablename.split('_');
            const segmented = parseInt(splits[splits.length - 1]);

            if (!segments_by_segmented_value[segmented]) {
                segments_by_segmented_value[segmented] = table.tablename;
            }
        }

        return segments_by_segmented_value;
    }

    public async create_or_update_datatable(
        moduleTable: ModuleTableVO,
        segments: IRange[] = null,
        queries_to_try_after_creation: string[],
    ) {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'create_or_update_datatable', '-');

        const self = this;

        // On va commencer par créer le schema si il existe pas
        if (moduleTable.database) {
            await this.db.none('CREATE SCHEMA IF NOT EXISTS ' + moduleTable.database + ';');
        }

        if (moduleTable.is_segmented) {

            let migration_todo: boolean = false;

            if ((!segments) || (!segments.length)) {

                // Si on est sur du segmenté on doit vérifier 2 choses :
                //  1- le format de toutes les tables existantes
                //  2- si on trouve aucune table et si on trouve une ancienne table équivalente non segmentée on tente de migrer le format et les données automatiquement

                segments = [];

                let segments_by_segmented_value: { [segmented_value: number]: string } = await this.get_existing_segmentations_tables_of_moduletable(moduleTable);

                if (!ObjectHandler.hasAtLeastOneAttribute(segments_by_segmented_value)) {
                    // Aucune table => on tente une migration des datas

                    // On récupère les datas de la colonne de segmentation pour construire par la suite les requetes de migration des datas
                    let segmentation_bdd_values: IDistantVOBase[] = null;

                    try {
                        // On check d'abored l'existence de la table de référence
                        const db_table_test: IDistantVOBase[] = await this.db.query("SELECT FROM pg_catalog.pg_tables WHERE schemaname = 'ref' AND tablename = '" + moduleTable.name + "';");
                        if ((!db_table_test) || (!db_table_test.length)) {
                            ConsoleHandler.log('create_or_update_datatable: no ref table:' + moduleTable.name + ': not a problem, it\'s just a test in case of migration to a segmented table.');
                            return;
                        }

                        // FIXME : WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
                        const datas: IDistantVOBase[] = await this.db.query("SELECT * FROM ref." + moduleTable.name + ";");
                        for (const i in datas) {
                            const data = datas[i];
                            data._type = moduleTable.vo_type;
                        }
                        segmentation_bdd_values = ModuleTableServerController.translate_vos_from_db(datas);
                    } catch (error) {
                        //
                    }

                    if ((!segmentation_bdd_values) || (!segmentation_bdd_values.length)) {
                        return;
                    }

                    // TODO FIXME on migre pour le moment que sur un segment de NumRange
                    segments_by_segmented_value = {};

                    for (const i in segmentation_bdd_values) {
                        const segmentation_bdd_value = segmentation_bdd_values[i];

                        const segmented = moduleTable.get_segmented_field_value_from_vo(segmentation_bdd_value);

                        if (!segments_by_segmented_value[segmented]) {
                            segments_by_segmented_value[segmented] = "ok";
                            segments.push(RangeHandler.create_single_elt_NumRange(segmented, moduleTable.table_segmented_field_segment_type));
                        }
                    }
                    // On laisse créer les tables et on stocke l'info qu'on devra migrer les datas ensuite.
                    migration_todo = true;
                } else {

                    for (const i in segments_by_segmented_value) {
                        const table_name = segments_by_segmented_value[i];

                        const splits = table_name.split('_');
                        const segmented = parseInt(splits[splits.length - 1]);

                        segments.push(RangeHandler.create_single_elt_NumRange(segmented, moduleTable.table_segmented_field_segment_type));
                    }
                }
            }

            // On check que les segments sont bien des numranges
            for (const i in segments) {
                const segment = segments[i];

                if ((!segment) || (segment.range_type != NumRange.RANGE_TYPE)) {
                    throw new Error('create_or_update_datatable: segment is not a NumRange:' + JSON.stringify(segment) + ':' + JSON.stringify(segments));
                }
            }

            const database_name = moduleTable.database;

            const common_id_seq_name = this.get_segmented_table_common_limited_seq_label(moduleTable);
            let max_id = 0;

            /**
             * On prend 1 table pour l'exemple et si on a pas de modif de format, on ignore les suivantes
             *  sauf si on utilise un param spécifique lors de la compilation
             */
            let segment_test = null;
            let has_changes = true;
            if (!ConfigurationService.nodeInstallFullSegments) {
                segment_test = segments[0].min;

                has_changes = await this.handle_check_segment(moduleTable, segment_test, common_id_seq_name, migration_todo, queries_to_try_after_creation);
            }

            // Création / update des structures
            if (has_changes) {

                await RangeHandler.foreach_ranges_batch_await(segments, async (segmented_value) => {

                    if ((segment_test != null) && (segment_test == segmented_value)) {
                        return;
                    }

                    await this.handle_check_segment(moduleTable, segmented_value, common_id_seq_name, migration_todo, queries_to_try_after_creation);
                }, moduleTable.table_segmented_field_segment_type, null, null, 20);
            }

            if (migration_todo) {

                const column_names_list = [];

                column_names_list.push('id');
                const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
                for (const i in fields) {
                    column_names_list.push(fields[i].field_name);
                }

                const column_names = column_names_list.join(',');

                // Si on est en création => on migre les datas et on compte les datas migrées
                await RangeHandler.foreach_ranges(segments, async (segmented_value) => {

                    const table_name = moduleTable.get_segmented_name(segmented_value);

                    // Une fois la création de la table terminée, on peut faire la migration des datas si on attendait de le faire.
                    const field_where_clause = DAOServerController.getClauseWhereRangeIntersectsField(
                        moduleTable.table_segmented_field.field_type, moduleTable.table_segmented_field.field_name,
                        RangeHandler.create_single_elt_NumRange(segmented_value, moduleTable.table_segmented_field_segment_type));

                    await this.db.query('INSERT INTO ' + database_name + '.' + table_name + ' (' + column_names + ') SELECT ' + column_names + ' FROM ref.' + database_name + ' WHERE ' + field_where_clause + ';');

                    const migrated_datas: any[] = await this.db.query('SELECT max(id) m FROM ' + database_name + '.' + table_name + ';');

                    max_id = Math.max(max_id, ((!!migrated_datas) && migrated_datas.length) ? migrated_datas[0]['m'] : 0);
                }, moduleTable.table_segmented_field_segment_type);

                // Si on est en création => on crée aussi la séquence, initiée au prochain id
                await this.db.query(
                    'CREATE SEQUENCE IF NOT EXISTS ' + moduleTable.database + '.' + common_id_seq_name +
                    '  INCREMENT 1' +
                    '  MINVALUE 1' +
                    '  MAXVALUE 9223372036854775807' +
                    '  START ' + (max_id + 1) +
                    '  CACHE 1;');

                // Si on est en création => on change la séquence des tables créées
                await RangeHandler.foreach_ranges(segments, async (segmented_value) => {

                    const table_name = moduleTable.get_segmented_name(segmented_value);

                    // La table est créée on doit modifier le calcul de la clé primaire (la contrainte est ok, la séquence créée auto est inutile, on la supprime pas pour autant)
                    await this.db.query("ALTER TABLE " + database_name + "." + table_name + " ALTER COLUMN id SET DEFAULT nextval('" + moduleTable.database + "." + common_id_seq_name + "'::regclass);");
                }, moduleTable.table_segmented_field_segment_type);
            }
        } else {

            // On doit entre autre ajouter la table en base qui gère les fields
            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
            if ((!fields) || (!ObjectHandler.hasAtLeastOneAttribute(fields))) {
                ConsoleHandler.error('ModuleTableDBService: no fields for table - DB declaration is impossible without fields:' + moduleTable.full_name);
            } else {
                await self.do_check_or_update_moduletable(
                    moduleTable,
                    moduleTable.database,
                    moduleTable.name,
                    null,
                    queries_to_try_after_creation,
                );
            }
        }
    }

    // istanbul ignore next: cannot test handle_check_segment
    private async handle_check_segment(
        moduleTable: ModuleTableVO,
        segmented_value: number,
        common_id_seq_name: string,
        migration_todo: boolean,
        queries_to_try_after_creation: string[],
    ): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'handle_check_segment', '-');

        let res: boolean = false;

        const table_name = moduleTable.get_segmented_name(segmented_value);
        res = await this.do_check_or_update_moduletable(moduleTable, moduleTable.database, table_name, segmented_value, queries_to_try_after_creation);

        if (!migration_todo) {
            // Attention si une sequence manque on ne la créera sur toutes les tables que si on a demandé explicitement d'install full segments

            // Si on est pas en migration, on doit quand même vérifier au cas où la présence de la séquence

            await this.db.query(
                'CREATE SEQUENCE IF NOT EXISTS ' + moduleTable.database + '.' + common_id_seq_name +
                '  INCREMENT 1' +
                '  MINVALUE 1' +
                '  MAXVALUE 9223372036854775807' +
                '  START 1' +
                '  CACHE 1;');

            // Si la séquence existe déjà, on doit pouvoir directement demander à changer le lien de séquence (pour le cas de création de nouvelle table)
            await this.db.query("ALTER TABLE " + moduleTable.database + "." + table_name + " ALTER COLUMN id SET DEFAULT nextval('" + moduleTable.database + "." + common_id_seq_name + "'::regclass);");
        }
        return res;
    }

    /**
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test do_check_or_update_moduletable
    private async do_check_or_update_moduletable(
        moduleTable: ModuleTableVO,
        database_name: string,
        table_name: string,
        segmented_value: number,
        queries_to_try_after_creation: string[],
    ): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'do_check_or_update_moduletable', '-');

        // Changement radical, si on a une table déjà en place on vérifie la structure, principalement pour ajouter des champs supplémentaires
        //  et alerter si il y a des champs en base que l'on ne connait pas dans la structure métier

        const table_cols_sql: string = 'select column_name, column_default, is_nullable, data_type from INFORMATION_SCHEMA.COLUMNS ' +
            'where table_schema = \'' + database_name + '\' and table_name = \'' + table_name + '\';';
        const table_cols: TableColumnDescriptor[] = await this.db.query(table_cols_sql);
        let res: boolean = false;

        if ((!table_cols) || (!table_cols.length)) {
            res = true;
            await this.create_new_datatable(moduleTable, database_name, table_name, queries_to_try_after_creation);
            await this.check_indexes(moduleTable, database_name, table_name);
            await this.check_triggers(moduleTable, database_name, table_name);

            if (segmented_value != null) {
                await ForkedTasksController.broadexec(ModuleDAOServer.TASK_NAME_add_segmented_known_databases, database_name, table_name, segmented_value);
            }
        } else {
            res = await this.check_datatable_structure(moduleTable, database_name, table_name, table_cols, queries_to_try_after_creation);

            if (await this.check_indexes(moduleTable, database_name, table_name)) {
                res = true;
            }

            if (await this.check_triggers(moduleTable, database_name, table_name)) {
                res = true;
            }
        }
        return res;
    }

    private async check_triggers(moduleTable: ModuleTableVO, database_name: string, table_name: string): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'check_triggers', '-');

        let res: boolean = false;

        /**
         * Pour le moment, les triggers se résument aux mdp pour les crypter
         *  Et on exclut historiquement le user.password qui est déjà crypté par un patch qui gère la créa de la fonction de cryptage aussi
         */
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in fields) {
            const field = fields[i];
            const this_trigger_name = 'trg_' + database_name + '_' + table_name + '_' + field.field_name;

            if ((moduleTable.vo_type == UserVO.API_TYPE_ID) && (field.field_name == field_names<UserVO>().password)) {
                continue;
            }

            /**
             * On ne doit pas agir sur les tables versionnées (versioned.*, trashed.*, trashed__versioned.*)
             */
            if ((database_name == 'versioned') || (database_name == 'trashed') || (database_name == 'trashed__versioned')) {
                continue;
            }

            const trigger_sql = field.getPGSqlFieldTrigger(this_trigger_name, database_name, table_name);

            if (!trigger_sql) {
                continue;
            }

            let actual_trigger_name_res = null;
            try {
                actual_trigger_name_res = await this.db.query(
                    'select tgname ' +
                    '  from pg_trigger ' +
                    '  where tgname = \'' + this_trigger_name + '\';');
            } catch (error) {
                ConsoleHandler.error('check_triggers: error on actual_trigger_name_res:' + error);
            }

            const actual_trigger_name: string = (actual_trigger_name_res && actual_trigger_name_res.length > 0) ? actual_trigger_name_res[0]['tgname'] : null;

            if (!actual_trigger_name) {
                try {
                    ConsoleHandler.log('Création du trigger: ' + this_trigger_name);

                    await this.db.none('CREATE FUNCTION ref.' + this_trigger_name + '() ' +
                        'RETURNS trigger ' +
                        'LANGUAGE \'plpgsql\' ' +
                        'COST 100 ' +
                        'VOLATILE NOT LEAKPROOF ' +
                        'AS $BODY$ ' +
                        'BEGIN ' +
                        'IF tg_op = \'INSERT\' OR new.' + field.field_name + ' <> old.' + field.field_name + ' ' +
                        'THEN ' +
                        'new.' + field.field_name + ' = crypt(new.' + field.field_name + ', gen_salt(\'bf\')); ' +
                        'END IF; ' +
                        'RETURN new; ' +
                        'END ' +
                        '$BODY$; ');
                    await this.db.none(trigger_sql);
                    res = true;
                } catch (error) {
                    ConsoleHandler.error('check_triggers: error on trigger_sql:' + error);
                }
            }
        }

        return res;
    }

    /**
     * @returns true if causes a change in the db structure
     */
    private async check_datatable_structure(
        moduleTable: ModuleTableVO,
        database_name: string,
        table_name: string,
        table_cols: TableColumnDescriptor[],
        queries_to_try_after_creation: string[],
    ): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'check_datatable_structure', '-');

        const fields_by_field_name: { [field_name: string]: ModuleTableFieldVO } = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        const table_cols_by_name: { [col_name: string]: TableColumnDescriptor } = {};
        for (const i in table_cols) {
            const table_col = table_cols[i];
            table_cols_by_name[table_col.column_name] = table_col;
        }

        let res: boolean = false;

        // Avant tout ça on compare la description du VO avec le VO lui-même
        this.check_source_vo_vs_described_vo_consistency(moduleTable, fields_by_field_name);

        res = await this.checkMissingInTS(moduleTable, fields_by_field_name, table_cols_by_name, database_name, table_name);
        if (await this.checkMissingInDB(moduleTable, fields_by_field_name, table_cols_by_name, database_name, table_name, queries_to_try_after_creation)) {
            res = true;
        }
        if (await this.checkColumnsStrutInDB(moduleTable, fields_by_field_name, table_cols_by_name, database_name, table_name)) {
            res = true;
        }
        if (await this.checkConstraintsOnForeignKey(moduleTable, fields_by_field_name, table_cols_by_name, database_name, table_name, queries_to_try_after_creation)) {
            res = true;
        }
        return res;
    }

    /**
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     * @param database_name
     * @param table_name
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test checkConstraintsOnForeignKey
    private async checkConstraintsOnForeignKey(
        moduleTable: ModuleTableVO,
        fields_by_field_id: { [field_name: string]: ModuleTableFieldVO },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string,
        queries_to_try_after_creation: string[],
    ): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'checkConstraintsOnForeignKey', '-');

        const full_name = database_name + '.' + table_name;
        let res: boolean = false;

        for (const i in fields_by_field_id) {
            const field = fields_by_field_id[i];

            if (!field.has_single_relation) {
                continue;
            }

            const constraint = field.getPGSqlFieldConstraint();

            let actual_constraint_name_res = null;
            try {
                actual_constraint_name_res = await this.db.query(
                    'select DISTINCT tco.constraint_name ' +
                    '  from information_schema.table_constraints tco ' +
                    '  join information_schema.key_column_usage kcu ' +
                    '    on kcu.constraint_name = tco.constraint_name ' +
                    '    and kcu.constraint_schema = tco.constraint_schema ' +
                    '    and kcu.constraint_name = tco.constraint_name ' +
                    '    and kcu.table_name = tco.table_name ' +
                    '    and kcu.table_schema = tco.table_schema ' +
                    '  where tco.constraint_type = \'FOREIGN KEY\' and kcu.column_name = \'' + field.field_name + '\' and kcu.table_name = \'' + table_name + '\' and kcu.table_schema = \'' + database_name + '\';');
            } catch (error) {
                //
            }
            const actual_constraint_names: Array<{ constraint_name: string }> = (actual_constraint_name_res && actual_constraint_name_res.length > 0) ? actual_constraint_name_res : null;

            if (!constraint) {

                if (actual_constraint_names) {
                    for (const actual_constraint_names_i in actual_constraint_names) {
                        const actual_constraint_name = actual_constraint_names[actual_constraint_names_i] ? actual_constraint_names[actual_constraint_names_i]['constraint_name'] : null;

                        if (!actual_constraint_name) {
                            continue;
                        }

                        try {
                            await this.db.none('ALTER TABLE ' + full_name + ' DROP CONSTRAINT ' + actual_constraint_name + ';');
                            ConsoleHandler.warn('SUPRRESION d\'une contrainte incohérente en base VS code :' + full_name + ':' + actual_constraint_name + ':');
                            res = true;
                        } catch (error) {
                            //
                        }
                    }
                }
                continue;
            }

            // ATTENTION sur certaines modifs subtiles on peut avoir besoin de forcer l'update complet des tables segmentées, car on supprime toujours les contraintes avant de recréer donc c'est pas un motif de modif fiable...
            if (actual_constraint_names) {
                for (const actual_constraint_names_i in actual_constraint_names) {
                    const actual_constraint_name = actual_constraint_names[actual_constraint_names_i] ? actual_constraint_names[actual_constraint_names_i]['constraint_name'] : null;

                    if (!actual_constraint_name) {
                        continue;
                    }

                    try {
                        await this.db.none('ALTER TABLE ' + full_name + ' DROP CONSTRAINT ' + actual_constraint_name + ';');
                    } catch (error) {
                        //
                    }
                }
            }

            try {
                await this.db.none('ALTER TABLE ' + full_name + ' ADD ' + constraint + ';');
            } catch (error) {
                ConsoleHandler.error('Erreur lors de l\'ajout de la contrainte en base :' + full_name + ':' + constraint + ':on va essayer après la création des tables');
                queries_to_try_after_creation.push('ALTER TABLE ' + full_name + ' ADD ' + constraint + ';');
            }
        }

        return res;
    }

    /**
     * On cherche les colonnes en trop dans la base et on log en erreur si il y en a
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test checkMissingInTS
    private async checkMissingInTS(
        moduleTable: ModuleTableVO,
        fields_by_field_id: { [field_name: string]: ModuleTableFieldVO },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'checkMissingInTS', '-');

        const full_name = database_name + '.' + table_name;
        let res: boolean = false;

        for (const i in table_cols_by_name) {

            const index = i.toLowerCase();
            // On ignore les ids qui sont jamais dans nos descripteurs logiciel
            if (index == 'id') {
                continue;
            }

            if (!fields_by_field_id[index]) {

                // Cas des ranges : champs _ndx en base, on retrouve pas le field à ce niveau
                if (index.endsWith('_ndx')) {
                    const test_index = index.substr(0, index.length - 4);
                    if (fields_by_field_id[test_index]) {
                        continue;
                    }
                }

                console.log('-');
                console.log('INFO  : Champs en trop dans la base de données par rapport à la description logicielle :' + i + ':table:' + full_name + ':');

                // On rajoute une contrôle de cohérence  :
                //  Si le nom existe mais pas en minuscule, on considère que c'est une erreur, mais on ne supprime pas automatiquement
                const obj_field_names = Object.keys(fields_by_field_id);
                if (obj_field_names.find((e) => e.toLowerCase() == index)) {
                    console.error('Le champ existe en majuscule, mais pas en minuscule, c\'est une erreur de nommage, mais on ne supprime pas automatiquement il faut corriger manuellement.');
                    console.error('---');
                    continue;
                }

                console.log('ACTION: Suppression automatique...');

                try {
                    const pgSQL: string = 'ALTER TABLE ' + full_name + ' DROP COLUMN ' + i + ';';
                    await this.db.none(pgSQL);
                    res = true;
                    console.log('ACTION: OK');
                } catch (error) {
                    console.error(error);
                }
                console.log('---');
            }
        }
        return res;
    }

    /**
     * On cherche les colonnes qui manquent pour les ajouter en base et informer de l'ajout
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test checkMissingInDB
    private async checkMissingInDB(
        moduleTable: ModuleTableVO,
        fields_by_field_id: { [field_name: string]: ModuleTableFieldVO },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string,
        queries_to_try_after_creation: string[],
    ): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'checkMissingInDB', '-');

        const full_name = database_name + '.' + table_name;
        let res: boolean = false;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
        for (const i in fields) {
            const field = fields[i];

            let has_added_field: boolean = false;
            if (!table_cols_by_name[field.field_name.toLowerCase()]) {
                ConsoleHandler.log('-');
                ConsoleHandler.log('INFO  : Champs manquant dans la base de données par rapport à la description logicielle :' + field.field_name + ':table:' + full_name + ':');
                ConsoleHandler.log('ACTION: Création automatique...');

                let pgSQL: string = 'ALTER TABLE ' + full_name + ' ADD COLUMN ';

                try {
                    pgSQL = pgSQL + field.getPGSqlFieldDescription() + ';';
                    await this.db.none(pgSQL);

                    // Si champ de référence vers un autre VO, on va rajouter le champ dans la table DashboardGraphVORefVO
                    // s'il y a des DBB déjà existants pour éviter de rajouter une liaison que l'on ne voudrait pas de base
                    // Cela permet de ne pas avoir à faire de migration sur les DBB existants
                    if (
                        database_name == "ref" &&
                        !!ModuleTableController.module_tables_by_vo_type[DashboardGraphVORefVO.API_TYPE_ID] &&
                        (
                            (field.field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) ||
                            (field.field_type == ModuleTableFieldVO.FIELD_TYPE_foreign_key)
                        )
                    ) {
                        await this.db.none(
                            `UPDATE ` + ModuleTableController.module_tables_by_vo_type[DashboardGraphVORefVO.API_TYPE_ID].full_name + `
                            SET ` + field_names<DashboardGraphVORefVO>().values_to_exclude + ` = array_append(COALESCE(` + field_names<DashboardGraphVORefVO>().values_to_exclude + `, '{}'), '` + field.field_name + `')
                            WHERE vo_type='` + field.module_table_vo_type + `'
                            AND (` + field_names<DashboardGraphVORefVO>().values_to_exclude + ` IS NULL
                            OR NOT('` + field.field_name + `' = ANY(` + field_names<DashboardGraphVORefVO>().values_to_exclude + `)));`
                        );
                    }

                    res = true;
                    ConsoleHandler.log('ACTION: OK');
                } catch (error) {
                    ConsoleHandler.error(error);

                    if (pgSQL.endsWith(';')) {
                        queries_to_try_after_creation.push(pgSQL);
                    }
                }
                ConsoleHandler.log('---');

                has_added_field = true;
            }

            /**
             * Cas des ranges
             */
            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tsrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_isoweekdays) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {

                const index = field.field_name.toLowerCase() + '_ndx';
                if (!table_cols_by_name[index]) {
                    console.log('-');
                    console.log('INFO  : Champs manquant dans la base de données par rapport à la description logicielle :' + index + ':table:' + full_name + ':');
                    console.log('ACTION: Création automatique...');

                    const pgSQL: string = 'ALTER TABLE ' + full_name + ' ADD COLUMN ' + index + ' text;';
                    try {
                        await this.db.none(pgSQL);
                        res = true;
                        console.log('ACTION: OK');
                    } catch (error) {
                        console.error(error);
                        if (pgSQL.endsWith(';')) {
                            queries_to_try_after_creation.push(pgSQL);
                        }
                    }
                    console.log('---');
                }
            }

            /**
             * Cas des champs custom_computed : on doit alors planifier un patch dédié
             */
            if (has_added_field) {
                if (field.is_custom_computed) {

                    // Sur une table segmentée, pas encore implémenté
                    if (moduleTable.is_segmented) {
                        throw new Error('ModuleTableDBService:checkMissingInDB: custom_computed field on segmented table not implemented');
                    }

                    // On ajoute une demande d'init en base si elle existe pas déjà
                    const custom_computed_field_init: CustomComputedFieldInitVO = new CustomComputedFieldInitVO();
                    custom_computed_field_init.vo_type = moduleTable.vo_type;
                    custom_computed_field_init.field_name = field.field_name;
                    custom_computed_field_init.next_limit = 100;
                    custom_computed_field_init.next_offset = 0;
                    custom_computed_field_init.message = null;
                    custom_computed_field_init.state = CustomComputedFieldInitVO.STATE_TODO;

                    // On vérifie l'existence de la table de configuration (normalement c'est dans le DAO tout en haut, on devrait être ok)
                    const db_table_test: IDistantVOBase[] = await this.db.query("SELECT FROM pg_catalog.pg_tables WHERE schemaname = 'ref' AND tablename = 'module_dao_custom_computed_field_init';");
                    if ((!db_table_test) || (!db_table_test.length)) {
                        throw new Error('ModuleTableDBService:checkMissingInDB: no ref table module_dao_custom_computed_field_init: it needs to be created at this point');
                    }

                    // Puis on checke si la ligne (vo_type/field_name) existe déjà. si oui osef, si non il faut en créer une
                    const db_table_test2: IDistantVOBase[] = await this.db.query("SELECT * FROM ref.module_dao_custom_computed_field_init WHERE vo_type = '" + moduleTable.vo_type + "' AND field_name = '" + field.field_name + "';");
                    if ((!db_table_test2) || (!db_table_test2.length)) {
                        await this.db.query("INSERT INTO ref.module_dao_custom_computed_field_init (vo_type, field_name, next_limit, next_offset, message, state) VALUES ('" + moduleTable.vo_type + "', '" + field.field_name + "', " + custom_computed_field_init.next_limit + ", " + custom_computed_field_init.next_offset + ", null, " + custom_computed_field_init.state + ");");
                    }

                    ConsoleHandler.log('ModuleTableDBService:checkMissingInDB: custom_computed field init created for field:' + field.field_name + ':vo_type:' + moduleTable.vo_type);
                }
            }
        }
        return res;
    }

    /**
     * On cherche les colonnes dont la structure diffère pour les ajuster ou simplement informer
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test checkColumnsStrutInDB
    private async checkColumnsStrutInDB(
        moduleTable: ModuleTableVO,
        fields_by_field_id: { [field_name: string]: ModuleTableFieldVO },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'checkColumnsStrutInDB', '-');

        const full_name = database_name + '.' + table_name;
        let res: boolean = false;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in fields) {
            const field = fields[i];

            if (!table_cols_by_name[field.field_name]) {
                continue;
            }

            const table_col = table_cols_by_name[field.field_name];

            // // On check les infos récupérées de la base : column_default, is_nullable, data_type
            // if (field.field_required == (table_col.is_nullable != TableColumnDescriptor.IS_NOT_NULLABLE_VALUE)) {
            //     console.error('-');
            //     console.error('INFO  : Les propriétés isNullable et fieldRequired ne devraient pas être égales. BDD isNullable:' + table_col.is_nullable + ':moduleTableField:' + field.field_required + ':field:' + field.field_name + ':table:' + moduleTable.full_name + ':');
            //     console.error('ACTION: Aucune. Résoudre manuellement');
            //     console.error('---');
            // }
            if (field.field_required == (table_col.is_nullable != TableColumnDescriptor.IS_NOT_NULLABLE_VALUE)) {

                if (!field.field_required) {
                    await this.db.query('ALTER TABLE ' + full_name + ' ALTER COLUMN ' + table_col.column_name + ' DROP NOT NULL;');
                } else {
                    await this.db.query('ALTER TABLE ' + full_name + ' ALTER COLUMN ' + table_col.column_name + ' SET NOT NULL;');
                }
                res = true;
            }

            // // En même temps ça parait pas gravissime
            // if (field.field_default == table_col.column_default) {
            //     console.error('-');
            //     console.error('INFO  : Les valeurs par défaut devraient être égales. BDD column_default:' + table_col.column_default + ':moduleTableField:' + field.field_default + ':table:' + full_name + ':');
            //     console.error('ACTION: Aucune. Résoudre manuellement');
            //     console.error('---');
            // }

            if (!field.isAcceptableCurrentDBType(table_col.data_type)) {
                console.error('-');
                console.error('INFO  : Les types devraient être identiques. BDD data_type:' + table_col.data_type + ':moduleTableField:' + field.getPGSqlFieldType() + ':field:' + field.field_name + ':table:' + full_name + ':');
                console.error('ACTION: Aucune. Résoudre manuellement');
                console.error('---');
            }

            // Cas des ranges on check l'index
            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tsrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_isoweekdays) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {

                const index = field.field_name.toLowerCase() + '_ndx';
                if (!table_cols_by_name[index]) {
                    continue;
                }

                const table_col_ndx = table_cols_by_name[index];

                if (table_col_ndx.data_type != 'text') {
                    console.error('-');
                    console.error('INFO  : Les types devraient être identiques. BDD data_type:' + table_col_ndx.data_type + ':moduleTableField:text:field:' + index + ':table:' + full_name + ':');
                    console.error('ACTION: Aucune. Résoudre manuellement');
                    console.error('---');
                }
            }
        }
        return res;
    }

    /**
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test check_indexes
    private async check_indexes(moduleTable: ModuleTableVO, database_name: string, table_name: string): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'check_indexes', '-');

        let res_: boolean = await this.check_composite_partial_indexes(moduleTable, database_name, table_name);
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in fields) {
            const field = fields[i];

            const index_str = field.getPGSqlFieldIndex(database_name, table_name);
            if (!index_str) {
                continue;
            }

            const res: any[] = await this.db.query("SELECT * FROM pg_indexes WHERE tablename = '" + table_name + "' and schemaname = '" + database_name + "' and indexname = '" + field.get_index_name(table_name) + "';");
            if ((!!res) && (!!res.length)) {

                // On va checker le type d'index, cf mise en place des indexs gin
                if (field.is_indexed_using_gin_trgm) {
                    if (res[0].indexdef.toLowerCase().indexOf('using gin') < 0) {
                        ConsoleHandler.log('UPDATING INDEX:' + database_name + '.' + table_name + '.' + field.get_index_name(table_name) + ': IF IT FAILS, make sure pg_trgm extension is activated by running this query as DB admin : "CREATE EXTENSION IF NOT EXISTS pg_trgm;"');
                        await this.db.query('DROP INDEX ' + database_name + '.' + field.get_index_name(table_name) + ';');
                        await this.db.query(index_str);
                        res_ = true;
                    }
                } else {
                    if (res[0].indexdef.toLowerCase().indexOf('using btree') < 0) {
                        ConsoleHandler.log('UPDATING INDEX:' + database_name + '.' + table_name + '.' + field.get_index_name(table_name) + ':');
                        await this.db.query('DROP INDEX ' + database_name + '.' + field.get_index_name(table_name) + ';');
                        await this.db.query(index_str);
                        res_ = true;
                    }
                }

                continue;
            }

            ConsoleHandler.log('ADDING INDEX:' + database_name + '.' + table_name + '.' + field.get_index_name(table_name) + ':');
            await this.db.query(index_str);
            res_ = true;
        }

        return res_;
    }

    /**
     * @returns true if causes a change in the db structure
     */
    // istanbul ignore next: cannot test check_indexes
    private async check_composite_partial_indexes(moduleTable: ModuleTableVO, database_name: string, table_name: string): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'check_composite_partial_indexes', '-');

        let res_: boolean = false;
        const indexs = moduleTable.composite_partial_indexes;

        for (const i in indexs) {
            const index = indexs[i];

            let index_name = index.index_name;
            // cas des template de nom pour les indexs sur les tables segmentées
            index_name = index_name.replace('{table_name}', table_name);
            const index_str = await this.get_composite_partial_index_string(index, database_name, table_name);

            if (!index_str) {
                continue;
            }

            const res: any[] = await this.db.query("SELECT * FROM pg_indexes WHERE tablename = '" + table_name + "' and schemaname = '" + database_name + "' and indexname = '" + index_name + "';");
            if ((!!res) && (!!res.length)) {
                continue;
            }

            ConsoleHandler.log('ADDING COMPOSITE PARTIAL INDEX:' + database_name + '.' + table_name + '.' + index_name + ':');
            await this.db.query(index_str);
            res_ = true;
        }

        return res_;
    }

    private async get_composite_partial_index_string(composite_partial_index: ModuleTableCompositePartialIndexVO, schema_name: string, table_name: string): Promise<string> {
        const index_name = composite_partial_index.index_name;
        let res = "CREATE INDEX IF NOT EXISTS " + index_name.replace('{table_name}', table_name) + " ON " + schema_name + '.' + table_name + "(" + composite_partial_index.field_names.join(', ') + ")";
        if (composite_partial_index.context_filters) {
            const conditions: string[] = [];
            const tables_aliases_by_type: { [type: string]: string } = {
                [composite_partial_index.vo_type]: table_name
            };
            for (const i in composite_partial_index.context_filters) {
                const filter = composite_partial_index.context_filters[i];

                await ContextFilterServerController.update_where_conditions(
                    null,
                    0,
                    null,
                    conditions,
                    filter,
                    tables_aliases_by_type,
                );
            }

            res += (conditions.length ? (' WHERE (' + conditions.join(') AND (') + ')') : '');
        }

        return res;
    }

    // istanbul ignore next: cannot test create_new_datatable
    private async create_new_datatable(
        moduleTable: ModuleTableVO,
        database_name: string,
        table_name: string,
        queries_to_try_after_creation: string[],
    ) {

        StatsController.register_stat_COMPTEUR('ModuleTableDBService', 'create_new_datatable', '-');

        const full_name = database_name + '.' + table_name;

        let pgSQL: string = 'CREATE TABLE IF NOT EXISTS ' + full_name + ' (';
        pgSQL += 'id bigserial NOT NULL';
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in fields) {
            const field = fields[i];

            pgSQL += ', ' + field.getPGSqlFieldDescription();

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tsrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_numrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_isoweekdays) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {

                pgSQL += ', ' + field.field_name.toLowerCase() + '_ndx' + ' text';
            }
        }

        pgSQL += ', CONSTRAINT ' + table_name + '_pkey PRIMARY KEY (id)';
        for (const i in fields) {
            const field = fields[i];

            if (field.field_type != ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                continue;
            }
            if (field.has_single_relation) {
                const pgSqlFieldConstraint: string = field.getPGSqlFieldConstraint();

                // Pour les contraintes on check si la table existe déjà, et sinon on stocke la requête pour la faire après les créations de tables
                const target_table = ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type];
                try {

                    if (target_table.full_name != full_name) {
                        await this.db.query('SELECT * FROM ' + target_table.full_name + ' LIMIT 1;');
                    }

                    if (pgSqlFieldConstraint) {
                        pgSQL += ', ' + pgSqlFieldConstraint;
                    }
                } catch (error) {
                    ConsoleHandler.warn('create_new_datatable: foreign key target table not found:' + database_name + '.' + target_table.name + ':' + error + ':on stocke la requête pour plus tard:' + pgSqlFieldConstraint);
                    queries_to_try_after_creation.push('ALTER TABLE ' + full_name + ' ADD ' + pgSqlFieldConstraint + ';');
                }
            }
        }

        /**
         * Ajout des clés d'unicité
         */
        let uniq_constraints = '';
        const uniq_indexes: ModuleTableFieldVO[][] = ModuleTableController.unique_fields_by_vo_type[moduleTable.vo_type];
        if (uniq_indexes && uniq_indexes.length) {
            for (const i in uniq_indexes) {
                const uniq_index = uniq_indexes[i];

                uniq_constraints += ', UNIQUE (' + uniq_index.map((f) => f.field_name).join(', ') + ')';
            }
        }
        pgSQL += uniq_constraints + ');';

        await this.db.none(pgSQL);
    }

    // istanbul ignore next: nothing to test
    private get_limited_seq_label(seq_label: string): string {
        const seq_label_63: string = seq_label.substring(0, 63 - "_id_seq".length);
        return seq_label_63 + "_id_seq";
    }

    // istanbul ignore next: nothing to test
    private get_segmented_table_common_limited_seq_label(moduletable: ModuleTableVO): string {
        return moduletable.name.substring(0, 63 - '_common_id_seq'.length) + '_common_id_seq';
    }

    private check_source_vo_vs_described_vo_consistency(
        moduleTable: ModuleTableVO,
        fields_by_field_name: { [field_name: string]: ModuleTableFieldVO }
    ): void {
        // Liste des champs de SharedFiltersVO à vérifier
        const sharedFiltersVOFields = Object.getOwnPropertyNames(ModuleTableController.vo_constructor_by_vo_type[moduleTable.vo_type].prototype)
            .filter(fieldName => fieldName !== 'id' && fieldName !== '_type');

        // Vérifier chaque champ
        sharedFiltersVOFields.forEach((fieldName) => {
            if (!(fieldName in fields_by_field_name)) {
                ConsoleHandler.error(`check_source_vo_vs_described_vo_consistency: Le champ "${fieldName}" est manquant dans la description de la table "${moduleTable.vo_type}"`);
            }
        });
    }
}
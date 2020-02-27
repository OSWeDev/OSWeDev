import IRange from '../../shared/modules/DataRender/interfaces/IRange';
import IDistantVOBase from '../../shared/modules/IDistantVOBase';
import ModuleTable from '../../shared/modules/ModuleTable';
import ModuleTableField from '../../shared/modules/ModuleTableField';
import ObjectHandler from '../../shared/tools/ObjectHandler';
import RangeHandler from '../../shared/tools/RangeHandler';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import TableColumnDescriptor from './TableColumnDescriptor';
import TableDescriptor from './TableDescriptor';

export default class ModuleTableDBService {

    public static getInstance(db): ModuleTableDBService {
        if (!ModuleTableDBService.instance) {
            ModuleTableDBService.instance = new ModuleTableDBService(db);
        }
        return ModuleTableDBService.instance;
    }
    private static instance: ModuleTableDBService = null;

    private constructor(private db) {
        ModuleTableDBService.instance = this;
    }

    public async datatable_install(moduleTable: ModuleTable<any>) {

        await this.create_or_update_datatable(moduleTable);

        // On appelle le hook de fin d'installation
        if (moduleTable.hook_datatable_install) {

            return await moduleTable.hook_datatable_install(moduleTable);
        }

        return true;
    }

    // Après installation de tous les modules
    public async datatable_configure(moduleTable: ModuleTable<any>) {

        return true;
    }


    // création nouvelle table segmentée => créer la table et changer la séquence pour utiliser la séquence commune => à faire juste avant insertion d'une data sur nouveau segment
    public async add_segmentation_to_moduletable(moduleTable: ModuleTable<any>, segmented_value) {

        let common_id_seq_name = this.get_segmented_table_common_limited_seq_label(moduleTable);
        let table_name = moduleTable.get_segmented_name(segmented_value);
        let database_name = moduleTable.database;
        await this.do_check_or_update_moduletable(moduleTable, database_name, table_name);

        // Dans le doute la séquence peut manquer
        await this.db.query(
            'CREATE SEQUENCE IF NOT EXISTS ' + moduleTable.database + '.' + common_id_seq_name +
            '  INCREMENT 1' +
            '  MINVALUE 1' +
            '  MAXVALUE 9223372036854775807' +
            '  START 1' +
            '  CACHE 1;');


        await this.db.query("ALTER TABLE " + database_name + "." + table_name + " ALTER COLUMN id SET DEFAULT nextval('" + moduleTable.database + "." + common_id_seq_name + "'::regclass);");
    }

    /**
     * Returns the tablename, without schema
     */
    public async get_existing_segmentations_tables_of_moduletable(moduleTable: ModuleTable<any>): Promise<{ [segmented_value: number]: string }> {
        let database_name = moduleTable.database;
        let tables: TableDescriptor[] = await this.db.query("SELECT * FROM pg_catalog.pg_tables WHERE schemaname = '" + database_name + "';");

        let segments_by_segmented_value: { [segmented_value: number]: string } = {};

        for (let i in tables) {
            let table = tables[i];

            let splits = table.tablename.split('_');
            let segmented = parseInt(splits[splits.length - 1]);

            if (!segments_by_segmented_value[segmented]) {
                segments_by_segmented_value[segmented] = table.tablename;
            }
        }

        return segments_by_segmented_value;
    }

    public async create_or_update_datatable(moduleTable: ModuleTable<any>, segments: Array<IRange<any>> = null) {

        let self = this;

        // On va commencer par créer le schema si il existe pas
        if (!!moduleTable.database) {
            await this.db.none('CREATE SCHEMA IF NOT EXISTS ' + moduleTable.database + ';');
        }

        if (moduleTable.is_segmented) {

            let migration_todo: boolean = false;

            if (!segments) {

                // Si on est sur du segmenté on doit vérifier 2 choses :
                //  1- le format de toutes les tables existantes
                //  2- si on trouve aucune table et si on trouve une ancienne table équivalente non segmentée on tente de migrer le format et les données automatiquement

                segments = [];

                let segments_by_segmented_value: { [segmented_value: number]: string } = await this.get_existing_segmentations_tables_of_moduletable(moduleTable);

                if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(segments_by_segmented_value)) {
                    // Aucune table => on tente une migration des datas

                    // On récupère les datas de la colonne de segmentation pour construire par la suite les requetes de migration des datas
                    let segmentation_bdd_values: IDistantVOBase[] = null;

                    try {
                        segmentation_bdd_values = moduleTable.forceNumerics(await this.db.query("SELECT * FROM ref." + moduleTable.name + ";"));
                    } catch (error) {
                    }

                    if ((!segmentation_bdd_values) || (!segmentation_bdd_values.length)) {
                        return;
                    }

                    // TODO FIXME on migre pour le moment que sur un segment de NumRange
                    segments_by_segmented_value = {};

                    for (let i in segmentation_bdd_values) {
                        let segmentation_bdd_value = segmentation_bdd_values[i];

                        let segmented = moduleTable.get_segmented_field_value_from_vo(segmentation_bdd_value);

                        if (!segments_by_segmented_value[segmented]) {
                            segments_by_segmented_value[segmented] = "ok";
                            segments.push(RangeHandler.getInstance().create_single_elt_NumRange(segmented, moduleTable.table_segmented_field_segment_type));
                        }
                    }
                    // On laisse créer les tables et on stocke l'info qu'on devra migrer les datas ensuite.
                    migration_todo = true;
                } else {

                    for (let i in segments_by_segmented_value) {
                        let table_name = segments_by_segmented_value[i];

                        let splits = table_name.split('_');
                        let segmented = parseInt(splits[splits.length - 1]);

                        segments.push(RangeHandler.getInstance().create_single_elt_NumRange(segmented, moduleTable.table_segmented_field_segment_type));
                    }
                }
            }

            let database_name = moduleTable.database;

            let common_id_seq_name = this.get_segmented_table_common_limited_seq_label(moduleTable);
            let max_id = 0;

            // Création / update des structures
            await RangeHandler.getInstance().foreach_ranges(segments, async (segmented_value) => {

                let table_name = moduleTable.get_segmented_name(segmented_value);
                await self.do_check_or_update_moduletable(moduleTable, database_name, table_name);

                ModuleDAOServer.getInstance().segmented_known_databases[database_name + "." + table_name] = true;

                if (!migration_todo) {

                    // Si on est pas en migration, on doit quand même vérifier au cas où la présence de la séquence

                    await this.db.query(
                        'CREATE SEQUENCE IF NOT EXISTS ' + moduleTable.database + '.' + common_id_seq_name +
                        '  INCREMENT 1' +
                        '  MINVALUE 1' +
                        '  MAXVALUE 9223372036854775807' +
                        '  START 1' +
                        '  CACHE 1;');

                    // Si la séquence existe déjà, on doit pouvoir directement demander à changer le lien de séquence (pour le cas de création de nouvelle table)
                    await this.db.query("ALTER TABLE " + database_name + "." + table_name + " ALTER COLUMN id SET DEFAULT nextval('" + moduleTable.database + "." + common_id_seq_name + "'::regclass);");
                }
            }, moduleTable.table_segmented_field_segment_type);

            if (migration_todo) {

                let column_names_list = [];

                column_names_list.push('id');
                let fields = moduleTable.get_fields();
                for (let i in fields) {
                    column_names_list.push(fields[i].field_id);
                }

                let column_names = column_names_list.join(',');

                // Si on est en création => on migre les datas et on compte les datas migrées
                await RangeHandler.getInstance().foreach_ranges(segments, async (segmented_value) => {

                    let table_name = moduleTable.get_segmented_name(segmented_value);

                    // Une fois la création de la table terminée, on peut faire la migration des datas si on attendait de le faire.
                    let field_where_clause = ModuleDAOServer.getInstance().getClauseWhereRangeIntersectsField(moduleTable.table_segmented_field, RangeHandler.getInstance().create_single_elt_NumRange(segmented_value, moduleTable.table_segmented_field_segment_type));

                    await this.db.query('INSERT INTO ' + database_name + '.' + table_name + ' (' + column_names + ') SELECT ' + column_names + ' FROM ref.' + database_name + ' WHERE ' + field_where_clause + ';');

                    let migrated_datas: any[] = await this.db.query('SELECT max(id) m FROM ' + database_name + '.' + table_name + ';');

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
                await RangeHandler.getInstance().foreach_ranges(segments, async (segmented_value) => {

                    let table_name = moduleTable.get_segmented_name(segmented_value);

                    // La table est créée on doit modifier le calcul de la clé primaire (la contrainte est ok, la séquence créée auto est inutile, on la supprime pas pour autant)
                    await this.db.query("ALTER TABLE " + database_name + "." + table_name + " ALTER COLUMN id SET DEFAULT nextval('" + moduleTable.database + "." + common_id_seq_name + "'::regclass);");
                }, moduleTable.table_segmented_field_segment_type);
            }
        } else {

            // On doit entre autre ajouter la table en base qui gère les fields
            if (moduleTable.get_fields() && (moduleTable.get_fields().length > 0)) {
                await self.do_check_or_update_moduletable(moduleTable, moduleTable.database, moduleTable.name);
            }
        }
    }

    private async do_check_or_update_moduletable(moduleTable: ModuleTable<any>, database_name: string, table_name: string) {
        // Changement radical, si on a une table déjà en place on vérifie la structure, principalement pour ajouter des champs supplémentaires
        //  et alerter si il y a des champs en base que l'on ne connait pas dans la structure métier

        let table_cols_sql: string = 'select column_name, column_default, is_nullable, data_type from INFORMATION_SCHEMA.COLUMNS ' +
            'where table_schema = \'' + database_name + '\' and table_name = \'' + table_name + '\';';
        let table_cols: TableColumnDescriptor[] = await this.db.query(table_cols_sql);

        if ((!table_cols) || (!table_cols.length)) {
            await this.create_new_datatable(moduleTable, database_name, table_name);
        } else {
            await this.check_datatable_structure(moduleTable, database_name, table_name, table_cols);
        }
    }

    private async check_datatable_structure(moduleTable: ModuleTable<any>, database_name: string, table_name: string, table_cols: TableColumnDescriptor[]) {

        let fields_by_field_id: { [field_id: string]: ModuleTableField<any> } = {};
        for (let i in moduleTable.get_fields()) {
            let field = moduleTable.get_fields()[i];
            fields_by_field_id[field.field_id] = field;
        }

        let table_cols_by_name: { [col_name: string]: TableColumnDescriptor } = {};
        for (let i in table_cols) {
            let table_col = table_cols[i];
            table_cols_by_name[table_col.column_name] = table_col;
        }

        await this.checkMissingInTS(moduleTable, fields_by_field_id, table_cols_by_name, database_name, table_name);
        await this.checkMissingInDB(moduleTable, fields_by_field_id, table_cols_by_name, database_name, table_name);
        await this.checkColumnsStrutInDB(moduleTable, fields_by_field_id, table_cols_by_name, database_name, table_name);
        await this.checkConstraintsOnForeignKey(moduleTable, fields_by_field_id, table_cols_by_name, database_name, table_name);
    }

    private async checkConstraintsOnForeignKey(
        moduleTable: ModuleTable<any>,
        fields_by_field_id: { [field_id: string]: ModuleTableField<any> },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string) {

        let full_name = database_name + '.' + table_name;

        for (let i in fields_by_field_id) {
            let field = fields_by_field_id[i];

            let constraint = field.getPGSqlFieldConstraint();

            if (!constraint) {
                continue;
            }

            try {
                // Si la contrainte est récente elle devrait avoir la bonne nomenclature, sinon inutile d'en créer une autre
                let pgSQL: string = 'ALTER TABLE ' + full_name + ' DROP CONSTRAINT ' + field.field_id + '_fkey;';
                await this.db.none(pgSQL);

                pgSQL = 'ALTER TABLE ' + full_name + ' ADD ' + constraint + ';';
                await this.db.none(pgSQL);
            } catch (error) {
            }
        }
    }

    /**
     * On cherche les colonnes en trop dans la base et on log en erreur si il y en a
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     */
    private async checkMissingInTS(
        moduleTable: ModuleTable<any>,
        fields_by_field_id: { [field_id: string]: ModuleTableField<any> },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string) {

        let full_name = database_name + '.' + table_name;

        for (let i in table_cols_by_name) {

            // On ignore les ids qui sont jamais dans nos descripteurs logiciel
            if (i.toLowerCase() == 'id') {
                continue;
            }

            if (!fields_by_field_id[i]) {
                console.error('-');
                console.error('INFO  : Champs en trop dans la base de données par rapport à la description logicielle :' + i + ':table:' + full_name + ':');
                console.error('ACTION: AUCUNE, résoudre manuellement');
                console.error('---');
            }
        }
    }

    /**
     * On cherche les colonnes qui manquent pour les ajouter en base et informer de l'ajout
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     */
    private async checkMissingInDB(
        moduleTable: ModuleTable<any>,
        fields_by_field_id: { [field_id: string]: ModuleTableField<any> },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string) {

        let full_name = database_name + '.' + table_name;

        for (let i in moduleTable.get_fields()) {
            let field = moduleTable.get_fields()[i];

            if (!table_cols_by_name[field.field_id]) {
                console.error('-');
                console.error('INFO  : Champs manquant dans la base de données par rapport à la description logicielle :' + field.field_id + ':table:' + full_name + ':');
                console.error('ACTION: Création automatique...');

                try {
                    let pgSQL: string = 'ALTER TABLE ' + full_name + ' ADD COLUMN ' + field.getPGSqlFieldDescription() + ';';
                    await this.db.none(pgSQL);
                    console.error('ACTION: OK');
                } catch (error) {
                    console.error(error);
                }
                console.error('---');
            }
        }
    }

    /**
     * On cherche les colonnes dont la structure diffère pour les ajuster ou simplement informer
     * @param moduleTable
     * @param fields_by_field_id
     * @param table_cols_by_name
     */
    private async checkColumnsStrutInDB(
        moduleTable: ModuleTable<any>,
        fields_by_field_id: { [field_id: string]: ModuleTableField<any> },
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor },
        database_name: string,
        table_name: string) {

        let full_name = database_name + '.' + table_name;

        for (let i in moduleTable.get_fields()) {
            let field = moduleTable.get_fields()[i];

            if (!table_cols_by_name[field.field_id]) {
                continue;
            }

            let table_col = table_cols_by_name[field.field_id];

            // // On check les infos récupérées de la base : column_default, is_nullable, data_type
            // if (field.field_required == (table_col.is_nullable != TableColumnDescriptor.IS_NOT_NULLABLE_VALUE)) {
            //     console.error('-');
            //     console.error('INFO  : Les propriétés isNullable et fieldRequired ne devraient pas être égales. BDD isNullable:' + table_col.is_nullable + ':moduleTableField:' + field.field_required + ':field:' + field.field_id + ':table:' + moduleTable.full_name + ':');
            //     console.error('ACTION: Aucune. Résoudre manuellement');
            //     console.error('---');
            // }
            if (field.field_required == (table_col.is_nullable != TableColumnDescriptor.IS_NOT_NULLABLE_VALUE)) {

                if (!field.field_required) {
                    await this.db.query('ALTER TABLE ' + full_name + ' ALTER COLUMN ' + table_col.column_name + ' DROP NOT NULL;');
                } else {
                    await this.db.query('ALTER TABLE ' + full_name + ' ALTER COLUMN ' + table_col.column_name + ' SET NOT NULL;');
                }
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
                console.error('INFO  : Les types devraient être identiques. BDD data_type:' + table_col.data_type + ':moduleTableField:' + field.getPGSqlFieldType() + ':field:' + field.field_id + ':table:' + full_name + ':');
                console.error('ACTION: Aucune. Résoudre manuellement');
                console.error('---');
            }
        }
    }

    private async create_new_datatable(moduleTable: ModuleTable<any>, database_name: string, table_name: string) {

        let full_name = database_name + '.' + table_name;

        let pgSQL: string = 'CREATE TABLE IF NOT EXISTS ' + full_name + ' (';
        pgSQL += 'id bigserial NOT NULL';
        for (let i = 0; i < moduleTable.get_fields().length; i++) {
            let field = moduleTable.get_fields()[i];

            pgSQL += ', ' + field.getPGSqlFieldDescription();
        }

        pgSQL += ', CONSTRAINT ' + table_name + '_pkey PRIMARY KEY (id)';
        for (let i = 0; i < moduleTable.get_fields().length; i++) {
            let field = moduleTable.get_fields()[i];

            if (field.field_type != ModuleTableField.FIELD_TYPE_foreign_key) {
                continue;
            }
            if (field.has_relation) {
                pgSQL += ', ' + field.getPGSqlFieldConstraint();
            }
        }
        pgSQL += ');';

        await this.db.none(pgSQL);
    }

    private get_limited_seq_label(seq_label: string): string {
        let seq_label_63: string = seq_label.substring(0, 63 - "_id_seq".length);
        return seq_label_63 + "_id_seq";
    }

    private get_segmented_table_common_limited_seq_label(moduletable: ModuleTable<any>): string {
        return moduletable.name.substring(0, 63 - '_common_id_seq'.length) + '_common_id_seq';
    }
}
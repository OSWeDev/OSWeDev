import ModuleTable from '../../shared/modules/ModuleTable';
import DefaultTranslationsServerManager from './Translation/DefaultTranslationsServerManager';
import ConfigurationService from '../env/ConfigurationService';
import ModuleTableField from '../../shared/modules/ModuleTableField';
import TableColumnDescriptor from './TableColumnDescriptor';

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

    // Première étape : Installation de la table et de la vue pour NGA
    public async datatable_install(moduleTable: ModuleTable<any>) {

        // console.log('Installation de la table "' + moduleTable.full_name + '" du module :"' + moduleTable.module.name + '"');

        await this.create_datatable(moduleTable);

        // Si il y a un problème pendant cette étape, on renvoie autre chose que true pour l'indiquer
        return true;
    }

    // Après installation de tous les modules
    public async datatable_configure(moduleTable: ModuleTable<any>) {

        return true;
    }

    // ETAPE 1 de l'installation : Création de la table
    private async create_datatable(moduleTable: ModuleTable<any>) {
        // console.log(moduleTable.full_name + " - install - ETAPE 1");

        // On va commencer par créer le schema si il existe pas
        if (!!moduleTable.database) {
            await this.db.none('CREATE SCHEMA IF NOT EXISTS ' + moduleTable.database + ';');
        }

        // On doit entre autre ajouter la table en base qui gère les fields
        if (moduleTable.fields && (moduleTable.fields.length > 0)) {

            // Changement radical, si on a une table déjà en place on vérifie la structure, principalement pour ajouter des champs supplémentaires
            //  et alerter si il y a des champs en base que l'on ne connait pas dans la structure métier

            let table_cols_sql: string = 'select column_name, column_default, is_nullable, data_type from INFORMATION_SCHEMA.COLUMNS ' +
                'where table_schema = \'' + moduleTable.database + '\' and table_name = \'' + moduleTable.name + '\';';
            let table_cols: TableColumnDescriptor[] = await this.db.query(table_cols_sql);

            if ((!table_cols) || (!table_cols.length)) {
                await this.create_new_datatable(moduleTable);
            } else {
                await this.check_datatable_structure(moduleTable, table_cols);
            }

            await this.create_datatable_view_for_nga(moduleTable);
        } else {
            this.datatable_install_end(moduleTable);
        }
    }

    private async check_datatable_structure(moduleTable: ModuleTable<any>, table_cols: TableColumnDescriptor[]) {

        let fields_by_field_id: { [field_id: string]: ModuleTableField<any> } = {};
        for (let i in moduleTable.fields) {
            let field = moduleTable.fields[i];
            fields_by_field_id[field.field_id] = field;
        }

        let table_cols_by_name: { [col_name: string]: TableColumnDescriptor } = {};
        for (let i in table_cols) {
            let table_col = table_cols[i];
            table_cols_by_name[table_col.column_name] = table_col;
        }

        await this.checkMissingInTS(moduleTable, fields_by_field_id, table_cols_by_name);
        await this.checkMissingInDB(moduleTable, fields_by_field_id, table_cols_by_name);
        await this.checkColumnsStrutInDB(moduleTable, fields_by_field_id, table_cols_by_name);
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
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor }) {

        for (let i in table_cols_by_name) {

            // On ignore les ids qui sont jamais dans nos descripteurs logiciel
            if (i.toLowerCase() == 'id') {
                continue;
            }

            if (!fields_by_field_id[i]) {
                console.error('-');
                console.error('INFO  : Champs en trop dans la base de données par rapport à la description logicielle :' + i + ':table:' + moduleTable.full_name + ':');
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
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor }) {

        for (let i in moduleTable.fields) {
            let field = moduleTable.fields[i];

            if (!table_cols_by_name[field.field_id]) {
                console.error('-');
                console.error('INFO  : Champs manquant dans la base de données par rapport à la description logicielle :' + field.field_id + ':table:' + moduleTable.full_name + ':');
                console.error('ACTION: Création automatique...');

                try {
                    let pgSQL: string = 'ALTER TABLE ' + moduleTable.full_name + ' ADD COLUMN ' + field.getPGSqlFieldDescription() + ';';
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
        table_cols_by_name: { [col_name: string]: TableColumnDescriptor }) {

        for (let i in moduleTable.fields) {
            let field = moduleTable.fields[i];

            if (!table_cols_by_name[field.field_id]) {
                continue;
            }

            let table_col = table_cols_by_name[field.field_id];

            // On check les infos récupérées de la base : column_default, is_nullable, data_type
            if (field.field_required == (table_col.is_nullable != TableColumnDescriptor.IS_NOT_NULLABLE_VALUE)) {
                console.error('-');
                console.error('INFO  : Les propriétés isNullable et fieldRequired ne devraient pas être égales. BDD isNullable:' + table_col.is_nullable + ':moduleTableField:' + field.field_required + ':field:' + field.field_id + ':table:' + moduleTable.full_name + ':');
                console.error('ACTION: Aucune. Résoudre manuellement');
                console.error('---');
            }

            // // En même temps ça parait pas gravissime
            // if (field.field_default == table_col.column_default) {
            //     console.error('-');
            //     console.error('INFO  : Les valeurs par défaut devraient être égales. BDD column_default:' + table_col.column_default + ':moduleTableField:' + field.field_default + ':table:' + moduleTable.full_name + ':');
            //     console.error('ACTION: Aucune. Résoudre manuellement');
            //     console.error('---');
            // }

            if (!field.isAcceptableCurrentDBType(table_col.data_type)) {
                console.error('-');
                console.error('INFO  : Les types devraient être identiques. BDD data_type:' + table_col.data_type + ':moduleTableField:' + field.getPGSqlFieldType() + ':field:' + field.field_id + ':table:' + moduleTable.full_name + ':');
                console.error('ACTION: Aucune. Résoudre manuellement');
                console.error('---');
            }
        }
    }

    private async create_new_datatable(moduleTable: ModuleTable<any>) {
        let pgSQL: string = 'CREATE TABLE IF NOT EXISTS ' + moduleTable.full_name + ' (';
        pgSQL += 'id bigserial NOT NULL';
        for (let i = 0; i < moduleTable.fields.length; i++) {
            let field = moduleTable.fields[i];

            pgSQL += ', ' + field.getPGSqlFieldDescription();
        }

        pgSQL += ', CONSTRAINT ' + moduleTable.name + '_pkey PRIMARY KEY (id)';
        for (let i = 0; i < moduleTable.fields.length; i++) {
            let field = moduleTable.fields[i];

            if (field.has_relation) {
                pgSQL += ', ' + field.getPGSqlFieldConstraint();
            }
        }
        pgSQL += ');';

        await this.db.none(pgSQL);
    }

    // ETAPE 2 de l'installation
    private async create_datatable_view_for_nga(moduleTable: ModuleTable<any>) {

        // // On crée ensuite la vue pour NGA
        // let request = 'CREATE OR REPLACE VIEW ' + moduleTable.admin_view_full_name + ' AS SELECT v.id';
        // for (let i = 0; i < moduleTable.fields.length; i++) {
        //     let field = moduleTable.fields[i];

        //     let field_id = "v." + field.field_id;

        //     if (field.field_type == "pct") {
        //         field_id = "admin.format_percent(v." + field.field_id + "::numeric) AS " + field.field_id;
        //     }

        //     request += ', ' + field_id;
        // }
        // if (moduleTable.nga_view_select_addon && (moduleTable.nga_view_select_addon != "")) {
        //     request += ', ' + moduleTable.nga_view_select_addon;
        // }

        // request += ' FROM ' + moduleTable.full_name + ' v';

        // if (moduleTable.nga_join) {
        //     request += ' ' + moduleTable.nga_join;
        // }

        // if (moduleTable.nga_view_order_by) {
        //     request += ' ' + moduleTable.nga_view_order_by;
        // }

        // request += ';';

        // // console.log('Création de la vue NGA pour la table ' + moduleTable.full_name);
        // await this.db.query(request);

        // let simplefieldlist = '';
        // let newfieldlist = '';
        // let newfieldlistaffectation = '';
        // for (let i = 0; i < moduleTable.fields.length; i++) {
        //     let field = moduleTable.fields[i];

        //     if (i > 0) {
        //         simplefieldlist += ', ';
        //         newfieldlist += ', ';
        //         newfieldlistaffectation += ', ';
        //     }
        //     simplefieldlist += field.field_id;

        //     let fieldIdTmp = 'new.' + field.field_id;
        //     if (field.field_type == "pct") {
        //         fieldIdTmp = "admin.parse_percent(new." + field.field_id + ")";
        //     }

        //     newfieldlist += fieldIdTmp;
        //     newfieldlistaffectation += field.field_id + ' = ' + fieldIdTmp;
        // }

        // let query = 'CREATE OR REPLACE FUNCTION ' + moduleTable.admin_trigger_full_name + '() RETURNS trigger AS \n' +
        //     '$BODY$\n' +
        //     'DECLARE\n' +
        //     'BEGIN\n' +
        //     'IF TG_OP = \'INSERT\'\n' +
        //     'THEN\n' +
        //     'INSERT INTO ' + moduleTable.full_name + ' (' + simplefieldlist + ')\n' +
        //     'VALUES\n' +
        //     '(\n' +
        //     newfieldlist +
        //     ')\n' +
        //     'RETURNING id\n' +
        //     'INTO new.id;\n' +
        //     'RETURN new;\n' +
        //     'ELSIF TG_OP = \'UPDATE\'\n' +
        //     'THEN\n' +
        //     'UPDATE ' + moduleTable.full_name + '\n' +
        //     'SET\n' +
        //     'id   = new.id, ' +
        //     newfieldlistaffectation + '\n' +
        //     'WHERE id = old.id;\n' +
        //     'RETURN new;\n' +
        //     'ELSIF TG_OP = \'DELETE\'\n' +
        //     'THEN\n' +
        //     'DELETE FROM ' + moduleTable.full_name + '\n' +
        //     'WHERE id = old.id;\n' +
        //     'RETURN old;\n' +
        //     'END IF;\n' +
        //     'RETURN NULL;\n' +
        //     'END;\n' +
        //     '$BODY$\n' +
        //     'LANGUAGE plpgsql VOLATILE\n' +
        //     'COST 100;';

        // await this.db.query(query);

        // await this.db.query('DROP TRIGGER IF EXISTS ' + moduleTable.admin_trigger_name + ' on ' + moduleTable.admin_view_full_name + ';');
        // await this.db.query('CREATE TRIGGER ' + moduleTable.admin_trigger_name +
        //     ' INSTEAD OF INSERT OR UPDATE OR DELETE ON ' + moduleTable.admin_view_full_name +
        //     ' FOR EACH ROW EXECUTE PROCEDURE ' + moduleTable.admin_trigger_full_name + '();');

        // On appelle le hook de fin d'installation
        await this.datatable_install_end(moduleTable);
    }

    // ETAPE 5 de l'installation
    private async datatable_install_end(moduleTable: ModuleTable<any>) {
        // console.log(moduleTable.full_name + " - install - ETAPE 5");

        // On appelle le hook de fin d'installation
        if (moduleTable.hook_datatable_install) {

            return await moduleTable.hook_datatable_install(moduleTable);
        }
    }

    private get_limited_seq_label(seq_label: string): string {
        let seq_label_63: string = seq_label.substring(0, 63 - "_id_seq".length);
        return seq_label_63 + "_id_seq";
    }
}
import ModuleTable from '../../shared/modules/ModuleTable';
import DefaultTranslationsServerManager from './Translation/DefaultTranslationsServerManager';
import ConfigurationService from '../env/ConfigurationService';

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

        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations();

        return true;
    }

    // ETAPE 1 de l'installation : Création de la table
    private async create_datatable(moduleTable: ModuleTable<any>) {
        // console.log(moduleTable.full_name + " - install - ETAPE 1");

        // On doit entre autre ajouter la table en base qui gère les fields
        if (moduleTable.fields && (moduleTable.fields.length > 0)) {

            let first_install = false;

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
            await this.create_datatable_view_for_nga(moduleTable);
        } else {
            this.datatable_install_end(moduleTable);
        }
    }

    // ETAPE 2 de l'installation
    private async create_datatable_view_for_nga(moduleTable: ModuleTable<any>) {

        // On crée ensuite la vue pour NGA
        let request = 'CREATE OR REPLACE VIEW ' + moduleTable.admin_view_full_name + ' AS SELECT v.id';
        for (let i = 0; i < moduleTable.fields.length; i++) {
            let field = moduleTable.fields[i];

            let field_id = "v." + field.field_id;

            if (field.field_type == "pct") {
                field_id = "admin.format_percent(v." + field.field_id + "::numeric) AS " + field.field_id;
            }

            request += ', ' + field_id;
        }
        if (moduleTable.nga_view_select_addon && (moduleTable.nga_view_select_addon != "")) {
            request += ', ' + moduleTable.nga_view_select_addon;
        }

        request += ' FROM ' + moduleTable.full_name + ' v';

        if (moduleTable.nga_join) {
            request += ' ' + moduleTable.nga_join;
        }

        if (moduleTable.nga_view_order_by) {
            request += ' ' + moduleTable.nga_view_order_by;
        }

        request += ';';

        // console.log('Création de la vue NGA pour la table ' + moduleTable.full_name);
        await this.db.query(request);

        let simplefieldlist = '';
        let newfieldlist = '';
        let newfieldlistaffectation = '';
        for (let i = 0; i < moduleTable.fields.length; i++) {
            let field = moduleTable.fields[i];

            if (i > 0) {
                simplefieldlist += ', ';
                newfieldlist += ', ';
                newfieldlistaffectation += ', ';
            }
            simplefieldlist += field.field_id;

            let fieldIdTmp = 'new.' + field.field_id;
            if (field.field_type == "pct") {
                fieldIdTmp = "admin.parse_percent(new." + field.field_id + ")";
            }

            newfieldlist += fieldIdTmp;
            newfieldlistaffectation += field.field_id + ' = ' + fieldIdTmp;
        }

        let query = 'CREATE OR REPLACE FUNCTION ' + moduleTable.admin_trigger_full_name + '() RETURNS trigger AS \n' +
            '$BODY$\n' +
            'DECLARE\n' +
            'BEGIN\n' +
            'IF TG_OP = \'INSERT\'\n' +
            'THEN\n' +
            'INSERT INTO ' + moduleTable.full_name + ' (' + simplefieldlist + ')\n' +
            'VALUES\n' +
            '(\n' +
            newfieldlist +
            ')\n' +
            'RETURNING id\n' +
            'INTO new.id;\n' +
            'RETURN new;\n' +
            'ELSIF TG_OP = \'UPDATE\'\n' +
            'THEN\n' +
            'UPDATE ' + moduleTable.full_name + '\n' +
            'SET\n' +
            'id   = new.id, ' +
            newfieldlistaffectation + '\n' +
            'WHERE id = old.id;\n' +
            'RETURN new;\n' +
            'ELSIF TG_OP = \'DELETE\'\n' +
            'THEN\n' +
            'DELETE FROM ' + moduleTable.full_name + '\n' +
            'WHERE id = old.id;\n' +
            'RETURN old;\n' +
            'END IF;\n' +
            'RETURN NULL;\n' +
            'END;\n' +
            '$BODY$\n' +
            'LANGUAGE plpgsql VOLATILE\n' +
            'COST 100;';

        await this.db.query(query);

        await this.db.query('DROP TRIGGER IF EXISTS ' + moduleTable.admin_trigger_name + ' on ' + moduleTable.admin_view_full_name + ';');
        await this.db.query('CREATE TRIGGER ' + moduleTable.admin_trigger_name +
            ' INSTEAD OF INSERT OR UPDATE OR DELETE ON ' + moduleTable.admin_view_full_name +
            ' FOR EACH ROW EXECUTE PROCEDURE ' + moduleTable.admin_trigger_full_name + '();');

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
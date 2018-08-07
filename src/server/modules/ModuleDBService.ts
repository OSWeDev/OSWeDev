import ModuleDBField from '../../shared/modules/ModuleTableField';
import ModuleDBTable from '../../shared/modules/ModuleTable';
import ModuleParamChange from '../../shared/modules/ModuleParamChange';
import Module from '../../shared/modules/Module';
import ModuleTableDBService from './ModuleTableDBService';
import ConfigurationService from '../env/ConfigurationService';

export default class ModuleDBService {

    public static getInstance(db): ModuleDBService {
        if (!ModuleDBService.instance) {
            ModuleDBService.instance = new ModuleDBService(db);
        }
        return ModuleDBService.instance;
    }
    private static instance: ModuleDBService = null;
    private static reloadParamsTimeout: number = 30000;

    public hook_after_registered_all_modules: (modules: Module[]) => {};

    private registered_modules: Module[] = [];
    private bdd_owner: string;

    private constructor(private db) {
        ModuleDBService.instance = this;
        this.bdd_owner = ConfigurationService.getInstance().getNodeConfiguration().BDD_OWNER;
    }

    // Dernière étape : Configure
    public async module_configure(module: Module) {
        // Cette fonction a pour vocation de configurer le module pour ce lancement (chargement d'infos depuis la BDD, ...)

        // On lance aussi la configuration des tables
        for (let i in module.datatables) {
            await ModuleTableDBService.getInstance(this.db).datatable_configure(module.datatables[i]);
        }

        // On appelle le hook
        if (!await module.hook_module_configure(this.db)) {
            return false;
        }

        // Si il y a un problème pendant cette étape, on renvoie autre chose que true pour l'indiquer
        return true;
    }

    public async module_install(module: Module) {

        // console.log('Installation du module "' + module.name + '"');

        // Cette fonction a pour vocation de vérifier la présence des configurations nécessaires au fonctionnement du module
        // 	Par exemple une table dédiée au stockage des infos du module, ... les params sont gérés directement par la définition des champs (this.params_fields)

        await this.create_params_table(module);

        // Si il y a un problème pendant cette étape, on renvoie autre chose que true pour l'indiquer
        return true;
    }

    // ETAPE 1 de l'installation
    private async create_params_table(module: Module) {
        // console.log(module.name + " - install - ETAPE 1");

        // On doit entre autre ajouter la table en base qui gère les fields
        if (module.fields && (module.fields.length > 0)) {

            let first_install = false;

            let pgSQL = 'CREATE TABLE IF NOT EXISTS admin.module_' + module.name + ' (';
            pgSQL += 'id bigserial NOT NULL';
            for (let i = 0; i < module.fields.length; i++) {
                let field = module.fields[i];

                field.setLabelCodeText(module.name);

                pgSQL += ', ' + field.getPGSqlFieldDescription();
            }
            pgSQL += ', CONSTRAINT module_' + module.name + '_pkey PRIMARY KEY (id)';
            pgSQL += ');';

            await this.db.none(pgSQL);

            await this.db.none('GRANT ALL ON TABLE admin.module_' + module.name + ' TO ' + this.bdd_owner + ';');

            // Ajouter une ligne avec les valeurs par défaut (donc un simple insert puisque normalement on a déjà pris en compte les valeurs par défaut avant)
            //  Si la ligne existe pas encore, sinon on charge les fields.
            let rows = await this.db.query('select * from admin.module_' + module.name + ';');

            if ((!rows) || (!rows[0])) {
                // La ligne n'existe pas encore, on la crée
                first_install = true;
                await this.db.query('INSERT INTO admin.module_' + module.name + ' DEFAULT VALUES;');

                await this.loadParams(module);

                await this.create_params_view_for_nga(module);
                return true;
            }

            await this.readParams(module, rows[0]);
            await this.create_params_view_for_nga(module);
        } else {
            await this.add_module_to_modules_table(module);
        }
    }

    // ETAPE 2 de l'installation
    private async create_params_view_for_nga(module: Module) {

        // On crée ensuite la vue pour NGA
        let request = 'CREATE OR REPLACE VIEW admin.view_module_' + module.name + ' AS SELECT v.id';
        for (let i = 0; i < module.fields.length; i++) {
            let field = module.fields[i];

            request += ', v.' + field.field_id;
        }
        request += ' FROM admin.module_' + module.name + ' v;';

        await this.db.query(request);

        await this.db.query('ALTER TABLE admin.view_module_' + module.name + ' OWNER TO ' + this.bdd_owner + ';');

        await this.db.query('GRANT ALL ON TABLE admin.view_module_' + module.name + ' TO ' + this.bdd_owner + ';');

        let simplefieldlist = '';
        let newfieldlist = '';
        let newfieldlistaffectation = '';
        for (let i = 0; i < module.fields.length; i++) {
            let field = module.fields[i];

            if (i > 0) {
                simplefieldlist += ', ';
                newfieldlist += ', ';
                newfieldlistaffectation += ', ';
            }
            simplefieldlist += field.field_id;
            newfieldlist += 'new.' + field.field_id;
            newfieldlistaffectation += field.field_id + ' = new.' + field.field_id;
        }

        let query = 'CREATE OR REPLACE FUNCTION admin.trigger_module_' + module.name + '() RETURNS trigger AS \n' +
            '$BODY$\n' +
            'DECLARE\n' +
            'BEGIN\n' +
            'IF TG_OP = \'INSERT\'\n' +
            'THEN\n' +
            'INSERT INTO admin.module_' + module.name + ' (' + simplefieldlist + ')\n' +
            'VALUES\n' +
            '(\n' +
            newfieldlist +
            ')\n' +
            'RETURNING id\n' +
            'INTO new.id;\n' +
            'RETURN new;\n' +
            'ELSIF TG_OP = \'UPDATE\'\n' +
            'THEN\n' +
            'UPDATE admin.module_' + module.name + '\n' +
            'SET\n' +
            'id   = new.id, ' +
            newfieldlistaffectation + '\n' +
            'WHERE id = old.id;\n' +
            'RETURN new;\n' +
            'ELSIF TG_OP = \'DELETE\'\n' +
            'THEN\n' +
            'DELETE FROM admin.module_' + module.name + '\n' +
            'WHERE id = old.id;\n' +
            'RETURN old;\n' +
            'END IF;\n' +
            'RETURN NULL;\n' +
            'END;\n' +
            '$BODY$\n' +
            'LANGUAGE plpgsql VOLATILE\n' +
            'COST 100;';

        try {
            await this.db.query(query);
        } catch (error) {
            console.log(error);
        }

        try {
            await this.db.query('ALTER FUNCTION admin.trigger_module_' + module.name + '() OWNER TO ' + this.bdd_owner + ';\n');
        } catch (error) {
            console.log(error);
        }

        await this.db.query('DROP TRIGGER IF EXISTS trigger_module_' + module.name + ' ON admin.view_module_' + module.name + ';');
        await this.db.query('CREATE TRIGGER trigger_module_' + module.name +
            ' INSTEAD OF INSERT OR UPDATE OR DELETE ON admin.view_module_' + module.name +
            ' FOR EACH ROW EXECUTE PROCEDURE admin.trigger_module_' + module.name + '();');

        await this.add_module_to_modules_table(module);
    }

    // ETAPE 3 de l'installation
    private async add_module_to_modules_table(module: Module) {
        // console.log(module.name + " - install - ETAPE 3");


        // Et le paramètre dans la table de gestion des modules pour activer ou désactiver ce module.
        //  Par défaut tous les modules sont désactivés, il faut relancer node pour les activer.
        let rows = await this.db.query('SELECT "actif" FROM admin.modules WHERE name = \'' + module.name + '\';');

        if ((!rows) || (!rows[0]) || (rows[0].actif === undefined)) {
            // La ligne n'existe pas, on l'ajoute, en inactivant le module par défaut
            module.actif = false;
            await this.db.query('INSERT INTO admin.modules (name, actif) VALUES (\'' + module.name + '\', \'' + module.actif + '\')');

            // TODO : FIXME : MODIF : JNE : On ne crée les tables que si on est actif. await this.create_datas_tables(module);
            // il faut pouvoir activer les modules à la volée et changer des params sans avoir à recharger toute l'appli.
            // à creuser

            // console.log("Ajout du module dans la liste des modules");
            return true;
        } else {
            module.actif = rows[0].actif;

            // TODO : FIXME : MODIF : JNE : On ne crée les tables que si on est actif. await this.create_datas_tables(module);
            // il faut pouvoir activer les modules à la volée et changer des params sans avoir à recharger toute l'appli.
            // à creuser
            if (module.actif) {
                await this.create_datas_tables(module);
            }
        }

        return true;
    }

    // ETAPE 4 de l'installation
    private async create_datas_tables(module: Module) {
        // console.log(module.name + " - install - ETAPE 4");

        for (let i in module.datatables) {
            let datatable = module.datatables[i];

            await ModuleTableDBService.getInstance(this.db).datatable_install(datatable);
        }

        await this.module_install_end(module);
    }

    // ETAPE 5 de l'installation
    private async module_install_end(module: Module) {
        // console.log(module.name + " - install - ETAPE 5");
        let self = this;

        // On lance le thread de reload de la conf toutes les X seconds, si il y a des paramètres
        if (module.fields && (module.fields.length > 0)) {
            setTimeout(function () {
                self.reloadParamsThread(module);
            }, ModuleDBService.reloadParamsTimeout);
        }

        // On appelle le hook de fin d'installation
        await module.hook_module_install(this.db);
    }

    private async loadParams(module: Module) {


        // console.log('Rechargement de la conf du module ' + module.name);

        let rows = await this.db.query('select * from admin.module_' + module.name + ';');

        if ((!rows) || (!rows[0])) {
            console.error("Les paramètres du module ne sont pas disponibles");
            return [];
        }

        return await this.readParams(module, rows[0]);
    }

    private readParams(module: Module, params): Array<ModuleParamChange<any>> {
        let paramsChanged: Array<ModuleParamChange<any>> = new Array<ModuleParamChange<any>>();

        for (let i = 0; i < module.fields.length; i++) {
            let field = module.fields[i];

            if (field.field_value != params[field.field_id]) {
                paramsChanged.push(
                    new ModuleParamChange<any>(field.field_id,
                        field.field_value,
                        params[field.field_id]));
                console.log("Parameter changed:" + module.name + ":" + field.field_id + ":" + field.field_value + ":" + params[field.field_id] + ":");
            }
            field.field_value = params[field.field_id];
            field.field_loaded = true;
        }

        return paramsChanged;
    }

    private async reloadParamsThread(module: Module) {

        let self = this;
        let paramsChanged: Array<ModuleParamChange<any>> = await this.loadParams(module);

        if (paramsChanged && paramsChanged.length) {
            await module.hook_module_on_params_changed(paramsChanged);
        }

        setTimeout(function () {
            self.reloadParamsThread(module);
        }, ModuleDBService.reloadParamsTimeout);
    }
}
import Module from '../../shared/modules/Module';
import ModuleParamChange from '../../shared/modules/ModuleParamChange';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../shared/tools/ThreadHandler';
import ConfigurationService from '../env/ConfigurationService';
import ModuleTableDBService from './ModuleTableDBService';

export default class ModuleDBService {

    public static reloadParamsTimeout: number = 30000;

    public static getInstance(db): ModuleDBService {
        if (!ModuleDBService.instance) {
            ModuleDBService.instance = new ModuleDBService(db);
        }
        return ModuleDBService.instance;
    }
    private static instance: ModuleDBService = null;

    /**
     * Local thread cache -----
     */
    public hook_after_registered_all_modules: (modules: Module[]) => {};

    private bdd_owner: string;
    /**
     * ----- Local thread cache
     */

    private constructor(private db) {
        ModuleDBService.instance = this;
        this.bdd_owner = ConfigurationService.getInstance().node_configuration.BDD_OWNER;
    }

    public async load_or_create_module_is_actif(module: Module) {

        // Et le paramètre dans la table de gestion des modules pour activer ou désactiver ce module.
        //  Par défaut tous les modules sont désactivés, il faut relancer node pour les activer.
        let rows = await this.db.query('SELECT "actif" FROM admin.modules WHERE name = \'' + module.name + '\';');

        if ((!rows) || (!rows[0]) || (rows[0].actif === undefined)) {
            // La ligne n'existe pas, on l'ajoute
            module.actif = module.activate_on_installation;
            await this.db.query('INSERT INTO admin.modules (name, actif) VALUES (\'' + module.name + '\', \'' + module.actif + '\')');
        } else {
            module.actif = rows[0].actif;
        }
    }

    public async reloadParamsThread(module: Module) {

        while (true) {

            await ThreadHandler.getInstance().sleep(ModuleDBService.reloadParamsTimeout);

            let paramsChanged: Array<ModuleParamChange<any>> = await this.loadParams(module);

            if (paramsChanged && paramsChanged.length) {
                await module.hook_module_on_params_changed(paramsChanged);
            }
        }
    }

    // Dernière étape : Configure
    public async module_configure(module: Module) {
        // Cette fonction a pour vocation de configurer le module pour ce lancement (chargement d'infos depuis la BDD, ...)

        // On lance aussi la configuration des tables
        for (let i in module.datatables) {
            await ModuleTableDBService.getInstance(this.db).datatable_configure(module.datatables[i]);
        }

        // On appelle le hook
        if (!await module.hook_module_configure()) {
            return false;
        }

        // Si il y a un problème pendant cette étape, on renvoie autre chose que true pour l'indiquer
        return true;
    }

    public async loadParams(module: Module) {


        // console.log('Rechargement de la conf du module ' + module.name);

        let rows = await this.db.query('select * from admin.module_' + module.name + ';');

        if ((!rows) || (!rows[0])) {
            console.error("Les paramètres du module ne sont pas disponibles");
            return [];
        }

        return await this.readParams(module, rows[0]);
    }

    public async module_install(module: Module) {

        // console.log('Installation du module "' + module.name + '"');

        // Cette fonction a pour vocation de vérifier la présence des configurations nécessaires au fonctionnement du module
        // 	Par exemple une table dédiée au stockage des infos du module, ... les params sont gérés directement par la définition des champs (this.params_fields)

        await this.create_params_table(module);
        await this.add_module_to_modules_table(module);

        // TODO : FIXME : MODIF : JNE : On ne crée les tables que si on est actif. await this.create_datas_tables(module);
        // il faut pouvoir activer les modules à la volée et changer des params sans avoir à recharger toute l'appli.
        // à creuser
        if (module.actif) {
            await this.create_datas_tables(module);
        }

        await this.module_install_end(module);

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
                return true;
            }

            await this.readParams(module, rows[0]);
        }
    }

    // ETAPE 3 de l'installation
    private async add_module_to_modules_table(module: Module) {

        await this.load_or_create_module_is_actif(module);

        return true;
    }

    // ETAPE 4 de l'installation
    private async create_datas_tables(module: Module) {
        // console.log(module.name + " - install - ETAPE 4");

        /**
         * FIXME : on peut pas faire ça en fait
         */
        // let promises = [];
        // let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));
        for (let i in module.datatables) {
            let datatable = module.datatables[i];

            // if (promises && (promises.length >= max)) {
            //     await Promise.all(promises);
            //     promises = [];
            // }

            await ModuleTableDBService.getInstance(this.db).datatable_install(datatable);
            // promises.push(ModuleTableDBService.getInstance(this.db).datatable_install(datatable));
        }
        // if (promises && promises.length) {
        //     await Promise.all(promises);
        // }

        // On appelle le hook de fin d'installation
        for (let i in module.datatables) {
            let datatable = module.datatables[i];

            if (datatable.hook_datatable_install) {

                return await datatable.hook_datatable_install(datatable);
            }
        }
    }

    // ETAPE 5 de l'installation
    private async module_install_end(module: Module) {
        // console.log(module.name + " - install - ETAPE 5");

        // On lance le thread de reload de la conf toutes les X seconds, si il y a des paramètres
        if (module.fields && (module.fields.length > 0)) {
            this.reloadParamsThread(module).then().catch((error) => ConsoleHandler.getInstance().error(error));
        }

        // On appelle le hook de fin d'installation
        await module.hook_module_install();
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
}
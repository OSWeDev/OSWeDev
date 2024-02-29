import ModuleTableController from '../../shared/modules/DAO/ModuleTableController';
import Module from '../../shared/modules/Module';
import ModuleTableDBService from './ModuleTableDBService';

export default class ModuleDBService {

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
    private has_preloaded_modules_is_actif: boolean = false;
    private preloaded_modules_is_actif: { [module_name: string]: boolean } = {};
    /**
     * ----- Local thread cache
     */

    private constructor(private db) {
        ModuleDBService.instance = this;
    }

    public async preload_modules_is_actif() {
        if (this.has_preloaded_modules_is_actif) {
            return;
        }
        this.has_preloaded_modules_is_actif = true;

        const rows = await this.db.query('SELECT "name", "actif" FROM admin.modules;');
        for (const i in rows) {
            const row = rows[i];

            this.preloaded_modules_is_actif[row.name] = row.actif;
        }
    }

    public async load_or_create_module_is_actif(module: Module) {

        if (!this.has_preloaded_modules_is_actif) {
            await this.preload_modules_is_actif();
        }

        const is_actif = this.preloaded_modules_is_actif[module.name];
        if (typeof is_actif === "undefined") {
            // La ligne n'existe pas, on l'ajoute
            module.actif = module.activate_on_installation;
            await this.db.query('INSERT INTO admin.modules (name, actif) VALUES (\'' + module.name + '\', \'' + module.actif + '\')');
        } else {
            module.actif = is_actif;
        }
    }

    // Dernière étape : Configure
    public async module_configure(module: Module) {
        // Cette fonction a pour vocation de configurer le module pour ce lancement (chargement d'infos depuis la BDD, ...)

        // On lance aussi la configuration des tables
        for (const vo_type in ModuleTableController.vo_type_by_module_name[module.name]) {
            await ModuleTableDBService.getInstance(this.db).datatable_configure(ModuleTableController.module_tables_by_vo_type[vo_type]);
        }

        // On appelle le hook
        if (!await module.hook_module_configure()) {
            return false;
        }

        // Si il y a un problème pendant cette étape, on renvoie autre chose que true pour l'indiquer
        return true;
    }

    public async module_install(module: Module) {

        // console.log('Installation du module "' + module.name + '"');

        // Cette fonction a pour vocation de vérifier la présence des configurations nécessaires au fonctionnement du module
        // 	Par exemple une table dédiée au stockage des infos du module, ... les params sont gérés directement par la définition des champs (this.params_fields)

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
        // let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        for (const vo_type in ModuleTableController.vo_type_by_module_name[module.name]) {
            const datatable = ModuleTableController.module_tables_by_vo_type[vo_type];

            // if (promises && (promises.length >= max)) {
            //     await all_promises(promises);
            //     promises = [];
            // }

            await ModuleTableDBService.getInstance(this.db).datatable_install(datatable);
            // promises.push(ModuleTableDBService.getInstance(this.db).datatable_install(datatable));
        }
    }

    // ETAPE 5 de l'installation
    private async module_install_end(module: Module) {

        // On appelle le hook de fin d'installation
        await module.hook_module_install();
    }
}
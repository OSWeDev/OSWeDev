import ModulesManager from "../../shared/modules/ModulesManager";

export default class PreloadedModuleServerController {

    public static has_preloaded_modules_is_actif: boolean = false;

    public static db: any;

    public static async preload_modules_is_actif() {
        if (PreloadedModuleServerController.has_preloaded_modules_is_actif) {
            return;
        }
        PreloadedModuleServerController.has_preloaded_modules_is_actif = true;

        try {
            let rows = await PreloadedModuleServerController.db.query('SELECT "name", "actif" FROM admin.modules;');
            for (let i in rows) {
                let row = rows[i];

                ModulesManager.preloaded_modules_is_actif[row.name] = row.actif;
            }
        } catch (e) {
            console.error(e);
        }
    }

    public static async load_or_create_module_is_actif<T extends { actif: boolean; activate_on_installation: boolean; name: string }>(module: T) {

        if (!PreloadedModuleServerController.has_preloaded_modules_is_actif) {
            await PreloadedModuleServerController.preload_modules_is_actif();
        }

        let is_actif = ModulesManager.preloaded_modules_is_actif[module.name];
        if (typeof is_actif === "undefined") {
            // La ligne n'existe pas, on l'ajoute
            module.actif = module.activate_on_installation;
            await PreloadedModuleServerController.db.query('INSERT INTO admin.modules (name, actif) VALUES (\'' + module.name + '\', \'' + module.actif + '\')');
        } else {
            module.actif = is_actif;
        }
    }
}
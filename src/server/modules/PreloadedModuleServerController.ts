export default class PreloadedModuleServerController {

    public static has_preloaded_modules_is_actif: boolean = false;
    public static preloaded_modules_is_actif: { [module_name: string]: boolean } = {};

    public static db: any;

    public static async preload_modules_is_actif() {
        if (PreloadedModuleServerController.has_preloaded_modules_is_actif) {
            return;
        }
        PreloadedModuleServerController.has_preloaded_modules_is_actif = true;

        let rows = await PreloadedModuleServerController.db.query('SELECT "name", "actif" FROM admin.modules;');
        for (let i in rows) {
            let row = rows[i];

            PreloadedModuleServerController.preloaded_modules_is_actif[row.name] = row.actif;
        }
    }

    public static async load_or_create_module_is_actif<T extends { actif: boolean; activate_on_installation: boolean; name: string }>(module: T) {

        if (!PreloadedModuleServerController.has_preloaded_modules_is_actif) {
            await PreloadedModuleServerController.preload_modules_is_actif();
        }

        let is_actif = PreloadedModuleServerController.preloaded_modules_is_actif[module.name];
        if (typeof is_actif === "undefined") {
            // La ligne n'existe pas, on l'ajoute
            module.actif = module.activate_on_installation;
            await PreloadedModuleServerController.db.query('INSERT INTO admin.modules (name, actif) VALUES (\'' + module.name + '\', \'' + module.actif + '\')');
        } else {
            module.actif = is_actif;
        }
    }
}
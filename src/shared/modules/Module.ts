import ModuleTableController from './DAO/ModuleTableController';
import ModuleTableVO from './DAO/vos/ModuleTableVO';
import IModuleBase from './IModuleBase';
import ModulesManager from './ModulesManager';

export default abstract class Module implements IModuleBase {

    public static SharedModuleRoleName: string = "SharedModule";

    /**
     * Local thread cache -----
     */

    public actif: boolean = false;

    public name: string;
    public reflexiveClassName: string;
    public specificImportPath: string;

    public activate_on_installation: boolean = false;

    /**
     * ----- Local thread cache
     */

    constructor(
        name: string,
        reflexiveClassName: string,
        specificImportPath: string = null) {

        this.name = name.toLowerCase();
        this.reflexiveClassName = reflexiveClassName;
        this.specificImportPath = specificImportPath;
        ModulesManager.getInstance().registerModule(Module.SharedModuleRoleName, this);
    }

    public async hook_module_install(): Promise<void> { }
    public async hook_module_configure(): Promise<boolean> {
        return true;
    }

    public registerApis(): void { }
    public initialize(): void { }

    // Pour le chargement de données nécessaires à l'application ou la mise en place de caches de données.
    public async hook_module_async_client_admin_initialization(): Promise<void> { }
    public async hook_module_async_client_initialization(): Promise<void> { }
    public async hook_module_async_admin_initialization(): Promise<void> { }
    public async hook_module_async_login_initialization(): Promise<void> { }
    public async hook_module_async_test_initialization(): Promise<void> { }

    public getDataTableBySuffixPrefixDatabase(suffix = "", prefix = "module", database = "ref"): ModuleTableVO {
        for (const vo_type in ModuleTableController.vo_type_by_module_name[this.name]) {
            const datatable = ModuleTableController.module_tables_by_vo_type[vo_type];

            if ((datatable.database == database) && (datatable.suffix == suffix) && (datatable.prefix == prefix)) {
                return datatable;
            }
        }
        return null;
    }

    public forceActivationOnInstallation(): void {
        this.activate_on_installation = true;
    }
}
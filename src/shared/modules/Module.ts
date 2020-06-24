import ModulesManager from './ModulesManager';
import ModuleTable from './ModuleTable';
import ModuleTableField from './ModuleTableField';
import IModuleBase from './IModuleBase';
import ModuleParamChange from './ModuleParamChange';

export default abstract class Module implements IModuleBase {

    public static SharedModuleRoleName: string = "SharedModule";

    /**
     * Local thread cache -----
     */

    public actif: boolean = false;

    public fields: Array<ModuleTableField<any>> = [];
    public datatables: Array<ModuleTable<any>> = [];
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

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) { }

    public async hook_module_install(): Promise<any> { }
    public async hook_module_configure(): Promise<boolean> {
        return true;
    }

    public registerApis(): void { }
    public initialize(): void { }

    // Pour le chargement de données nécessaires à l'application ou la mise en place de caches de données.
    public async hook_module_async_client_admin_initialization(): Promise<any> { }
    public async hook_module_async_client_initialization(): Promise<any> { }
    public async hook_module_async_admin_initialization(): Promise<any> { }
    public async hook_module_async_login_initialization(): Promise<any> { }
    public async hook_module_async_test_initialization(): Promise<any> { }

    public getDataTableBySuffixPrefixDatabase(suffix = "", prefix = "module", database = "ref"): ModuleTable<any> {
        if (this.datatables) {
            for (var i = 0; i < this.datatables.length; i++) {
                var datatable = this.datatables[i];

                if ((datatable.database == database) && (datatable.suffix == suffix) && (datatable.prefix == prefix)) {
                    return datatable;
                }
            }
        }
        return null;
    }

    public add_datatable(datatable: ModuleTable<any>) {

        if (!this.datatables) {
            this.datatables = [];
        }
        this.datatables.push(datatable);
    }

    public get_nga_filters(nga) {
        return [];
    }

    public getParamValue(id: string) {
        for (let i in this.fields) {
            let field = this.fields[i];

            if (field.field_id == id) {
                return field.field_value;
            }
        }
    }

    public setParamValue(id: string, value: any) {
        for (let i in this.fields) {
            let field = this.fields[i];

            if (field.field_id == id) {
                field.field_value = value;
                return;
            }
        }
    }

    public setParamValueFromJSON(id: string, jsonValue: string) {
        for (let i in this.fields) {
            let field = this.fields[i];

            if (field.field_id == id) {
                field.field_value = JSON.parse(jsonValue);
                return;
            }
        }
    }

    protected forceActivationOnInstallation(): void {
        this.activate_on_installation = true;
    }
}
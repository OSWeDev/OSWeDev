import Module from './Module';
import ModuleDBField from './ModuleTableField';
import EnumerableProperty from '../tools/annotations/EnumerableProperty';
import VOsTypesManager from './VOsTypesManager';
import IDistantVOBase from './IDistantVOBase';
import ModuleTableField from './ModuleTableField';

export default class ModuleTable<T extends IDistantVOBase> {

    private static UID: number = 1;
    private static getNextUID(): number {
        return ModuleTable.UID++;
    }

    public name: string;
    public full_name: string;
    public uid: string;

    public admin_view_name: string;
    public admin_view_full_name: string;

    public admin_trigger_name: string;
    public admin_trigger_full_name: string;


    // S'inspirer de l'order by par défaut. la vue est 'v', les fields sont ceux définis, et les join sont définis avec la fonction suivante (ex : ORDER BY v.employee_id, v.jour_de_la_semaine DESC;)
    public nga_view_order_by: string;

    // Pour définir un JOIN (exemple : JOIN ref.store_employee e ON e.id = v.employee_id JOIN admin.current_user_store_list sl ON sl.store_id = e.store_id)
    public nga_join: string;

    public nga_view_select_addon: string;

    public hook_datatable_install: (db) => {} = null;

    @EnumerableProperty(false)
    public module: Module;
    public fields: Array<ModuleDBField<any>>;
    public suffix: string;
    public prefix: string;
    public database: string;
    public vo_type: string;
    public datatable_uid: string;

    constructor(

        tmp_module: Module,
        tmp_vo_type: string,
        public forceNumeric: (e: T) => T,
        public forceNumerics: (es: T[]) => T[],
        tmp_fields: Array<ModuleDBField<any>>,
        tmp_suffix: string = "",
        tmp_prefix: string = "module",
        tmp_database: string = "ref") {

        // Delete property.
        // if (delete this["module"]) {

        //     // Create new property with getter and setter
        //     Object.defineProperty(this, "module", {
        //         writable: true,
        //         enumerable: false,
        //         configurable: true
        //     });
        // }

        this.vo_type = tmp_vo_type;
        this.module = tmp_module;
        this.fields = tmp_fields;

        this.set_bdd_ref(tmp_database, this.module.name, tmp_suffix, tmp_prefix);

        this.nga_view_order_by = "ORDER BY v.id DESC";
        this.nga_join = "";
        this.nga_view_select_addon = "";

        if (this.vo_type) {
            VOsTypesManager.getInstance().registerModuleTable(this);
        }

        this.datatable_uid = "";//TODO FIXME : pas de nombre ici, mais est-ce bien utile surtout ce uid (qui du coup n'en est pas)ModuleTable.getNextUID().toString();
    }

    public getFieldFromId(field_id: string): ModuleTableField<any> {
        if (!field_id) {
            return null;
        }

        for (let i in this.fields) {
            let field: ModuleTableField<any> = this.fields[i];

            if (field && field.field_id == field_id) {
                return field;
            }
        }

        return null;
    }

    public set_bdd_ref(
        database_name: string,
        table_name: string,
        table_name_suffix: string = "",
        table_name_prefix: string = "") {
        if ((!database_name) || (!table_name)) {
            return;
        }

        this.suffix = table_name_suffix;
        this.prefix = table_name_prefix;
        this.database = database_name;

        this.name = (this.prefix ? this.prefix + "_" : "") + table_name + ((this.suffix != "") ? "_" + this.suffix : "");
        this.full_name = this.database + '.' + this.name;
        this.uid = this.database + '_' + this.name;

        this.admin_view_name = 'view_' + this.database + '_' + this.name;
        this.admin_view_full_name = 'admin.' + this.admin_view_name;

        this.admin_trigger_name = 'trigger_' + this.database + '_' + this.name;
        this.admin_trigger_full_name = 'admin.' + this.admin_trigger_name;
    }
}
import EnumerableProperty from '../tools/annotations/EnumerableProperty';
import IDistantVOBase from './IDistantVOBase';
import Module from './Module';
import * as moment from 'moment';
import { default as ModuleDBField, default as ModuleTableField } from './ModuleTableField';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import VOsTypesManager from './VOsTypesManager';
import ConversionHandler from '../tools/ConversionHandler';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';
import DateHandler from '../tools/DateHandler';

export default class ModuleTable<T extends IDistantVOBase> {

    private static UID: number = 1;
    private static getNextUID(): number {
        return ModuleTable.UID++;
    }

    public table_name: string;
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
    public label: DefaultTranslation = null;
    public forceNumeric: (e: T) => T = null;
    public forceNumerics: (es: T[]) => T[] = null;

    public isModuleParamTable: boolean = false;

    constructor(
        tmp_module: Module,
        tmp_vo_type: string,
        tmp_fields: Array<ModuleDBField<any>>,
        label: string | DefaultTranslation = null
    ) {

        this.forceNumeric = this.defaultforceNumeric;
        this.forceNumerics = this.defaultforceNumerics;

        this.vo_type = tmp_vo_type;
        this.module = tmp_module;

        if (this.module && this.module.name) {
            this.set_bdd_suffix_prefix_table_name(this.module.name, this.vo_type, "module");
        }

        if (!label) {
            label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: this.name });
        }
        if (typeof label === "string") {
            label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: label });
        } else {
            if ((!label.default_translations) || (!label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION] = this.name;
            }
        }
        this.label = label;

        this.fields = tmp_fields;

        if (this.module && this.module.name) {
            this.set_bdd_ref("ref", this.module.name, this.vo_type, "module");
        }

        this.nga_view_order_by = "ORDER BY v.id DESC";
        this.nga_join = "";
        this.nga_view_select_addon = "";

        if (this.vo_type) {
            VOsTypesManager.getInstance().registerModuleTable(this);
        }

        this.datatable_uid = "";//TODO FIXME : pas de nombre ici, mais est-ce bien utile surtout ce uid (qui du coup n'en est pas)ModuleTable.getNextUID().toString();
    }

    public defineAsModuleParamTable(): ModuleTable<any> {
        this.isModuleParamTable = true;
        return this;
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

    get name(): string {
        return (this.prefix ? this.prefix + "_" : "") + this.table_name + ((this.suffix != "") ? "_" + this.suffix : "");
    }

    public set_bdd_suffix_prefix_table_name(
        table_name: string,
        table_name_suffix: string = "",
        table_name_prefix: string = "") {
        this.table_name = table_name;
        this.suffix = table_name_suffix;
        this.prefix = table_name_prefix;
    }

    public set_bdd_ref(
        database_name: string,
        table_name: string,
        table_name_suffix: string = "",
        table_name_prefix: string = "") {
        if ((!database_name) || (!table_name)) {
            return;
        }

        this.set_bdd_suffix_prefix_table_name(table_name, table_name_suffix, table_name_prefix);
        this.database = database_name;

        this.full_name = this.database + '.' + this.name;
        this.uid = this.database + '_' + this.name;

        this.admin_view_name = 'view_' + this.database + '_' + this.name;
        this.admin_view_full_name = 'admin.' + this.admin_view_name;

        this.admin_trigger_name = 'trigger_' + this.database + '_' + this.name;
        this.admin_trigger_full_name = 'admin.' + this.admin_trigger_name;

        for (let i in this.fields) {
            this.fields[i].setTargetDatatable(this);
        }

        this.label.code_text = "fields.labels." + this.full_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(this.label);
    }

    private defaultforceNumeric(e: T): T {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);
        e._type = this.vo_type;

        if (!this.fields) {
            return e;
        }
        for (let i in this.fields) {
            let field = this.fields[i];

            if ((field.field_type == ModuleTableField.FIELD_TYPE_float) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_amount) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_foreign_key) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_int) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_enum) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_prct)) {
                e[field.field_id] = ConversionHandler.getInstance().forceNumber(e[field.field_id]);
            }

            if ((field.field_type == ModuleTableField.FIELD_TYPE_day) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_date)) {
                e[field.field_id] = DateHandler.getInstance().formatDayForIndex(moment(e[field.field_id]));
            }
        }

        return e;
    }

    private defaultforceNumerics(es: T[]): T[] {
        for (let i in es) {
            es[i] = this.defaultforceNumeric(es[i]);
        }
        return es;
    }
}
import { isBoolean, isNull, isNumber } from 'util';
import IDistantVOBase from './IDistantVOBase';
import ModuleTable from './ModuleTable';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import TranslatableTextVO from './Translation/vos/TranslatableTextVO';
import ModuleDAO from './DAO/ModuleDAO';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';

export default class ModuleTableField<T> {

    public static FIELD_TYPE_boolean: string = 'boolean';
    public static FIELD_TYPE_string: string = 'text';
    public static FIELD_TYPE_int: string = 'number';
    public static FIELD_TYPE_float: string = 'float';
    public static FIELD_TYPE_foreign_key: string = 'fkey';
    public static FIELD_TYPE_int_array: string = 'number[]';
    public static FIELD_TYPE_prct: string = 'pct';
    public static FIELD_TYPE_hours_and_minutes_sans_limite: string = 'HourAndMinuteWithoutLimit';
    public static FIELD_TYPE_date: string = 'date';
    public static FIELD_TYPE_hours_and_minutes: string = 'HourAndMinute';
    public static FIELD_TYPE_daterange: string = 'daterange';
    public static FIELD_TYPE_tsrange: string = 'tsrange';
    public static FIELD_TYPE_timestamp: string = 'timestamp';
    public static FIELD_TYPE_day: string = 'day';

    public field_value: T;
    public field_loaded: boolean;

    public has_relation: boolean;
    public datatable_uid: string = null;
    public target_database: string = null;
    public target_table: string = null;
    public target_field: string = null;
    public module_table: ModuleTable<any> = null;
    public field_label: DefaultTranslation;
    public manyToOne_target_moduletable: ModuleTable<any> = null;
    public default_target_label_field_id: string = null;

    constructor(
        public field_id: string,
        public field_type: string,
        field_label: string | DefaultTranslation,
        public field_required: boolean = false,
        public has_default: boolean = false,
        public field_default: T = null) {
        this.field_value = this.field_default;
        this.field_loaded = false;

        if (!field_label) {
            field_label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: this.field_id });
        }

        if (typeof field_label === "string") {
            field_label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: field_label });
        } else {
            if ((!field_label.default_translations) || (!field_label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                field_label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION] = this.field_id;
            }
        }

        this.field_label = field_label;
        this.has_relation = false;
        this.datatable_uid = null;
        this.target_database = null;
        this.target_table = null;
        this.target_field = null;
    }

    public setTargetDatatable(module_table: ModuleTable<any>) {
        this.module_table = module_table;

        this.setLabelCodeText();
    }

    public setLabelCodeText(module_name: string = null) {
        if (this.module_table) {
            this.field_label.code_text = "fields.labels." + this.module_table.full_name + "." + this.field_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        } else {
            if (!module_name) {
                return;
            }
            this.field_label.code_text = "fields.labels." + module_name + "." + this.field_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        DefaultTranslationManager.getInstance().registerDefaultTranslation(this.field_label);
    }

    public getPGSqlFieldDescription() {

        let default_value: string = this.field_default as any;

        if (!(isNull(this.field_default) || isNumber(this.field_default) || isBoolean(this.field_default))) {
            default_value = "'" + default_value + "'";
        }
        return this.field_id + ' ' + this.getPGSqlFieldType() + (this.field_required ? ' NOT NULL' : '') + (this.has_default ? ' DEFAULT ' + default_value : '');
    }

    public getPGSqlFieldConstraint() {
        if (!this.has_relation) {
            return null;
        }
        return 'CONSTRAINT ' + this.datatable_uid + '_' + this.field_id + '_fkey FOREIGN KEY (' + this.field_id + ') ' +
            'REFERENCES ' + this.target_database + '.' + this.target_table + ' (' + this.target_field + ') MATCH SIMPLE ' +
            'ON UPDATE NO ACTION ON DELETE CASCADE';
    }

    public addManyToOneRelation<T extends IDistantVOBase, U extends IDistantVOBase>(datatable: ModuleTable<T>, target_database: ModuleTable<U>, default_target_label_field_id: string) {
        this.datatable_uid = datatable.datatable_uid;
        this.manyToOne_target_moduletable = target_database;
        this.target_database = target_database.database;
        this.target_table = target_database.name;
        this.default_target_label_field_id = default_target_label_field_id;
        this.target_field = 'id';
        this.has_relation = true;
    }

    private getPGSqlFieldType() {
        if (this.field_type == ModuleTableField.FIELD_TYPE_int) {
            return "int8";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_foreign_key) {
            return "bigint";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_int_array) {
            return "bigint[]";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_float) {
            return "float8";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_boolean) {
            return "bool";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_date) {
            return "date";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_day) {
            return "date";
        }
        if (this.field_type == ModuleTableField.FIELD_TYPE_timestamp) {
            return "timestamp";
        }
        // Cas spécifique du type heure et minute.
        if (this.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes || this.field_type == 'ref.hours') {
            return "ref.hours";
        }

        if (this.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite) {
            return "float8";
        }

        if (this.field_type == ModuleTableField.FIELD_TYPE_daterange) {
            return "daterange";
        }

        if (this.field_type == ModuleTableField.FIELD_TYPE_tsrange) {
            return "tsrange";
        }

        if (this.field_type == 'timewithouttimezone') {
            return "time without time zone";
        }

        if (this.field_type == 'amount') {
            return "ref.amount";
        }

        if (this.field_type == 'pct') {
            return "ref.pct";
        }

        if (this.field_type == 'real') {
            return "real";
        }

        return "text";
    }
}
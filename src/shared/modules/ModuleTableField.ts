import ModuleTable from './ModuleTable';
import { isNumber, isNull, isBoolean } from 'util';
import IDistantVOBase from './IDistantVOBase';

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

    public field_value: T;
    public field_loaded: boolean;

    public has_relation: boolean;
    public datatable_uid: string = null;
    public target_database: string = null;
    public target_table: string = null;
    public target_field: string = null;

    constructor(
        public field_id: string,
        public field_type: string,
        public field_label: string,
        public field_required: boolean = false,
        public has_default: boolean = false,
        public field_default: T = null) {
        this.field_value = this.field_default;
        this.field_loaded = false;

        this.has_relation = false;
        this.datatable_uid = null;
        this.target_database = null;
        this.target_table = null;
        this.target_field = null;
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

    public addManyToOneRelation<T extends IDistantVOBase, U extends IDistantVOBase>(datatable: ModuleTable<T>, target_database: ModuleTable<U>) {
        this.datatable_uid = datatable.datatable_uid;
        this.target_database = target_database.database;
        this.target_table = target_database.name;
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
        if (this.field_type == 'timestamp') {
            return "timestamp";
        }
        // Cas spécifique du type heure et minute.
        if (this.field_type == 'HourAndMinute' || this.field_type == 'ref.hours') {
            return "ref.hours";
        }

        if (this.field_type == 'HourAndMinuteWithoutLimit') {
            return "float8";
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
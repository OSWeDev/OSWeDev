import { isBoolean, isNull, isNumber } from 'util';
import IDistantVOBase from './IDistantVOBase';
import ModuleTable from './ModuleTable';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';
import DefaultTranslation from './Translation/vos/DefaultTranslation';

export default class ModuleTableField<T> {

    public static VALIDATION_CODE_TEXT_BASE: string = "validation.ko.";
    public static VALIDATION_CODE_TEXT_required: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "required";
    public static VALIDATION_CODE_TEXT_length_min_8: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "length_min_8";
    public static VALIDATION_CODE_TEXT_need_number: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_number";
    public static VALIDATION_CODE_TEXT_need_lowercase: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_lowercase";
    public static VALIDATION_CODE_TEXT_need_uppercase: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_uppercase";
    public static VALIDATION_CODE_TEXT_need_h: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_h";

    public static FIELD_TYPE_boolean: string = 'boolean';
    public static FIELD_TYPE_password: string = 'password';
    public static FIELD_TYPE_string: string = 'text';
    public static FIELD_TYPE_enum: string = 'enum';
    public static FIELD_TYPE_int: string = 'number';
    public static FIELD_TYPE_geopoint: string = 'point';
    public static FIELD_TYPE_float: string = 'float';
    public static FIELD_TYPE_amount: string = 'amount';
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

    public enum_values: { [value: number]: string } = {};

    /**
     * Renvoie null ou "" si ok, sinon le code_text traduisible de l'erreur
     */
    public validate: (data: any) => string;

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

        this.validate = this.defaultValidator;
        this.field_label = field_label;
        this.has_relation = false;
        this.datatable_uid = null;
        this.target_database = null;
        this.target_table = null;
        this.target_field = null;
    }

    /**
     * @param validator Renvoie null ou "" si ok, sinon le code_text traduisible de l'erreur
     */
    public setValidator(validator: (data: any) => string): ModuleTableField<T> {
        this.validate = validator;

        return this;
    }

    public getValidationTextCodeBase(): string {
        return "validation.ko." + this.module_table.full_name + "." + this.field_id + ".";
    }

    /**
     * @param enum_values An obj which for each key has as a value the code_text used for translation
     */
    public setEnumValues(enum_values: { [value: number]: string }): ModuleTableField<T> {
        this.field_type = ModuleTableField.FIELD_TYPE_enum;
        this.enum_values = enum_values;

        return this;
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
        switch (this.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
                return "int8";

            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_float:
                return "float8";

            case ModuleTableField.FIELD_TYPE_foreign_key:
                return "bigint";


            case ModuleTableField.FIELD_TYPE_int_array:
                return "bigint[]";

            case ModuleTableField.FIELD_TYPE_boolean:
                return "bool";

            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_date:
                return "date";

            case ModuleTableField.FIELD_TYPE_geopoint:
                return "point";

            case ModuleTableField.FIELD_TYPE_timestamp:
                return "timestamp";

            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case "ref.hours":
                return "ref.hours";

            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                return "float8";

            case ModuleTableField.FIELD_TYPE_daterange:
                return "daterange";

            case ModuleTableField.FIELD_TYPE_tsrange:
                return "tsrange";

            case 'timewithouttimezone':
                return "time without time zone";

            case ModuleTableField.FIELD_TYPE_prct:
                return "ref.pct";

            case 'real':
                return "real";

            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_password:
            default:
                return 'text';
        }
    }


    private defaultValidator(data: any): string {
        switch (this.field_type) {
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                if (data == null || data == "") {
                    return null;
                }
                if (data.toLowerCase().indexOf("h") < 0) {
                    return ModuleTableField.VALIDATION_CODE_TEXT_need_h;
                }
                return null;

            case ModuleTableField.FIELD_TYPE_password:
                return this.passwordIsValidProposition(data);

            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_tsrange:
            default:
                return null;
        }
    }

    private passwordIsValidProposition(pwd_proposition: string): string {
        if (!pwd_proposition) {
            return ModuleTableField.VALIDATION_CODE_TEXT_required;
        }

        if (pwd_proposition.length < 8) {
            return ModuleTableField.VALIDATION_CODE_TEXT_length_min_8;
        }

        // Doit contenir un chiffre
        if (!/[0-9]/.test(pwd_proposition)) {
            return ModuleTableField.VALIDATION_CODE_TEXT_need_number;
        }

        // Doit contenir une minuscule
        if (!/[a-z]/.test(pwd_proposition)) {
            return ModuleTableField.VALIDATION_CODE_TEXT_need_lowercase;
        }

        // Doit contenir une majuscule
        if (!/[A-Z]/.test(pwd_proposition)) {
            return ModuleTableField.VALIDATION_CODE_TEXT_need_uppercase;
        }

        return null;
    }
}
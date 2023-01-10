import ConsoleHandler from '../tools/ConsoleHandler';
import TypesHandler from '../tools/TypesHandler';
import Alert from './Alert/vos/Alert';
import DatatableField from './DAO/vos/datatable/DatatableField';
import IDistantVOBase from './IDistantVOBase';
import ModuleTable from './ModuleTable';
import TableFieldTypesManager from './TableFieldTypes/TableFieldTypesManager';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';
import DefaultTranslation from './Translation/vos/DefaultTranslation';

export default class ModuleTableField<T> {

    public static VALIDATION_CODE_TEXT_BASE: string = "validation.ko.";
    public static VALIDATION_CODE_TEXT_required: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "required";
    public static VALIDATION_CODE_TEXT_length_min_8: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "length_min_8";
    public static VALIDATION_CODE_TEXT_need_number: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_number";
    public static VALIDATION_CODE_TEXT_need_lowercase: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_lowercase";
    public static VALIDATION_CODE_TEXT_need_uppercase: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_uppercase";
    public static VALIDATION_CODE_TEXT_need_h: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "need_h" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static VALIDATION_CODE_TEXT_format_unix_timestamp_invalid: string = ModuleTableField.VALIDATION_CODE_TEXT_BASE + "format_unix_timestamp_invalid";


    public static FIELD_TYPE_file_ref: string = 'file_ref';
    public static FIELD_TYPE_image_field: string = 'image';
    public static FIELD_TYPE_image_ref: string = 'image_ref';
    public static FIELD_TYPE_html: string = 'html';
    public static FIELD_TYPE_html_array: string = 'html_array';
    public static FIELD_TYPE_boolean: string = 'boolean';
    public static FIELD_TYPE_password: string = 'password';
    public static FIELD_TYPE_email: string = 'email';
    public static FIELD_TYPE_string: string = 'text';
    public static FIELD_TYPE_plain_vo_obj: string = 'plain_vo_obj';
    public static FIELD_TYPE_textarea: string = 'textarea';
    public static FIELD_TYPE_enum: string = 'enum';
    public static FIELD_TYPE_int: string = 'number';
    public static FIELD_TYPE_geopoint: string = 'point';
    public static FIELD_TYPE_float: string = 'float';
    public static FIELD_TYPE_decimal_full_precision: string = 'decimal_full_precision';
    public static FIELD_TYPE_amount: string = 'amount';
    public static FIELD_TYPE_foreign_key: string = 'fkey';
    public static FIELD_TYPE_numrange: string = 'numrange';
    public static FIELD_TYPE_numrange_array: string = 'numrange[]';
    public static FIELD_TYPE_refrange_array: string = 'refrange[]';
    public static FIELD_TYPE_file_field: string = 'file';
    public static FIELD_TYPE_isoweekdays: string = 'isoweekdays';
    public static FIELD_TYPE_int_array: string = 'number[]';
    public static FIELD_TYPE_float_array: string = 'float[]';
    public static FIELD_TYPE_string_array: string = 'text[]';
    public static FIELD_TYPE_prct: string = 'pct';
    public static FIELD_TYPE_hours_and_minutes_sans_limite: string = 'HourAndMinuteWithoutLimit';
    public static FIELD_TYPE_date: string = 'date';
    public static FIELD_TYPE_hours_and_minutes: string = 'HourAndMinute';
    public static FIELD_TYPE_daterange: string = 'daterange';
    // public static FIELD_TYPE_daterange_array: string = 'daterange[]';
    public static FIELD_TYPE_tstz: string = 'tstz';
    public static FIELD_TYPE_tstz_array: string = 'tstz[]';
    public static FIELD_TYPE_tstzrange_array: string = 'tstzrange[]'; // TimeStamp With TimeZone range array
    public static FIELD_TYPE_tsrange: string = 'tsrange';
    public static FIELD_TYPE_hour: string = 'hour';
    public static FIELD_TYPE_hourrange: string = 'hourrange';
    public static FIELD_TYPE_hourrange_array: string = 'hourrange[]';
    public static FIELD_TYPE_day: string = 'day';
    public static FIELD_TYPE_timewithouttimezone: string = 'timewithouttimezone';
    // public static FIELD_TYPE_unix_timestamp: string = 'unix_timestamp'; remplacé par le tstz
    public static FIELD_TYPE_month: string = 'month';
    public static FIELD_TYPE_translatable_text: string = 'translatable_text';

    /**
     * Local thread cache -----
     */
    public field_value: T;
    public field_loaded: boolean;

    public custom_translate_to_xlsx: (value: any) => any = null;

    public custom_translate_to_api: (value: any) => any = null;
    public custom_translate_from_api: (value: any) => any = null;

    public has_relation: boolean;
    public target_database: string = null;
    public target_table: string = null;
    public target_field: string = null;
    public module_table: ModuleTable<any> = null;
    public field_label: DefaultTranslation;
    public manyToOne_target_moduletable: ModuleTable<any> = null;

    public cascade_on_delete: boolean = true;

    public min_values: number = 0;
    public max_values: number = 999;

    public is_indexed: boolean = false;
    public is_readonly: boolean = false;

    public format_localized_time: boolean = false;

    /**
     * Sur date : identifie si la date est utilisée dans le code comme inclusive ou exclusive (le jour ciblé est inclus ou non)
     * Sur daterange : idem si date fin du range
     */
    public is_inclusive_data: boolean = false;
    /**
     * Sur date : identifie si la date est utilisée dans l'ihm comme inclusive ou exclusive (le jour ciblé est inclus ou non)
     * Sur daterange : idem si date fin du range
     */
    public is_inclusive_ihm: boolean = false;

    public is_visible_datatable: boolean = true;

    public enum_values: { [value: number]: string } = {};
    public enum_image_values: { [value: number]: string } = {};

    public hidden_print: boolean = false;

    /**
     * Permet de faire des fields array sur n'importe quel autre type (en théorie :) )
     */
    public is_array: boolean = false;

    /**
     * Utilisé par les matroids pour définir la segmentation de chaque champs directement au niveau de la structure de données
     */
    public segmentation_type: number = null;

    public boolean_icon_true: string = "fa-check-circle";
    public boolean_icon_false: string = "fa-times-circle";
    public boolean_invert_colors: boolean = false;

    /**
     * Renvoie null ou "" si ok, sinon le code_text traduisible de l'erreur
     */
    public validate: (data: any) => string;

    /**
     * Nouvelle version de validation plus complète, qui doit remplacer l'ancienne version à terme
     */
    public validate_input: (input_value: any, field: DatatableField<any, any>, vo: any) => Alert[];

    public return_min_value: boolean = true;
    public return_max_value: boolean = true;

    /**
     * ----- Local thread cache
     */

    /**
     * On passe en private pour être sûr de bien mettre la table à jour au besoin avec l'info de l'index d'unicité
     */
    private is_unique_: boolean = false;

    constructor(
        public field_id: string,                    //titre de la colonne en base
        public field_type: string,                  //type de donnée dans la colonne
        field_label: string | DefaultTranslation,   //titre de la colonne a afficher
        public field_required: boolean = false,     //si champ obligatoire
        public has_default: boolean = false,        //si valeur par defaut
        public field_default: T = null              //valeur par defaut
    ) {

        this.field_value = this.field_default;
        this.field_loaded = false;
        this.cascade_on_delete = field_required;

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

        this.validate = this.defaultValidator.bind(this);   //permet de valider si le champ est conforme
        this.field_label = field_label;                     //titre colonne a afficher
        this.has_relation = false;                          //si relation avec dautres tables
        this.target_database = null;                        //la database en base avec laquelle il y a une relation (generalement "ref")
        this.target_table = null;                           //la table de la database en base avec laquelle il y a une relation
        this.target_field = null;                           //le champ de la table en base avec laquelle il y a une relation
    }

    get is_unique(): boolean {
        return this.is_unique_;
    }

    public set is_unique(is_unique_: boolean) {
        this.is_unique_ = is_unique_;
        if (!this.module_table) {
            return;
        }

        if (!is_unique_) {
            return;
        }

        let found = false;
        for (let i in this.module_table.uniq_indexes) {
            let index = this.module_table.uniq_indexes[i];

            if (index && (index.length == 1) && (index[0].field_id == this.field_id)) {
                found = true;
                break;
            }
        }

        if (!found) {
            this.module_table.uniq_indexes.push([this]);
        }
    }

    public setValidatInputFunc(validate_input: (input_value: any, field: DatatableField<any, any>, vo: any) => Alert[]): ModuleTableField<T> {
        this.validate_input = validate_input;
        return this;
    }

    public set_format_localized_time(format_localized_time: boolean): ModuleTableField<T> {
        this.format_localized_time = format_localized_time;
        return this;
    }

    public set_segmentation_type(segmentation_type: number): ModuleTableField<T> {
        this.segmentation_type = segmentation_type;
        return this;
    }

    /**
     * Permet de définir les icones à utiliser pour les booleans
     * @param boolean_icon_true FontAwesome icon name pour true
     * @param boolean_icon_false FontAwesome icon name pour false
     * @returns
     */
    public set_boolean_default_icons(boolean_icon_true: string, boolean_icon_false: string): ModuleTableField<T> {
        this.boolean_icon_true = boolean_icon_true;
        this.boolean_icon_false = boolean_icon_false;
        return this;
    }

    /**
     * Permet de définir si les couleurs doivent être inversées pour les booleans
     * @returns
     */
    public set_boolean_invert_colors(): ModuleTableField<T> {
        this.boolean_invert_colors = true;
        return this;
    }

    public set_return_max_value(return_max_value: boolean): ModuleTableField<T> {
        this.return_max_value = return_max_value;
        return this;
    }

    public set_return_min_value(return_min_value: boolean): ModuleTableField<T> {
        this.return_min_value = return_min_value;
        return this;
    }

    public readonly(): ModuleTableField<T> {
        this.is_readonly = true;
        return this;
    }

    public unique(): ModuleTableField<T> {
        this.is_unique = true;
        return this;
    }

    public index(): ModuleTableField<T> {
        this.is_indexed = true;
        return this;
    }

    public do_not_index(): ModuleTableField<T> {
        this.is_indexed = false;
        return this;
    }

    public hide_print(): ModuleTableField<T> {
        this.hidden_print = true;

        return this;
    }

    public set_max_values(max_values: number): ModuleTableField<T> {

        this.max_values = max_values;
        return this;
    }

    public set_min_values(min_values: number): ModuleTableField<T> {

        this.min_values = min_values;
        return this;
    }

    public hide_from_datatable(): ModuleTableField<T> {
        this.is_visible_datatable = false;

        return this;
    }

    public set_custom_translate_to_xlsx(custom_translate_to_xlsx: (value: any) => any): ModuleTableField<T> {
        this.custom_translate_to_xlsx = custom_translate_to_xlsx;

        return this;
    }

    public set_custom_translate_to_api(custom_translate_to_api: (value: any) => any): ModuleTableField<T> {
        this.custom_translate_to_api = custom_translate_to_api;

        return this;
    }

    public set_custom_translate_from_api(custom_translate_from_api: (value: any) => any): ModuleTableField<T> {
        this.custom_translate_from_api = custom_translate_from_api;

        return this;
    }

    public setModuleTable(moduleTable: ModuleTable<any>): ModuleTableField<T> {
        this.module_table = moduleTable;

        this.setLabelCodeText();

        return this;
    }

    public setIsArray(): ModuleTableField<T> {
        this.is_array = true;

        return this;
    }

    public setInclusiveData(): ModuleTableField<T> {
        this.is_inclusive_data = true;

        return this;
    }

    public donotCascadeOnDelete(): ModuleTableField<T> {
        this.cascade_on_delete = false;

        return this;
    }

    public forceCascadeOnDelete(): ModuleTableField<T> {
        this.cascade_on_delete = true;

        return this;
    }

    public setInclusiveIHM(): ModuleTableField<T> {
        this.is_inclusive_ihm = true;

        return this;
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

    /**
     * @param enum_image_values An obj which for each key has as a value the code_text used for translation
     */
    public setEnumImageValues(enum_image_values: { [value: number]: string }): ModuleTableField<T> {
        this.field_type = ModuleTableField.FIELD_TYPE_enum;
        this.enum_image_values = enum_image_values;

        return this;
    }

    public setTargetDatatable(module_table: ModuleTable<any>): ModuleTableField<T> {
        this.module_table = module_table;

        this.setLabelCodeText();

        return this;
    }

    public setLabelCodeText(module_name: string = null): ModuleTableField<T> {
        if (this.module_table) {
            this.field_label.code_text = "fields.labels." + this.module_table.full_name + "." + this.field_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        } else {
            if (!module_name) {
                return this;
            }
            this.field_label.code_text = "fields.labels." + module_name + "." + this.field_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        DefaultTranslationManager.registerDefaultTranslation(this.field_label);

        return this;
    }

    public getPGSqlFieldDescription() {

        let default_value: string = this.field_default as any;

        try {
            if (!((typeof default_value === 'undefined') || TypesHandler.getInstance().isArray(default_value) ||
                TypesHandler.getInstance().isNull(default_value) || TypesHandler.getInstance().isNumber(default_value) || TypesHandler.getInstance().isBoolean(default_value))) {
                default_value = "'" + default_value.replace(/'/ig, "''") + "'";
            }
            return this.field_id + ' ' + this.getPGSqlFieldType() + (this.field_required ? ' NOT NULL' : '') + (this.has_default ? ' DEFAULT ' + default_value : '') + (this.is_unique ? ' UNIQUE' : '');
        } catch (error) {
            ConsoleHandler.error('Valeur par défaut incompatible avec la BDD pour le champs:' + this.field_id + ':' + error);
        }
        return this.field_id + ' ' + this.getPGSqlFieldType() + (this.field_required ? ' NOT NULL' : '') + (this.is_unique ? ' UNIQUE' : '');
    }

    public getPGSqlFieldIndex(database_name: string, table_name: string) {

        if (!this.is_indexed) {
            return null;
        }

        return "CREATE INDEX " + this.get_index_name(table_name) + " ON " + database_name + "." + table_name + "(" + this.field_id + " ASC NULLS LAST);";
    }

    public get_index_name(table_name: string): string {
        let res = table_name + this.field_id + "_idx";
        if (table_name.startsWith('module_')) {
            res = table_name.substring(7, table_name.length) + this.field_id + "_idx";
        }
        return res.toLowerCase();
    }

    public getPGSqlFieldConstraint() {
        if (!this.has_single_relation) {
            return null;
        }
        if (this.field_type != ModuleTableField.FIELD_TYPE_foreign_key) {
            return null;
        }

        if (!this.manyToOne_target_moduletable || !this.manyToOne_target_moduletable.full_name || !this.target_field) {
            return null;
        }

        // Si obligatoire on doit cascade
        if (this.cascade_on_delete || this.field_required) {
            return 'CONSTRAINT ' + this.field_id + '_fkey FOREIGN KEY (' + this.field_id + ') ' +
                'REFERENCES ' + this.manyToOne_target_moduletable.full_name + ' (' + this.target_field + ') MATCH SIMPLE ' +
                'ON UPDATE NO ACTION ON DELETE CASCADE';
        } else {
            return 'CONSTRAINT ' + this.field_id + '_fkey FOREIGN KEY (' + this.field_id + ') ' +
                'REFERENCES ' + this.manyToOne_target_moduletable.full_name + ' (' + this.target_field + ') MATCH SIMPLE ' +
                'ON UPDATE NO ACTION ON DELETE SET DEFAULT';
        }
    }

    public addManyToOneRelation<U extends IDistantVOBase>(target_database: ModuleTable<U>): ModuleTableField<T> {
        this.manyToOne_target_moduletable = target_database;
        this.target_database = target_database.database;
        this.target_table = target_database.name;
        this.target_field = 'id';
        this.has_relation = true;

        this.index();

        return this;
    }

    get has_single_relation() {
        if ((this.field_type != ModuleTableField.FIELD_TYPE_file_ref) &&
            (this.field_type != ModuleTableField.FIELD_TYPE_foreign_key) &&
            (this.field_type != ModuleTableField.FIELD_TYPE_image_ref) &&
            (this.field_type != ModuleTableField.FIELD_TYPE_int)) {
            return false;
        }

        return true;
    }

    public isAcceptableCurrentDBType(db_type: string): boolean {
        switch (this.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_foreign_key:
                return (db_type == "int8") || (db_type == "bigint") || (db_type == "integer");

            case ModuleTableField.FIELD_TYPE_tstz:
                return (db_type == "int8") || (db_type == "bigint");

            case ModuleTableField.FIELD_TYPE_tstz_array:
                return (db_type == "bigint[]") || (db_type == "ARRAY");

            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                return (db_type == "float8") || (db_type == "double precision") || (db_type == "numeric");

            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                return (db_type == "numeric");

            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_html_array:
                return (db_type == "text[]") || (db_type == "ARRAY");

            case ModuleTableField.FIELD_TYPE_float_array:
                return (db_type == "float8[]") || (db_type == "ARRAY") || (db_type == "numeric[]");

            case ModuleTableField.FIELD_TYPE_int_array:
                return (db_type == "bigint[]") || (db_type == "ARRAY");

            case ModuleTableField.FIELD_TYPE_boolean:
                return db_type == "boolean";

            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_date:
                return db_type == "date";

            case ModuleTableField.FIELD_TYPE_geopoint:
                return db_type == "point";

            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case "ref.hours":
                return (db_type == "ref.hours") || (db_type == "numeric");

            case ModuleTableField.FIELD_TYPE_daterange:
                return db_type == "daterange";

            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                return (db_type == "numrange[]") || (db_type == "ARRAY");
            // case ModuleTableField.FIELD_TYPE_daterange_array:
            //     return db_type == "daterange[]";
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                return (db_type == "numrange[]") || (db_type == "ARRAY");

            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_numrange:
                return db_type == "numrange";

            case ModuleTableField.FIELD_TYPE_hour:
                return (db_type == "int8") || (db_type == "bigint");

            case ModuleTableField.FIELD_TYPE_hourrange:
                return db_type == "int8range";

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return (db_type == "int8range[]") || (db_type == "ARRAY");

            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                return db_type == "time without time zone";

            case ModuleTableField.FIELD_TYPE_prct:
                return (db_type == "ref.pct") || (db_type == "float8") || (db_type == "double precision") || (db_type == "numeric");

            case 'real':
                return db_type == "real";

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_image_field:
                return db_type == 'text';

            default:
                for (let i in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[i];

                    if (this.field_type == tableFieldTypeController.name) {
                        return tableFieldTypeController.isAcceptableCurrentDBType(db_type);
                    }
                }
        }
    }

    public getPGSqlFieldType() {
        switch (this.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_hour:
                return "int8";

            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_float:
                return "float8";

            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                return "numeric";

            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_tstz:
                return "bigint";

            case ModuleTableField.FIELD_TYPE_tstz_array:
                return "bigint[]";

            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_html_array:
                return "text[]";

            case ModuleTableField.FIELD_TYPE_float_array:
                return "numeric[]";

            case ModuleTableField.FIELD_TYPE_int_array:
                return "bigint[]";

            case ModuleTableField.FIELD_TYPE_boolean:
                return "boolean";

            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_date:
                return "date";

            case ModuleTableField.FIELD_TYPE_geopoint:
                return "point";

            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case "ref.hours":
                return "ref.hours";

            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                return "float8";

            case ModuleTableField.FIELD_TYPE_daterange:
                return "daterange";

            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                return "numrange[]";
            // case ModuleTableField.FIELD_TYPE_daterange_array:
            //     return "daterange[]";
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                return "numrange[]";

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
                return "numrange";

            case ModuleTableField.FIELD_TYPE_hourrange:
                return "int8range";

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return "int8range[]";

            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                return "time without time zone";

            case ModuleTableField.FIELD_TYPE_prct:
                return "float8";

            case 'real':
                return "real";

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_image_field:
                return 'text';

            default:
                for (let i in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[i];

                    if (this.field_type == tableFieldTypeController.name) {
                        return tableFieldTypeController.getPGSqlFieldType();
                    }
                }
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

            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_html_array:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            // case ModuleTableField.FIELD_TYPE_daterange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                return null;

            default:
                for (let i in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[i];

                    if (this.field_type == tableFieldTypeController.name) {
                        return tableFieldTypeController.defaultValidator(data, this);
                    }
                }
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
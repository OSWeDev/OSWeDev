import ConsoleHandler from "../../../tools/ConsoleHandler";
import TypesHandler from "../../../tools/TypesHandler";
import Alert from "../../Alert/vos/Alert";
import IDistantVOBase from "../../IDistantVOBase";
import ModuleTable from "../../ModuleTable";
import TableFieldTypesManager from "../../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslationManager from "../../Translation/DefaultTranslationManager";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DatatableField from "./datatable/DatatableField";


export default class ModuleTableFieldVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "module_table_field";

    public static VALIDATION_CODE_TEXT_BASE: string = "validation.ko.";
    public static VALIDATION_CODE_TEXT_required: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "required";
    public static VALIDATION_CODE_TEXT_length_min_8: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "length_min_8";
    public static VALIDATION_CODE_TEXT_need_number: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "need_number";
    public static VALIDATION_CODE_TEXT_need_lowercase: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "need_lowercase";
    public static VALIDATION_CODE_TEXT_need_uppercase: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "need_uppercase";
    public static VALIDATION_CODE_TEXT_need_h: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "need_h" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static VALIDATION_CODE_TEXT_format_unix_timestamp_invalid: string = ModuleTableFieldVO.VALIDATION_CODE_TEXT_BASE + "format_unix_timestamp_invalid";


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
    public static FIELD_TYPE_tstz: string = 'tstz';  // TimeStamp With TimeZone
    public static FIELD_TYPE_tstz_array: string = 'tstz[]';
    public static FIELD_TYPE_tstzrange_array: string = 'tstzrange[]'; // TimeStamp With TimeZone range array
    public static FIELD_TYPE_tsrange: string = 'tsrange';
    public static FIELD_TYPE_hour: string = 'hour';
    public static FIELD_TYPE_hourrange: string = 'hourrange';
    public static FIELD_TYPE_hourrange_array: string = 'hourrange[]';
    public static FIELD_TYPE_day: string = 'day';
    public static FIELD_TYPE_timewithouttimezone: string = 'timewithouttimezone';
    public static FIELD_TYPE_month: string = 'month';
    public static FIELD_TYPE_translatable_text: string = 'translatable_text';

    public id: number;
    public _type: string = ModuleTableFieldVO.API_TYPE_ID;

    /**
     * Ce paramètre garanti que si ce champ est de type boolean, il ne peut être transmis/passé en true que côté serveur
     * Si le client envoie via une API par exemple ce boolean à true, il sera automatiquement passé à false et loggé
     */
    public secure_boolean_switch_only_server_side: boolean; // false by default

    /**
     * Lien vers la table liée pour les relations N/1
     */
    public manyToOne_target_moduletable_id: number;

    public module_table_id: number;
    // public field_label: DefaultTranslation; TODO à gérer dans le constructeur (en controller) pas ici

    public cascade_on_delete: boolean; // true by default
    public do_not_add_to_crud: boolean; // false by default

    public min_values: number; // 0 by default
    public max_values: number; // 999 by default

    public is_indexed: boolean; // false by default
    public is_readonly: boolean; // false by default
    public replace_if_unique: boolean; // false by default

    public format_localized_time: boolean; // false by default

    /**
     * Dans le cas d'un translatable text, on indique le nom du champs du même objet qui contient des params pour la trad
     */
    public translatable_params_field_name: string; // null by default

    /**
     * Sur date : identifie si la date est utilisée dans le code comme inclusive ou exclusive (le jour ciblé est inclus ou non)
     * Sur daterange : idem si date fin du range
     */
    public is_inclusive_data: boolean; // false by default
    /**
     * Sur date : identifie si la date est utilisée dans l'ihm comme inclusive ou exclusive (le jour ciblé est inclus ou non)
     * Sur daterange : idem si date fin du range
     */
    public is_inclusive_ihm: boolean; // false by default

    public is_visible_datatable: boolean; // true by default

    public enum_values: { [value: number]: string }; // null by default
    public enum_image_values: { [value: number]: string }; // null by default
    public enum_color_values: { [value: number]: string }; // null by default

    public hidden_print: boolean; // false by default

    /**
     * Permet de faire des fields array sur n'importe quel autre type (en théorie :) )
     */
    public is_array: boolean; // false by default

    /**
     * Utilisé par les matroids pour définir la segmentation de chaque champs directement au niveau de la structure de données
     */
    public segmentation_type: number; // null by default

    public boolean_icon_true: string; // "fa-check-circle" by default
    public boolean_icon_false: string; // "fa-times-circle" by default
    public boolean_invert_colors: boolean; // false by default

    // /**
    //  * FIXME: à supprimer quand ok
    //  * POUR INFO : cette méthode semble inutilisée, et donc on ne change jamais l'invalidateur par défaut, .defaultValidator,
    //  *  donc on supprime le champs (qui ne serait pas transposable en BDD dans tous les cas en l'état) et on met le defaultValidator en méthode statique
    //  * Renvoie null ou "" si ok, sinon le code_text traduisible de l'erreur
    //  */
    // public validate: (data: any) => string;

    /**
     * Nouvelle version de validation plus complète, qui doit remplacer l'ancienne version à terme
     */
    public validate_input: (input_value: any, field: DatatableField<any, any>, vo: any) => Alert[];

    public return_min_value: boolean; // true by default
    public return_max_value: boolean;    // true by default
    public max_range_offset: number;    // 0 by default

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

        this.field_label = field_label;                     //titre colonne a afficher

        this.target_database = null;                        //la database en base avec laquelle il y a une relation (generalement "ref")
    }

    public flag_as_secure_boolean_switch_only_server_side(): ModuleTableFieldVO {
        this.secure_boolean_switch_only_server_side = true;
        return this;
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

    public set_translatable_params_field_name(translatable_params_field_name: string): ModuleTableFieldVO {
        this.translatable_params_field_name = translatable_params_field_name;
        return this;
    }

    public setValidatInputFunc(validate_input: (input_value: any, field: DatatableField<any, any>, vo: any) => Alert[]): ModuleTableFieldVO {
        this.validate_input = validate_input;
        return this;
    }

    public set_format_localized_time(format_localized_time: boolean): ModuleTableFieldVO {
        this.format_localized_time = format_localized_time;
        return this;
    }

    public set_segmentation_type(segmentation_type: number): ModuleTableFieldVO {
        this.segmentation_type = segmentation_type;
        return this;
    }

    /**
     * Permet de définir les icones à utiliser pour les booleans
     * @param boolean_icon_true FontAwesome icon name pour true
     * @param boolean_icon_false FontAwesome icon name pour false
     * @returns
     */
    public set_boolean_default_icons(boolean_icon_true: string, boolean_icon_false: string): ModuleTableFieldVO {
        this.boolean_icon_true = boolean_icon_true;
        this.boolean_icon_false = boolean_icon_false;
        return this;
    }

    /**
     * Permet de définir si les couleurs doivent être inversées pour les booleans
     * @returns
     */
    public set_boolean_invert_colors(): ModuleTableFieldVO {
        this.boolean_invert_colors = true;
        return this;
    }

    public set_return_max_value(return_max_value: boolean): ModuleTableFieldVO {
        this.return_max_value = return_max_value;
        return this;
    }

    public set_max_range_offset(max_range_offset: number): ModuleTableFieldVO {
        this.max_range_offset = max_range_offset;
        return this;
    }

    public set_return_min_value(return_min_value: boolean): ModuleTableFieldVO {
        this.return_min_value = return_min_value;
        return this;
    }

    public readonly(): ModuleTableFieldVO {
        this.is_readonly = true;
        return this;
    }

    public unique(replace_if_unique: boolean = false): ModuleTableFieldVO {
        this.is_unique = true;
        this.replace_if_unique = replace_if_unique;
        return this;
    }

    public not_add_to_crud(): ModuleTableFieldVO {
        this.do_not_add_to_crud = true;
        return this;
    }

    public index(): ModuleTableFieldVO {
        this.is_indexed = true;
        return this;
    }

    public do_not_index(): ModuleTableFieldVO {
        this.is_indexed = false;
        return this;
    }

    public hide_print(): ModuleTableFieldVO {
        this.hidden_print = true;

        return this;
    }

    public set_max_values(max_values: number): ModuleTableFieldVO {

        this.max_values = max_values;
        return this;
    }

    public set_min_values(min_values: number): ModuleTableFieldVO {

        this.min_values = min_values;
        return this;
    }

    public hide_from_datatable(): ModuleTableFieldVO {
        this.is_visible_datatable = false;

        return this;
    }

    public setModuleTable(moduleTable: ModuleTable<any>): ModuleTableFieldVO {
        this.module_table = moduleTable;

        this.setLabelCodeText();

        return this;
    }

    public setIsArray(): ModuleTableFieldVO {
        this.is_array = true;

        return this;
    }

    public setInclusiveData(): ModuleTableFieldVO {
        this.is_inclusive_data = true;

        return this;
    }

    public donotCascadeOnDelete(): ModuleTableFieldVO {
        this.cascade_on_delete = false;

        return this;
    }

    public forceCascadeOnDelete(): ModuleTableFieldVO {
        this.cascade_on_delete = true;

        return this;
    }

    public setInclusiveIHM(): ModuleTableFieldVO {
        this.is_inclusive_ihm = true;

        return this;
    }

    // /**
    //  * FIXME: à supprimer quand ok
    //  * POUR INFO : cette méthode semble inutilisée, et donc on ne change jamais l'invalidateur par défaut, .defaultValidator,
    //  *  donc on supprime le champs (qui ne serait pas transposable en BDD dans tous les cas en l'état) et on met le defaultValidator en méthode statique
    //  * @param validator Renvoie null ou "" si ok, sinon le code_text traduisible de l'erreur
    //  */
    // public setValidator(validator: (data: any) => string): ModuleTableFieldVO {
    //     this.validate = validator;

    //     return this;
    // }

    public getValidationTextCodeBase(): string {
        return "validation.ko." + this.module_table.full_name + "." + this.field_id + ".";
    }

    /**
     * @param enum_values An obj which for each key has as a value the code_text used for translation
     */
    public setEnumValues(enum_values: { [value: number]: string }): ModuleTableFieldVO {
        this.field_type = ModuleTableFieldVO.FIELD_TYPE_enum;
        this.enum_values = enum_values;

        return this;
    }

    /**
     * @param enum_image_values An obj which for each key has as a value the code_text used for translation
     */
    public setEnumImageValues(enum_image_values: { [value: number]: string }): ModuleTableFieldVO {
        this.field_type = ModuleTableFieldVO.FIELD_TYPE_enum;
        this.enum_image_values = enum_image_values;

        return this;
    }

    /**
     * @param enum_color_values An obj which for each key has as a value the code_text used for translation
     */
    public setEnumColorValues(enum_color_values: { [value: number]: string }): ModuleTableFieldVO {
        this.field_type = ModuleTableFieldVO.FIELD_TYPE_enum;
        this.enum_color_values = enum_color_values;

        return this;
    }

    public setTargetDatatable(module_table: ModuleTable<any>): ModuleTableFieldVO {
        this.module_table = module_table;

        this.setLabelCodeText();

        return this;
    }

    public setLabelCodeText(module_name: string = null): ModuleTableFieldVO {
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
            return this.field_id + ' ' + this.getPGSqlFieldType() + (this.field_required ? ' NOT NULL' : '') + (this.has_default ? ' DEFAULT ' + default_value : ''); // + (this.is_unique ? ' UNIQUE' : '');
        } catch (error) {
            ConsoleHandler.error('Valeur par défaut incompatible avec la BDD pour le champs:' + this.field_id + ':' + error);
        }
        return this.field_id + ' ' + this.getPGSqlFieldType() + (this.field_required ? ' NOT NULL' : ''); // + (this.is_unique ? ' UNIQUE' : '');
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
        if (this.field_type != ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
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

    public addManyToOneRelation<U extends IDistantVOBase>(target_database: ModuleTable<U>): ModuleTableFieldVO {
        this.manyToOne_target_moduletable = target_database;
        this.target_database = target_database.database;
        this.target_table = target_database.name;
        this.target_field = 'id';
        this.has_relation = true;

        this.index();

        return this;
    }

    get has_single_relation() {
        if ((this.field_type != ModuleTableFieldVO.FIELD_TYPE_file_ref) &&
            (this.field_type != ModuleTableFieldVO.FIELD_TYPE_foreign_key) &&
            (this.field_type != ModuleTableFieldVO.FIELD_TYPE_image_ref) &&
            (this.field_type != ModuleTableFieldVO.FIELD_TYPE_int)) {
            return false;
        }

        return true;
    }

    public isAcceptableCurrentDBType(db_type: string): boolean {
        switch (this.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                return (db_type == "int8") || (db_type == "bigint") || (db_type == "integer");

            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return (db_type == "int8") || (db_type == "bigint");

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                return (db_type == "bigint[]") || (db_type == "ARRAY");

            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                return (db_type == "float8") || (db_type == "double precision") || (db_type == "numeric");

            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                return (db_type == "numeric");

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                return (db_type == "text[]") || (db_type == "ARRAY");

            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                return (db_type == "float8[]") || (db_type == "ARRAY") || (db_type == "numeric[]");

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                return (db_type == "bigint[]") || (db_type == "ARRAY");

            case ModuleTableFieldVO.FIELD_TYPE_boolean:
                return db_type == "boolean";

            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_date:
                return db_type == "date";

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                return db_type == "point";

            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case "ref.hours":
                return (db_type == "ref.hours") || (db_type == "numeric");

            case ModuleTableFieldVO.FIELD_TYPE_daterange:
                return db_type == "daterange";

            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return (db_type == "numrange[]") || (db_type == "ARRAY");
            // case ModuleTableFieldVO.FIELD_TYPE_daterange_array:
            //     return db_type == "daterange[]";
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return (db_type == "numrange[]") || (db_type == "ARRAY");

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return db_type == "numrange";

            case ModuleTableFieldVO.FIELD_TYPE_hour:
                return (db_type == "int8") || (db_type == "bigint");

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return db_type == "int8range";

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return (db_type == "int8range[]") || (db_type == "ARRAY");

            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                return db_type == "time without time zone";

            case ModuleTableFieldVO.FIELD_TYPE_prct:
                return (db_type == "ref.pct") || (db_type == "float8") || (db_type == "double precision") || (db_type == "numeric");

            case 'real':
                return db_type == "real";

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
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
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
                return "int8";

            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_float:
                return "float8";

            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                return "numeric";

            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return "bigint";

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                return "bigint[]";

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                return "text[]";

            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                return "numeric[]";

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                return "bigint[]";

            case ModuleTableFieldVO.FIELD_TYPE_boolean:
                return "boolean";

            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_date:
                return "date";

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                return "point";

            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case "ref.hours":
                return "ref.hours";

            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                return "float8";

            case ModuleTableFieldVO.FIELD_TYPE_daterange:
                return "daterange";

            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return "numrange[]";
            // case ModuleTableFieldVO.FIELD_TYPE_daterange_array:
            //     return "daterange[]";
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return "numrange[]";

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return "numrange";

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return "int8range";

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return "int8range[]";

            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                return "time without time zone";

            case ModuleTableFieldVO.FIELD_TYPE_prct:
                return "float8";

            case 'real':
                return "real";

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
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
}
import * as moment from 'moment';
import ConversionHandler from '../tools/ConversionHandler';
import DateHandler from '../tools/DateHandler';
import IDistantVOBase from './IDistantVOBase';
import Module from './Module';
import { default as ModuleDBField, default as ModuleTableField } from './ModuleTableField';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import VOsTypesManager from './VOsTypesManager';
import NumRangeHandler from '../tools/NumRangeHandler';
import TSRangeHandler from '../tools/TSRangeHandler';

export default class ModuleTable<T extends IDistantVOBase> {

    private static UID: number = 1;
    private static getNextUID(): number {
        return ModuleTable.UID++;
    }

    public table_name: string;
    public full_name: string;
    public uid: string;

    public hook_datatable_install: (db) => {} = null;

    public module: Module;
    public fields: Array<ModuleDBField<any>>;
    public suffix: string;
    public prefix: string;
    public database: string;
    public vo_type: string;
    public label: DefaultTranslation = null;
    public forceNumeric: (e: T) => T = null;
    public get_bdd_version: (e: T) => T = null;
    public forceNumerics: (es: T[]) => T[] = null;

    public default_label_field: ModuleTableField<any> = null;
    public table_label_function: (vo: T) => string = null;
    public table_label_function_field_ids_deps: string[] = null;
    public importable: boolean = false;
    public isModuleParamTable: boolean = false;

    public isMatroidTable: boolean = false;

    public any_to_many_default_behaviour_show: boolean = true;

    public voConstructor: () => T = null;

    private vo_interfaces: { [interface_name: string]: boolean } = {};

    constructor(
        tmp_module: Module,
        tmp_vo_type: string,
        tmp_fields: Array<ModuleDBField<any>>,
        default_label_field: ModuleTableField<any>,
        label: string | DefaultTranslation = null
    ) {

        this.default_label_field = default_label_field;
        this.forceNumeric = this.defaultforceNumeric;
        this.forceNumerics = this.defaultforceNumerics;

        this.get_bdd_version = this.default_get_bdd_version;

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

        if (this.vo_type) {
            VOsTypesManager.getInstance().registerModuleTable(this);
        }
    }

    public defineAsMatroid(): ModuleTable<any> {
        this.isMatroidTable = true;
        return this;
    }

    public hideAnyToManyByDefault(): ModuleTable<any> {
        this.any_to_many_default_behaviour_show = false;
        return this;
    }

    public hasVOInterface(interface_name: string): boolean {

        return this.vo_interfaces[interface_name];
    }

    public defineVOInterfaces(interface_names: string[]): ModuleTable<any> {

        for (let i in interface_names) {
            let interface_name = interface_names[i];

            this.vo_interfaces[interface_name] = true;
        }

        return this;
    }

    public define_default_label_function(
        table_label_function: (vo: T) => string,
        table_label_function_field_ids_deps: string[]): ModuleTable<any> {

        this.default_label_field = null;
        this.table_label_function = table_label_function;
        this.table_label_function_field_ids_deps = table_label_function_field_ids_deps;

        return this;
    }

    public defineVOConstructor(voConstructor: () => T) {
        this.voConstructor = voConstructor;
    }

    public getNewVO(): T {
        if (this.voConstructor) {
            return this.voConstructor();
        }
        return null;
    }

    public defineAsModuleParamTable(): ModuleTable<any> {
        this.isModuleParamTable = true;
        return this;
    }

    public defineAsImportable(): ModuleTable<any> {

        // Il faut créer le moduleTable des datas raws.
        // this.registerImportableModuleTable();

        this.importable = true;
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

    /**
     * On part du principe que les refs on en trouve une par type sur une table, en tout cas on renvoie la premiere
     * @param vo_type
     */
    public getRefFieldFromTargetVoType(vo_type: string): ModuleTableField<any> {
        if (!vo_type) {
            return null;
        }

        for (let i in this.fields) {
            let field: ModuleTableField<any> = this.fields[i];

            if (field && field.has_relation && field.manyToOne_target_moduletable && field.manyToOne_target_moduletable.vo_type == vo_type) {
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

        for (let i in this.fields) {
            this.fields[i].setTargetDatatable(this);
        }

        this.label.code_text = "fields.labels." + this.full_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(this.label);
    }

    /**
     * Permet de récupérer un clone dont les fields sont insérables en bdd.
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec le format de la BDD
     *  (exemple du unix_timestamp qu'on stocke comme un bigint en BDD mais qu'on manipule en Moment)
     * @param e Le VO dont on veut une version insérable en BDD
     */
    private default_get_bdd_version(e: T): T {
        if (!e) {
            return null;
        }

        let res: T = Object.assign({}, e);

        if (!this.fields) {
            return res;
        }

        for (let i in this.fields) {
            let field = this.fields[i];

            switch (field.field_type) {

                case ModuleTableField.FIELD_TYPE_unix_timestamp:

                    let field_as_moment: moment.Moment = res[field.field_id] as moment.Moment;
                    res[field.field_id] = (field_as_moment && field_as_moment.isValid()) ? field_as_moment.unix() : null;
                    break;

                case ModuleTableField.FIELD_TYPE_numrange_array:
                    res[field.field_id] = NumRangeHandler.getInstance().translate_to_bdd(res[field.field_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    res[field.field_id] = TSRangeHandler.getInstance().translate_to_bdd(res[field.field_id]);
                    break;

                default:
            }
        }

        return res;
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

            if (field.field_type == ModuleTableField.FIELD_TYPE_timestamp) {
                // A priori c'est without time zone du coup....
                // e[field.field_id] = e[field.field_id] ? moment(e[field.field_id]).format('Y-MM-DDTHH:mm:SS.sss') + 'Z' : e[field.field_id];
                e[field.field_id] = e[field.field_id] ? moment(e[field.field_id]).format('Y-MM-DDTHH:mm:SS.sss') : e[field.field_id];
            }

            if ((field.field_type == ModuleTableField.FIELD_TYPE_float) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_amount) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_file_ref) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_image_ref) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_foreign_key) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_int) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_enum) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_prct)) {
                e[field.field_id] = ConversionHandler.getInstance().forceNumber(e[field.field_id]);
            }

            if (field.field_type == ModuleTableField.FIELD_TYPE_int_array) {
                if (e[field.field_id]) {
                    e[field.field_id] = e[field.field_id].map(Number);
                }
            }

            if (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) {
                e[field.field_id] = NumRangeHandler.getInstance().translate_from_bdd(e[field.field_id]);
            }
            if (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                e[field.field_id] = TSRangeHandler.getInstance().translate_from_bdd(e[field.field_id]);
            }

            if ((field.field_type == ModuleTableField.FIELD_TYPE_day) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_date) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_month)) {
                e[field.field_id] = (e[field.field_id]) ? DateHandler.getInstance().formatDayForIndex(moment(e[field.field_id])) : e[field.field_id];
            }

            if (field.field_type == ModuleTableField.FIELD_TYPE_unix_timestamp) {
                e[field.field_id] = (e[field.field_id] && moment(e[field.field_id]).isValid()) ? moment(e[field.field_id]) : e[field.field_id];
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
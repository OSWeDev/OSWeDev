import cloneDeep = require('lodash/cloneDeep');
import * as moment from 'moment';
import { Moment } from 'moment';
import ConsoleHandler from '../tools/ConsoleHandler';
import ConversionHandler from '../tools/ConversionHandler';
import DateHandler from '../tools/DateHandler';
import GeoPointHandler from '../tools/GeoPointHandler';
import RangeHandler from '../tools/RangeHandler';
import HourRange from './DataRender/vos/HourRange';
import HourSegment from './DataRender/vos/HourSegment';
import NumRange from './DataRender/vos/NumRange';
import NumSegment from './DataRender/vos/NumSegment';
import TimeSegment from './DataRender/vos/TimeSegment';
import TSRange from './DataRender/vos/TSRange';
import GeoPointVO from './GeoPoint/vos/GeoPointVO';
import IDistantVOBase from './IDistantVOBase';
import Module from './Module';
import ModuleTableField from './ModuleTableField';
import DefaultTranslationManager from './Translation/DefaultTranslationManager';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import VOsTypesManager from './VOsTypesManager';

export default class ModuleTable<T extends IDistantVOBase> {

    private static UID: number = 1;
    private static OFFUSC_IDs = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
        'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z',
        'a0', 'b0', 'c0', 'd0', 'e0', 'f0', 'g0', 'h0', 'i0', 'j0', 'k0',
        'l0', 'm0', 'n0', 'o0', 'p0', 'q0', 'r0', 's0', 't0', 'u0', 'v0',
        'w0', 'x0', 'y0', 'z0',
        'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1',
        'l1', 'm1', 'n1', 'o1', 'p1', 'q1', 'r1', 's1', 't1', 'u1', 'v1',
        'w1', 'x1', 'y1', 'z1',
        'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2', 'k2',
        'l2', 'm2', 'n2', 'o2', 'p2', 'q2', 'r2', 's2', 't2', 'u2', 'v2',
        'w2', 'x2', 'y2', 'z2',
        'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3', 'k3',
        'l3', 'm3', 'n3', 'o3', 'p3', 'q3', 'r3', 's3', 't3', 'u3', 'v3',
        'w3', 'x3', 'y3', 'z3',
        'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4', 'j4', 'k4',
        'l4', 'm4', 'n4', 'o4', 'p4', 'q4', 'r4', 's4', 't4', 'u4', 'v4',
        'w4', 'x4', 'y4', 'z4',
        'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5', 'j5', 'k5',
        'l5', 'm5', 'n5', 'o5', 'p5', 'q5', 'r5', 's5', 't5', 'u5', 'v5',
        'w5', 'x5', 'y5', 'z5',
        'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6', 'j6', 'k6',
        'l6', 'm6', 'n6', 'o6', 'p6', 'q6', 'r6', 's6', 't6', 'u6', 'v6',
        'w6', 'x6', 'y6', 'z6',
        'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7', 'j7', 'k7',
        'l7', 'm7', 'n7', 'o7', 'p7', 'q7', 'r7', 's7', 't7', 'u7', 'v7',
        'w7', 'x7', 'y7', 'z7',
        'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8', 'j8', 'k8',
        'l8', 'm8', 'n8', 'o8', 'p8', 'q8', 'r8', 's8', 't8', 'u8', 'v8',
        'w8', 'x8', 'y8', 'z8',
        'a9', 'b9', 'c9', 'd9', 'e9', 'f9', 'g9', 'h9', 'i9', 'j9', 'k9',
        'l9', 'm9', 'n9', 'o9', 'p9', 'q9', 'r9', 's9', 't9', 'u9', 'v9',
        'w9', 'x9', 'y9', 'z9',
        'a_', 'b_', 'c_', 'd_', 'e_', 'f_', 'g_', 'h_', 'i_', 'j_', 'k_',
        'l_', 'm_', 'n_', 'o_', 'p_', 'q_', 'r_', 's_', 't_', 'u_', 'v_',
        'w_', 'x_', 'y_', 'z_',
    ];

    private static getNextUID(): number {
        return ModuleTable.UID++;
    }

    /**
     * Local thread cache -----
     */

    public table_name: string;
    public full_name: string;
    public uid: string;

    /**
     * Infos liées à la segmentation d'une table
     *  Techniquement on a un segment_type déclaré sur le field directement, mais on imagine un cas de segmentation
     *      de table de log à la journée, le log est segmenté à la seconde par contre, donc les segmentations sont différentiés
     *  En revanche en théorie le range_type se déduit du type du field sur lequel on segmente, donc on le set automatiquement et
     *      on garde lisible juste pour trace et éviter de refaire le switch en permanence.
     */
    public is_segmented: boolean = false;
    public table_segmented_field: ModuleTableField<any> = null;
    public table_segmented_field_range_type: number = null;
    public table_segmented_field_segment_type: number = null;

    public hook_datatable_install: (db) => {} = null;

    public module: Module;
    // public fields: Array<ModuleTableField<any>>;
    public suffix: string;
    public prefix: string;
    public database: string;
    public vo_type: string;
    public label: DefaultTranslation = null;
    public forceNumeric: (e: T) => void = null;
    public get_bdd_version: (e: T) => T = null;
    public forceNumerics: (es: T[]) => T[] = null;

    public get_api_version: (e: T) => any = null;
    public from_api_version: (e: any) => T = null;

    public default_label_field: ModuleTableField<any> = null;
    public table_label_function: (vo: T) => string = null;
    public table_label_function_field_ids_deps: string[] = null;
    public importable: boolean = false;
    public isModuleParamTable: boolean = false;

    public inherit_rights_from_vo_type: string = null;

    public isMatroidTable: boolean = false;

    public any_to_many_default_behaviour_show: boolean = true;

    public voConstructor: () => T = null;

    public matroid_cloner: (src: T) => T = ((src: T) => { }) as any;

    /**
     * Mappings de traduction d'un Vo de ce type vers un Vo du type b
     *  Par défaut il faut lever une erreur si on cherche un mapping undefined
     *  et si on veut rien mapper de particulier mais permettre le mapping, mettre {}
     *  le mapping sera fait à l'identique
     */
    public mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_id_a: string]: string } } = {};

    private vo_interfaces: { [interface_name: string]: boolean } = {};

    private fields_: Array<ModuleTableField<any>> = [];
    private fields_by_ids: { [field_id: string]: ModuleTableField<any> } = {};

    private sortedFields: Array<ModuleTableField<any>> = [];
    /**
     * ----- Local thread cache
     */

    constructor(
        tmp_module: Module,
        tmp_vo_type: string,
        voConstructor: () => T,
        tmp_fields: Array<ModuleTableField<any>>,
        default_label_field: ModuleTableField<any>,
        label: string | DefaultTranslation = null
    ) {

        this.voConstructor = voConstructor;

        this.default_label_field = default_label_field;
        this.forceNumeric = this.defaultforceNumeric;
        this.forceNumerics = this.defaultforceNumerics;

        this.get_api_version = this.default_get_api_version;
        this.from_api_version = this.default_from_api_version;

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

        this.set_fields(tmp_fields);

        if (this.module && this.module.name) {
            this.set_bdd_ref("ref", this.module.name, this.vo_type, "module");
        }

        if (this.vo_type) {
            VOsTypesManager.getInstance().registerModuleTable(this);
        }
    }

    /**
     * On ne peut segmenter que sur un field de type range ou ranges pour le moment
     *  techniquement rien n'empeche d'étendre ça à tous les autres types de données
     */
    public segment_on_field(field_id: string, segment_type: number): ModuleTable<any> {

        let field = this.getFieldFromId(field_id);

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_html_array:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            default:
                return null;

            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
                this.table_segmented_field_range_type = HourRange.RANGE_TYPE;
                break;

            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
                this.table_segmented_field_range_type = TSRange.RANGE_TYPE;
                break;

            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                this.table_segmented_field_range_type = NumRange.RANGE_TYPE;

        }

        this.is_segmented = true;
        this.table_segmented_field = field;
        this.table_segmented_field_segment_type = segment_type;

        this.database = this.name;
        this.full_name = this.database + '.' + this.name;
        this.uid = this.database + '_' + this.name;

        return this;
    }


    public get_segmented_full_name(segmented_value: number | moment.Duration | Moment): string {

        if (!this.is_segmented) {
            return null;
        }

        let name = this.get_segmented_name(segmented_value);

        if (!name) {
            return null;
        }

        return this.database + '.' + name;
    }

    public get_segmented_name(segmented_value: number | moment.Duration | Moment): string {

        if (!this.is_segmented) {
            return null;
        }

        switch (this.table_segmented_field_range_type) {
            case NumRange.RANGE_TYPE:
                return this.name + '_' + (segmented_value as number).toString();
            case TSRange.RANGE_TYPE:
                return this.name + '_' + (segmented_value as moment.Duration).asMilliseconds().toString();
            case HourRange.RANGE_TYPE:
                return this.name + '_' + DateHandler.getInstance().getUnixForBDD(segmented_value as Moment).toString();
            default:
                return null;
        }
    }

    public get_segmented_full_name_from_vo(vo: IDistantVOBase): string {

        if (!this.is_segmented) {
            return null;
        }

        let name = this.get_segmented_name_from_vo(vo);

        if (!name) {
            return null;
        }

        return this.database + '.' + name;
    }

    public get_segmented_name_from_vo(vo: IDistantVOBase): string {

        if (!this.is_segmented) {
            return null;
        }

        if (!vo) {
            return null;
        }

        let segmented_field_value = this.get_segmented_field_value_from_vo(vo);

        if (!segmented_field_value) {
            return null;
        }

        return this.get_segmented_name(segmented_field_value);
    }

    public get_segmented_field_value_from_vo(vo: IDistantVOBase): any {

        if (!this.is_segmented) {
            return null;
        }

        if (!vo) {
            return null;
        }

        let field_value = vo[this.table_segmented_field.field_id];

        if (!field_value) {
            return null;
        }

        // On doit avoir un cardinal 1 dans tous les cas, mais on check pas sinon c'est trop lourd

        switch (this.table_segmented_field.field_type) {
            case ModuleTableField.FIELD_TYPE_hourrange:
                return RangeHandler.getInstance().getSegmentedMin(field_value as HourRange, this.table_segmented_field_segment_type);

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return RangeHandler.getInstance().getSegmentedMin_from_ranges(field_value as HourRange[], this.table_segmented_field_segment_type);

            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
                // TODO
                ConsoleHandler.getInstance().error('Not Implemented');
                break;

            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
                if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
                    return field_value;
                } else {
                    ConsoleHandler.getInstance().error('Not Implemented');
                }
                break;

            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_amount:
                if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
                    return Math.floor(field_value);
                } else {
                    ConsoleHandler.getInstance().error('Not Implemented');
                }
                break;

            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
                return RangeHandler.getInstance().getSegmentedMin_from_ranges(field_value as NumRange[], this.table_segmented_field_segment_type);
        }

        return null;
    }

    public get_fields(): Array<ModuleTableField<any>> {
        return this.fields_;
    }

    public push_field(field: ModuleTableField<any>) {
        this.fields_.push(field);
        this.fields_by_ids[field.field_id] = field;

        this.set_sortedFields();
    }

    public set_fields(fields: Array<ModuleTableField<any>>) {
        this.fields_ = fields;

        this.fields_by_ids = {};
        for (let i in this.fields_) {
            let field = this.fields_[i];
            this.fields_by_ids[field.field_id] = field;
        }

        this.set_sortedFields();
    }

    public addAlias(api_type_id_alias: string): ModuleTable<any> {
        VOsTypesManager.getInstance().addAlias(api_type_id_alias, this.vo_type);
        return this;
    }

    /**
     * A utiliser sur tous les params pour indiquer vers quels autres params on peut mapper des champs (pour des intersections principalement)
     *  et sur tous les vos pour indiquer vers quels params on peut mapper des champs (pour des intersections également en base)
     * @param mapping_by_api_type_ids
     */
    public set_mapping_by_api_type_ids(mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_id_a: string]: string } }): ModuleTable<any> {
        this.mapping_by_api_type_ids = mapping_by_api_type_ids;
        return this;
    }

    public set_matroid_cloner(matroid_cloner: (src: T) => T): ModuleTable<any> {
        this.matroid_cloner = matroid_cloner;
        return this;
    }

    public defineAsMatroid(): ModuleTable<any> {
        this.isMatroidTable = true;
        return this;
    }

    public set_inherit_rights_from_vo_type(inherit_rights_from_vo_type: string): ModuleTable<any> {
        this.inherit_rights_from_vo_type = inherit_rights_from_vo_type;
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

    public defineVOConstructor(voConstructor: () => T): ModuleTable<any> {
        this.voConstructor = voConstructor;

        return this;
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

        return this.fields_by_ids[field_id];
    }

    /**
     * On part du principe que les refs on en trouve une par type sur une table, en tout cas on renvoie la premiere
     * @param vo_type
     */
    public getRefFieldFromTargetVoType(vo_type: string): ModuleTableField<any> {
        if (!vo_type) {
            return null;
        }

        for (let i in this.fields_) {
            let field: ModuleTableField<any> = this.fields_[i];

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

        // Si la base est segmentée, interdiction de modifier les liaisons
        if (this.is_segmented) {
            return null;
        }

        this.set_bdd_suffix_prefix_table_name(table_name, table_name_suffix, table_name_prefix);
        this.database = database_name;

        this.full_name = this.database + '.' + this.name;
        this.uid = this.database + '_' + this.name;

        for (let i in this.fields_) {
            this.fields_[i].setTargetDatatable(this);
        }

        this.label.code_text = "fields.labels." + this.full_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.getInstance().registerDefaultTranslation(this.label);
    }

    /**
     * A voir si dirty et nécessite refonte mais ça semble bien suffisant et très simple/rapide
     */
    private getFieldIdToAPIMap(): { [field_id: string]: string } {
        let res: { [field_id: string]: string } = {};
        let n = 0;

        for (let i in this.sortedFields) {
            let field = this.sortedFields[i];

            res[field.field_id] = ModuleTable.OFFUSC_IDs[n];
            n++;
        }

        return res;
    }

    /**
     * A voir si dirty et nécessite refonte mais ça semble bien suffisant et très simple/rapide
     */
    private getAPIToFieldIdMap(): { [api_id: string]: string } {
        let res: { [api_id: string]: string } = {};
        let n = 0;

        for (let i in this.sortedFields) {
            let field = this.sortedFields[i];

            res[ModuleTable.OFFUSC_IDs[n]] = field.field_id;
            n++;
        }

        return res;
    }

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     */
    private default_get_api_version(e: T): any {
        if (!e) {
            return null;
        }

        let res = {};

        if (!this.fields_) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = this.getFieldIdToAPIMap();

        for (let i in this.fields_) {
            let field = this.fields_[i];

            let new_id = fieldIdToAPIMap[field.field_id];

            /**
             * Si le champ possible un custom_to_api
             */
            if (!!field.custom_translate_to_api) {
                res[new_id] = field.custom_translate_to_api(e[field.field_id]);
                continue;
            }

            switch (field.field_type) {

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    res[new_id] = RangeHandler.getInstance().translate_to_api(e[field.field_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tsrange:
                case ModuleTableField.FIELD_TYPE_hourrange:
                    res[new_id] = RangeHandler.getInstance().translate_range_to_api(e[field.field_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tstz:
                    let field_as_moment: Moment = moment(e[field.field_id]).utc(true);
                    res[new_id] = (field_as_moment && field_as_moment.isValid()) ? field_as_moment.unix() : null;
                    break;

                default:
                    res[new_id] = e[field.field_id];
            }
        }

        return res;
    }

    /**
     * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
     * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
     */
    private default_from_api_version(e: any): T {
        if (!e) {
            return null;
        }

        let res: T = this.getNewVO();

        if ((!this.fields_) || (!res)) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = this.getFieldIdToAPIMap();

        for (let i in this.fields_) {
            let field = this.fields_[i];

            let old_id = fieldIdToAPIMap[field.field_id];

            /**
             * Si le champ possible un custom_from_api
             */
            if (!!field.custom_translate_from_api) {
                res[field.field_id] = field.custom_translate_from_api(e[old_id]);
                continue;
            }

            switch (field.field_type) {

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                    res[field.field_id] = RangeHandler.getInstance().translate_from_api(NumRange.RANGE_TYPE, e[old_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    res[field.field_id] = RangeHandler.getInstance().translate_from_api(TSRange.RANGE_TYPE, e[old_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    res[field.field_id] = RangeHandler.getInstance().translate_from_api(HourRange.RANGE_TYPE, e[old_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_hourrange:
                    res[field.field_id] = RangeHandler.getInstance().parseRangeAPI(HourRange.RANGE_TYPE, e[old_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tsrange:
                    res[field.field_id] = RangeHandler.getInstance().parseRangeAPI(TSRange.RANGE_TYPE, e[old_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_hour:
                    res[field.field_id] = e[old_id] ? moment.duration(parseInt(e[old_id])) : null;
                    break;

                case ModuleTableField.FIELD_TYPE_tstz:
                    // Pourquoi ça marche avec un *1000 ici ????
                    res[field.field_id] = e[old_id] ? moment(parseInt(e[old_id]) * 1000).utc() : null;
                    break;

                default:
                    res[field.field_id] = e[old_id];
            }
        }

        return res;
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

        let res = cloneDeep(e);

        if (!this.fields_) {
            return res;
        }

        for (let i in this.fields_) {
            let field = this.fields_[i];

            switch (field.field_type) {

                case ModuleTableField.FIELD_TYPE_tstz:

                    let field_as_moment: Moment = moment(res[field.field_id]).utc(true);
                    res[field.field_id] = (field_as_moment && field_as_moment.isValid()) ? field_as_moment.unix() : null;
                    break;

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    res[field.field_id] = RangeHandler.getInstance().translate_to_bdd(res[field.field_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_tsrange:
                case ModuleTableField.FIELD_TYPE_hourrange:
                    res[field.field_id] = RangeHandler.getInstance().translate_range_to_bdd(res[field.field_id]);
                    break;

                case ModuleTableField.FIELD_TYPE_timestamp:
                    // A priori c'est without time zone du coup....
                    if (res[field.field_id]) {
                        res[field.field_id] = moment(res[field.field_id]).utc(true);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_geopoint:
                    if (res[field.field_id]) {
                        res[field.field_id] = GeoPointHandler.getInstance().format(res[field.field_id]);
                    }
                    break;

                default:
            }
        }

        return res;
    }

    private defaultforceNumeric(e: T) {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);
        e._type = this.vo_type;

        if (!this.fields_) {
            return e;
        }
        for (let i in this.fields_) {
            let field = this.fields_[i];

            let field_value = e[field.field_id];

            if ((typeof field_value == 'undefined') || (field_value === null)) {
                continue;
            }

            switch (field.field_type) {

                case ModuleTableField.FIELD_TYPE_timestamp:
                    // A priori c'est without time zone du coup....
                    // e[field.field_id] = e[field.field_id] ? moment(e[field.field_id]).format('Y-MM-DDTHH:mm:SS.sss') + 'Z' : e[field.field_id];
                    e[field.field_id] = moment(field_value).utc(true).format('Y-MM-DDTHH:mm:SS.sss');
                    break;

                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_file_ref:
                case ModuleTableField.FIELD_TYPE_image_ref:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_enum:
                case ModuleTableField.FIELD_TYPE_prct:
                    e[field.field_id] = ConversionHandler.getInstance().forceNumber(field_value);
                    break;

                case ModuleTableField.FIELD_TYPE_int_array:
                    e[field.field_id] = field_value.map(Number);
                    break;

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                    // TODO FIXME ASAP : ALORS là c'est du pif total, on a pas l'info du tout en base, donc on peut pas conserver le segment_type......
                    //  on prend les plus petits segments possibles, a priori ça pose 'moins' de soucis [?]
                    e[field.field_id] = RangeHandler.getInstance().translate_from_bdd(NumRange.RANGE_TYPE, field_value);
                    break;
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    e[field.field_id] = RangeHandler.getInstance().translate_from_bdd(TSRange.RANGE_TYPE, field_value);
                    break;
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    e[field.field_id] = RangeHandler.getInstance().translate_from_bdd(HourRange.RANGE_TYPE, field_value);
                    break;

                case ModuleTableField.FIELD_TYPE_day:
                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_month:
                    e[field.field_id] = DateHandler.getInstance().formatDayForIndex(moment(field_value).utc(true));
                    break;

                case ModuleTableField.FIELD_TYPE_tstz:
                    e[field.field_id] = moment(parseInt(field_value) * 1000).utc();
                    break;

                case ModuleTableField.FIELD_TYPE_tsrange:
                    e[field.field_id] = RangeHandler.getInstance().parseRangeBDD(TSRange.RANGE_TYPE, field_value, TimeSegment.TYPE_MS);
                    break;

                case ModuleTableField.FIELD_TYPE_hourrange:
                    e[field.field_id] = RangeHandler.getInstance().parseRangeBDD(HourRange.RANGE_TYPE, field_value, HourSegment.TYPE_MS);
                    break;

                case ModuleTableField.FIELD_TYPE_hour:
                    e[field.field_id] = moment.duration(parseInt(field_value));
                    break;

                case ModuleTableField.FIELD_TYPE_geopoint:
                    if (e[field.field_id]) {
                        e[field.field_id] = GeoPointVO.clone(field_value);
                    }
                    break;
            }
        }

        return e;
    }

    private defaultforceNumerics(es: T[]): T[] {
        for (let i in es) {
            this.defaultforceNumeric(es[i]);
        }
        return es;
    }

    private set_sortedFields() {
        this.sortedFields = Array.from(this.fields_);

        this.sortedFields.sort((a: ModuleTableField<any>, b: ModuleTableField<any>) => {
            if (a.field_id < b.field_id) {
                return -1;
            }
            if (a.field_id > b.field_id) {
                return 1;
            }
            return 0;
        });
    }
}
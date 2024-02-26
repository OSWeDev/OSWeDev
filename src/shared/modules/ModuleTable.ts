// import { isArray } from 'lodash';
// import moment from 'moment';
// import ConsoleHandler from '../tools/ConsoleHandler';
// import ConversionHandler from '../tools/ConversionHandler';
// import DateHandler from '../tools/DateHandler';
// import GeoPointHandler from '../tools/GeoPointHandler';
// import MatroidIndexHandler from '../tools/MatroidIndexHandler';
// import RangeHandler from '../tools/RangeHandler';
// import IRange from './DataRender/interfaces/IRange';
// import HourRange from './DataRender/vos/HourRange';
// import HourSegment from './DataRender/vos/HourSegment';
// import NumRange from './DataRender/vos/NumRange';
// import NumSegment from './DataRender/vos/NumSegment';
// import TimeSegment from './DataRender/vos/TimeSegment';
// import TSRange from './DataRender/vos/TSRange';
// import GeoPointVO from './GeoPoint/vos/GeoPointVO';
// import IDistantVOBase from './IDistantVOBase';
// import MatroidController from './Matroid/MatroidController';
// import Module from './Module';
// import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from './ModuleTableFieldVO';
// import DefaultTranslationManager from './Translation/DefaultTranslationManager';
// import DefaultTranslationVO from './Translation/vos/DefaultTranslationVO';
// import VarDataBaseVO from './Var/vos/VarDataBaseVO';
// import cloneDeep from 'lodash/cloneDeep';
// import VOsTypesManager from './VO/manager/VOsTypesManager';
// import ContextQueryInjectionCheckHandler from './ContextFilter/ContextQueryInjectionCheckHandler';
// import ObjectHandler, { reflect } from '../tools/ObjectHandler';
// import IIsServerField from './IIsServerField';
// import StatsController from './Stats/StatsController';


// export default class ModuleTableVO<T extends IDistantVOBase> {

//     public static defaultforceNumeric<T extends IDistantVOBase>(e: T) {

//         if (e == null) {
//             return null;
//         }

//         if (!e._type) {
//             return e;
//         }

//         let moduleTable = VOsTypesManager.moduleTables_by_voType[e._type];

//         if (!moduleTable) {
//             return e;
//         }

//         for (let i in moduleTable.readonlyfields_by_ids) {
//             let field = moduleTable.readonlyfields_by_ids[i];
//             delete e[field.field_name];
//         }

//         let res: T = Object.assign(moduleTable.voConstructor(), e);

//         // // Si le type diffère, on veut créer une nouvelle instance et réinitialiser tous les champs ensuite
//         // if (e._type != this.vo_type) {

//         //     for (let i in this.readonlyfields_by_ids) {
//         //         let field = this.readonlyfields_by_ids[i];
//         //         delete e[field.field_name];
//         //     }
//         //     res = Object.assign(this.voConstructor(), e);
//         //     res._type = this.vo_type;
//         // }

//         res.id = ConversionHandler.forceNumber(e.id);

//         if (!moduleTable.fields_) {
//             return res;
//         }
//         for (let i in moduleTable.fields_) {
//             let field = moduleTable.fields_[i];

//             moduleTable.force_numeric_field(field, e, res);
//         }

//         return res;
//     }

//     public static defaultforceNumerics<T extends IDistantVOBase>(es: T[]): T[] {
//         for (let i in es) {
//             es[i] = ModuleTableVO.defaultforceNumeric(es[i]);
//         }
//         return es;
//     }


//     /**
//      * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
//      * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
//      * @param e Le VO dont on veut une version api
//      * @param translate_field_name Si on veut traduire les field_name en api_field_name (false pour l'usage du update_vos que la context query)
//      * @param translate_plain_obj_inside_fields_ids Si on veut traduire les plain obj à l'intérieur des fields (a priori true tout le temps, même dans le cas des context query)
//      */
//     public static default_get_api_version<T extends IDistantVOBase>(e: T, translate_field_name: boolean = true, translate_plain_obj_inside_fields_ids: boolean = true): any {
//         if (!e) {
//             return null;
//         }

//         let table = VOsTypesManager.moduleTables_by_voType[e._type];
//         if ((!e._type) || !table) {
//             return cloneDeep(e);
//         }

//         let res = {};
//         if (!table.fields_) {
//             return cloneDeep(e);
//         }

//         res['_type'] = e._type;
//         res['id'] = e.id;

//         // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
//         //  pour réduire au max l'objet envoyé, et l'offusquer un peu
//         let fieldIdToAPIMap: { [field_name: string]: string } = table.getFieldIdToAPIMap();

//         /**
//          * Cas des matroids, on ignore les champs du matroid dans ce cas, on recréera le matroid de l'autre côté via l'index
//          *  et par contre on crée un field fictif _api_only_index avec l'index dedans
//          */
//         let ignore_fields: { [field_name: string]: boolean } = {};
//         if (table.isMatroidTable) {
//             let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
//             for (let i in ignore_fields_) {
//                 let ignore_field_ = ignore_fields_[i];
//                 ignore_fields[ignore_field_.field_name] = true;
//             }
//             res['_api_only_index'] = (e as any as VarDataBaseVO).index;
//         }

//         for (let i in table.fields_) {
//             let field = table.fields_[i];

//             if (field.is_readonly) {
//                 continue;
//             }

//             if (ignore_fields[field.field_name]) {
//                 continue;
//             }

//             let new_id = translate_field_name ? fieldIdToAPIMap[field.field_name] : field.field_name;
//             res[new_id] = table.default_get_field_api_version(e[field.field_name], field, translate_plain_obj_inside_fields_ids);
//         }

//         return res;
//     }

//     /**
//      * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
//      * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
//      */
//     public static default_from_api_version<T extends IDistantVOBase>(e: any): T {
//         if (e == null) {
//             return null;
//         }

//         let table = VOsTypesManager.moduleTables_by_voType[e._type];
//         if ((!e._type) || !table) {
//             return cloneDeep(e);
//         }

//         let res: T = table.getNewVO();

//         if ((!table.fields_) || (!res)) {
//             return cloneDeep(e);
//         }

//         res['_type'] = e._type;
//         res['id'] = e.id;

//         // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
//         //  pour réduire au max l'objet envoyé, et l'offusquer un peu
//         let fieldIdToAPIMap: { [field_name: string]: string } = table.getFieldIdToAPIMap();

//         /**
//          * Cas des matroids, on recrée le matroid de l'autre côté via l'index dans _api_only_index
//          */
//         let ignore_fields: { [field_name: string]: boolean } = {};
//         if (table.isMatroidTable && !!e['_api_only_index']) {
//             let a: T = MatroidIndexHandler.from_normalized_vardata(e['_api_only_index']) as any as T;
//             a._type = res._type;
//             a.id = res.id;
//             res = a;
//             let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
//             for (let i in ignore_fields_) {
//                 let ignore_field_ = ignore_fields_[i];
//                 ignore_fields[ignore_field_.field_name] = true;
//             }
//         }

//         for (let i in table.fields_) {
//             let field = table.fields_[i];

//             if (field.is_readonly) {
//                 continue;
//             }

//             if (ignore_fields[field.field_name]) {
//                 continue;
//             }

//             let old_id = fieldIdToAPIMap[field.field_name];
//             res[field.field_name] = table.default_field_from_api_version(e[old_id], field);
//         }

//         /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
//         if (!!res[reflect<IIsServerField>().is_server]) {
//             res[reflect<IIsServerField>().is_server] = false;
//         }

//         return res;
//     }

//     private static UID: number = 1;
//     private static OFFUSC_IDs = [
//         'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
//         'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
//         'w', 'x', 'y', 'z',
//         'a0', 'b0', 'c0', 'd0', 'e0', 'f0', 'g0', 'h0', 'i0', 'j0', 'k0',
//         'l0', 'm0', 'n0', 'o0', 'p0', 'q0', 'r0', 's0', 't0', 'u0', 'v0',
//         'w0', 'x0', 'y0', 'z0',
//         'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1',
//         'l1', 'm1', 'n1', 'o1', 'p1', 'q1', 'r1', 's1', 't1', 'u1', 'v1',
//         'w1', 'x1', 'y1', 'z1',
//         'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2', 'k2',
//         'l2', 'm2', 'n2', 'o2', 'p2', 'q2', 'r2', 's2', 't2', 'u2', 'v2',
//         'w2', 'x2', 'y2', 'z2',
//         'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3', 'k3',
//         'l3', 'm3', 'n3', 'o3', 'p3', 'q3', 'r3', 's3', 't3', 'u3', 'v3',
//         'w3', 'x3', 'y3', 'z3',
//         'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4', 'j4', 'k4',
//         'l4', 'm4', 'n4', 'o4', 'p4', 'q4', 'r4', 's4', 't4', 'u4', 'v4',
//         'w4', 'x4', 'y4', 'z4',
//         'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5', 'j5', 'k5',
//         'l5', 'm5', 'n5', 'o5', 'p5', 'q5', 'r5', 's5', 't5', 'u5', 'v5',
//         'w5', 'x5', 'y5', 'z5',
//         'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6', 'j6', 'k6',
//         'l6', 'm6', 'n6', 'o6', 'p6', 'q6', 'r6', 's6', 't6', 'u6', 'v6',
//         'w6', 'x6', 'y6', 'z6',
//         'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7', 'j7', 'k7',
//         'l7', 'm7', 'n7', 'o7', 'p7', 'q7', 'r7', 's7', 't7', 'u7', 'v7',
//         'w7', 'x7', 'y7', 'z7',
//         'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8', 'j8', 'k8',
//         'l8', 'm8', 'n8', 'o8', 'p8', 'q8', 'r8', 's8', 't8', 'u8', 'v8',
//         'w8', 'x8', 'y8', 'z8',
//         'a9', 'b9', 'c9', 'd9', 'e9', 'f9', 'g9', 'h9', 'i9', 'j9', 'k9',
//         'l9', 'm9', 'n9', 'o9', 'p9', 'q9', 'r9', 's9', 't9', 'u9', 'v9',
//         'w9', 'x9', 'y9', 'z9',
//         'a_', 'b_', 'c_', 'd_', 'e_', 'f_', 'g_', 'h_', 'i_', 'j_', 'k_',
//         'l_', 'm_', 'n_', 'o_', 'p_', 'q_', 'r_', 's_', 't_', 'u_', 'v_',
//         'w_', 'x_', 'y_', 'z_',
//     ];

//     private static getNextUID(): number {
//         return ModuleTableVO.UID++;
//     }

//     /**
//      * Local thread cache -----
//      */

//     public table_name: string;
//     public full_name: string;
//     public uid: string;

//     /**
//      * Infos liées à la segmentation d'une table
//      *  Techniquement on a un segment_type déclaré sur le field directement, mais on imagine un cas de segmentation
//      *      de table de log à la journée, le log est segmenté à la seconde par contre, donc les segmentations sont différentiés
//      *  En revanche en théorie le range_type se déduit du type du field sur lequel on segmente, donc on le set automatiquement et
//      *      on garde lisible juste pour trace et éviter de refaire le switch en permanence.
//      */
//     public is_segmented: boolean = false;
//     public is_versioned: boolean = false;
//     public is_archived: boolean = false;
//     public table_segmented_field: ModuleTableFieldVO<any> = null;
//     public table_segmented_field_range_type: number = null;
//     public table_segmented_field_segment_type: number = null;

//     public hook_datatable_install: (db) => {} = null;

//     public module: Module;
//     // public fields: Array<ModuleTableFieldVO<any>>;
//     public suffix: string;
//     public prefix: string;
//     public database: string;
//     public vo_type: string;
//     public label: DefaultTranslationVO = null;

//     /**
//      * On défini les champs uniques directement sur les champs,
//      *  et on remonte ici le fait qu'on a un index unique sur un champs, et on le fait pour chaque champs unique.
//      *  On peut aussi indiquer un index unique, sur un tableau de fields, et dans ce cas on le fait directement ici
//      */
//     public uniq_indexes: Array<Array<ModuleTableFieldVO<any>>> = [];

//     /**
//      * ATTENTION : Il faut bien récupérer la valeur du forcenumeric, l'objet peut être reconstruit
//      */
//     public forceNumeric: (e: T) => T = null;
//     /**
//      * ATTENTION : Il faut bien récupérer la valeur du forcenumeric, l'objet peut être reconstruit
//      */
//     public forceNumerics: (es: T[]) => T[] = null;

//     public get_bdd_version: (e: T) => T = null;

//     public default_label_field: ModuleTableFieldVO<any> = null;
//     public table_label_function: (vo: T) => string = null;
//     public table_label_function_field_names_deps: string[] = null;
//     public importable: boolean = false;
//     public isModuleParamTable: boolean = false;

//     public inherit_rights_from_vo_type: string = null;

//     public isMatroidTable: boolean = false;

//     public any_to_many_default_behaviour_show: boolean = true;

//     public voConstructor: () => T = null;

//     /**
//      * Mappings de traduction d'un Vo de ce type vers un Vo du type b
//      *  Par défaut il faut lever une erreur si on cherche un mapping undefined
//      *  et si on veut rien mapper de particulier mais permettre le mapping, mettre {}
//      *  le mapping sera fait à l'identique
//      */
//     public mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_name_a: string]: string } } = {};

//     private vo_interfaces: { [interface_name: string]: boolean } = {};

//     private fields_: Array<ModuleTableFieldVO<any>> = [];
//     private fields_by_ids: { [field_name: string]: ModuleTableFieldVO<any> } = {};
//     private readonlyfields_by_ids: { [field_name: string]: ModuleTableFieldVO<any> } = {};

//     private sortedFields: Array<ModuleTableFieldVO<any>> = [];

//     private fieldIdToAPIMap: { [field_name: string]: string } = null;
//     /**
//      * ----- Local thread cache
//      */

//     constructor(
//         tmp_module: Module,
//         tmp_vo_type: string,
//         voConstructor: () => T,
//         tmp_fields: Array<ModuleTableFieldVO<any>>,
//         default_label_field: ModuleTableFieldVO<any>,
//         label: string | DefaultTranslationVO = null
//     ) {

//         this.voConstructor = voConstructor;

//         this.default_label_field = default_label_field;
//         this.forceNumeric = ModuleTableVO.defaultforceNumeric;
//         this.forceNumerics = ModuleTableVO.defaultforceNumerics;

//         this.get_bdd_version = this.default_get_bdd_version;

//         this.vo_type = tmp_vo_type;
//         this.module = tmp_module;

//         if (this.module && this.module.name) {
//             this.set_bdd_suffix_prefix_table_name(this.module.name, this.vo_type, "module");
//         }

//         if (!label) {
//             label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: this.name });
//         }
//         if (typeof label === "string") {
//             label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: label });
//         } else {
//             if ((!label.default_translations) || (!label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
//                 label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION] = this.name;
//             }
//         }
//         this.label = label;

//         this.check_unicity_field_names(tmp_fields);

//         //remplis fields_ et fields_by_ids avec le champ tmp_fields
//         this.set_fields(tmp_fields);

//         if (this.module && this.module.name) {
//             this.set_bdd_ref("ref", this.module.name, this.vo_type, "module");
//         }

//         if (this.vo_type) {
//             VOsTypesManager.registerModuleTable(this);
//         }
//     }


//     /**
//      * On ne peut segmenter que sur un field de type range ou ranges pour le moment
//      *  techniquement rien n'empeche d'étendre ça à tous les autres types de données
//      */
//     public segment_on_field(field_name: string, segment_type: number): ModuleTableVO<any> {

//         let field = this.getFieldFromId(field_name);

//         switch (field.field_type) {
//             case ModuleTableFieldVO.FIELD_TYPE_file_ref:
//             case ModuleTableFieldVO.FIELD_TYPE_image_field:
//             case ModuleTableFieldVO.FIELD_TYPE_image_ref:
//             case ModuleTableFieldVO.FIELD_TYPE_html:
//             case ModuleTableFieldVO.FIELD_TYPE_html_array:
//             case ModuleTableFieldVO.FIELD_TYPE_boolean:
//             case ModuleTableFieldVO.FIELD_TYPE_password:
//             case ModuleTableFieldVO.FIELD_TYPE_email:
//             case ModuleTableFieldVO.FIELD_TYPE_string:
//             case ModuleTableFieldVO.FIELD_TYPE_file_field:
//             case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
//             case ModuleTableFieldVO.FIELD_TYPE_textarea:
//             case ModuleTableFieldVO.FIELD_TYPE_geopoint:
//             case ModuleTableFieldVO.FIELD_TYPE_string_array:
//             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
//             case ModuleTableFieldVO.FIELD_TYPE_date:
//             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
//             case ModuleTableFieldVO.FIELD_TYPE_tstz:
//             case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
//             case ModuleTableFieldVO.FIELD_TYPE_hour:
//             case ModuleTableFieldVO.FIELD_TYPE_day:
//             case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
//             case ModuleTableFieldVO.FIELD_TYPE_month:
//             case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
//             default:
//                 return null;

//             case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//                 this.table_segmented_field_range_type = HourRange.RANGE_TYPE;
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_daterange:
//             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//                 this.table_segmented_field_range_type = TSRange.RANGE_TYPE;
//                 break;
//             case ModuleTableFieldVO.FIELD_TYPE_numrange:
//             case ModuleTableFieldVO.FIELD_TYPE_enum:
//             case ModuleTableFieldVO.FIELD_TYPE_int:
//             case ModuleTableFieldVO.FIELD_TYPE_float:
//             case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
//             case ModuleTableFieldVO.FIELD_TYPE_amount:
//             case ModuleTableFieldVO.FIELD_TYPE_prct:
//             case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
//             case ModuleTableFieldVO.FIELD_TYPE_int_array:
//             case ModuleTableFieldVO.FIELD_TYPE_float_array:
//             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//                 this.table_segmented_field_range_type = NumRange.RANGE_TYPE;

//         }

//         this.is_segmented = true;
//         this.table_segmented_field = field;
//         this.table_segmented_field_segment_type = segment_type;

//         this.database = this.name;
//         this.full_name = this.database + '.' + this.name;
//         this.uid = this.database + '_' + this.name;

//         return this;
//     }


//     public get_segmented_full_name(segmented_value: number): string {

//         if (!this.is_segmented) {
//             return null;
//         }

//         let name = this.get_segmented_name(segmented_value);

//         if (!name) {
//             return null;
//         }

//         return this.database + '.' + name;
//     }

//     public get_segmented_name(segmented_value: number): string {

//         if (!this.is_segmented) {
//             return null;
//         }

//         ContextQueryInjectionCheckHandler.assert_integer(segmented_value);

//         return this.name + '_' + segmented_value.toString();
//     }

//     public get_segmented_full_name_from_vo(vo: IDistantVOBase): string {

//         if (!this.is_segmented) {
//             return null;
//         }

//         let name = this.get_segmented_name_from_vo(vo);

//         if (!name) {
//             return null;
//         }

//         return this.database + '.' + name;
//     }

//     public get_segmented_name_from_vo(vo: IDistantVOBase): string {

//         if (!this.is_segmented) {
//             return null;
//         }

//         if (!vo) {
//             return null;
//         }

//         let segmented_field_value = this.get_segmented_field_value_from_vo(vo);

//         if (!segmented_field_value) {
//             return null;
//         }

//         return this.get_segmented_name(segmented_field_value);
//     }

//     public get_segmented_field_value_from_vo(vo: IDistantVOBase): any {

//         let field_value = this.get_segmented_field_raw_value_from_vo(vo);

//         if (!field_value) {
//             return null;
//         }

//         // On doit avoir un cardinal 1 dans tous les cas, mais on check pas sinon c'est trop lourd

//         switch (this.table_segmented_field.field_type) {
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//                 return RangeHandler.getSegmentedMin(field_value as HourRange, this.table_segmented_field_segment_type);

//             case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//                 return RangeHandler.getSegmentedMin_from_ranges(field_value as HourRange[], this.table_segmented_field_segment_type);

//             case ModuleTableFieldVO.FIELD_TYPE_prct:
//             case ModuleTableFieldVO.FIELD_TYPE_int_array:
//             case ModuleTableFieldVO.FIELD_TYPE_float_array:
//             case ModuleTableFieldVO.FIELD_TYPE_daterange:
//             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//             case ModuleTableFieldVO.FIELD_TYPE_numrange:
//                 // TODO
//                 ConsoleHandler.error('Not Implemented');
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
//             case ModuleTableFieldVO.FIELD_TYPE_enum:
//             case ModuleTableFieldVO.FIELD_TYPE_int:
//                 if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
//                     return field_value;
//                 } else {
//                     ConsoleHandler.error('Not Implemented');
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_float:
//             case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
//             case ModuleTableFieldVO.FIELD_TYPE_amount:
//                 if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
//                     return Math.floor(field_value);
//                 } else {
//                     ConsoleHandler.error('Not Implemented');
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//                 return RangeHandler.getSegmentedMin_from_ranges(field_value as NumRange[], this.table_segmented_field_segment_type);
//         }

//         return null;
//     }

//     public get_segmented_field_raw_value_from_vo(vo: IDistantVOBase): any {

//         if (!this.is_segmented) {
//             return null;
//         }

//         if (!vo) {
//             return null;
//         }

//         return vo[this.table_segmented_field.field_name];
//     }

//     public get_fields(): Array<ModuleTableFieldVO<any>> {
//         return this.fields_;
//     }

//     public get_field_by_id(field_name: string): ModuleTableFieldVO<any> {
//         return this.fields_by_ids[field_name];
//     }

//     public push_field(field: ModuleTableFieldVO<any>) {
//         this.fields_.push(field);
//         this.fields_by_ids[field.field_name] = field;
//         if (field.is_readonly) {
//             this.readonlyfields_by_ids[field.field_name] = field;
//         }

//         if (field.is_unique) {
//             let found = false;
//             for (let i in this.uniq_indexes) {
//                 let index = this.uniq_indexes[i];

//                 if (index && (index.length == 1) && (index[0].field_name == field.field_name)) {
//                     found = true;
//                     break;
//                 }
//             }

//             if (!found) {
//                 this.uniq_indexes.push([field]);
//             }
//         }

//         this.set_sortedFields();
//     }

//     //remplis fields_ avec les ModuleTableFieldVO et fields_by_ids avec le ModuleTableFieldVO et leur field_name
//     public set_fields(fields: Array<ModuleTableFieldVO<any>>) {
//         this.fields_ = fields;

//         this.fields_by_ids = {};
//         this.readonlyfields_by_ids = {};
//         for (let i in this.fields_) {
//             let field = this.fields_[i];
//             this.fields_by_ids[field.field_name] = field;

//             if (field.is_readonly) {
//                 this.readonlyfields_by_ids[field.field_name] = field;
//             }

//             if (field.is_unique) {
//                 let found = false;
//                 for (let j in this.uniq_indexes) {
//                     let index = this.uniq_indexes[j];

//                     if (index && (index.length == 1) && (index[0].field_name == field.field_name)) {
//                         found = true;
//                         break;
//                     }
//                 }

//                 if (!found) {
//                     this.uniq_indexes.push([field]);
//                 }
//             }
//         }

//         this.set_sortedFields();
//     }

//     public addAlias(api_type_id_alias: string): ModuleTableVO<any> {
//         VOsTypesManager.addAlias(api_type_id_alias, this.vo_type);
//         return this;
//     }

//     /**
//      * A utiliser sur tous les params pour indiquer vers quels autres params on peut mapper des champs (pour des intersections principalement)
//      *  et sur tous les vos pour indiquer vers quels params on peut mapper des champs (pour des intersections également en base)
//      * @param mapping_by_api_type_ids
//      */
//     public set_mapping_by_api_type_ids(mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_name_a: string]: string } }): ModuleTableVO<any> {
//         this.mapping_by_api_type_ids = mapping_by_api_type_ids;
//         return this;
//     }

//     public defineAsMatroid(): ModuleTableVO<any> {
//         this.isMatroidTable = true;
//         return this;
//     }

//     public set_inherit_rights_from_vo_type(inherit_rights_from_vo_type: string): ModuleTableVO<any> {
//         this.inherit_rights_from_vo_type = inherit_rights_from_vo_type;
//         return this;
//     }

//     public hideAnyToManyByDefault(): ModuleTableVO<any> {
//         this.any_to_many_default_behaviour_show = false;
//         return this;
//     }

//     public hasVOInterface(interface_name: string): boolean {

//         return this.vo_interfaces[interface_name];
//     }

//     public defineVOInterfaces(interface_names: string[]): ModuleTableVO<any> {

//         for (let i in interface_names) {
//             let interface_name = interface_names[i];

//             this.vo_interfaces[interface_name] = true;
//         }

//         return this;
//     }

//     public define_default_label_function(
//         table_label_function: (vo: T) => string,
//         table_label_function_field_names_deps: string[]): ModuleTableVO<any> {

//         this.default_label_field = null;
//         this.table_label_function = table_label_function;
//         this.table_label_function_field_names_deps = table_label_function_field_names_deps;

//         return this;
//     }

//     public defineVOConstructor(voConstructor: () => T): ModuleTableVO<any> {
//         this.voConstructor = voConstructor;

//         return this;
//     }

//     public getNewVO(): T {
//         if (this.voConstructor) {
//             return this.voConstructor();
//         }
//         return null;
//     }

//     public defineAsModuleParamTable(): ModuleTableVO<any> {
//         this.isModuleParamTable = true;
//         return this;
//     }

//     public defineAsImportable(): ModuleTableVO<any> {

//         // Il faut créer le moduleTable des datas raws.
//         // this.registerImportableModuleTable();

//         this.importable = true;
//         return this;
//     }

//     public getFieldFromId(field_name: string): ModuleTableFieldVO<any> {
//         if (!field_name) {
//             return null;
//         }

//         return this.fields_by_ids[field_name];
//     }

//     public has_field_name(field_name: string): boolean {
//         if (!field_name) {
//             return false;
//         }

//         if (!this.fields_by_ids) {
//             return false;
//         }

//         return !!this.fields_by_ids[field_name];
//     }

//     /**
//      * On part du principe que les refs on en trouve une par type sur une table, en tout cas on renvoie la premiere
//      * @param vo_type
//      */
//     public getRefFieldFromTargetVoType(vo_type: string): ModuleTableFieldVO<any> {
//         if (!vo_type) {
//             return null;
//         }

//         for (let i in this.fields_) {
//             let field: ModuleTableFieldVO<any> = this.fields_[i];

//             if (field && field.has_relation && field.manyToOne_target_moduletable && field.manyToOne_target_moduletable.vo_type == vo_type) {
//                 return field;
//             }
//         }

//         return null;
//     }

//     get name(): string {
//         return (this.prefix ? this.prefix + "_" : "") + this.table_name + ((this.suffix != "") ? "_" + this.suffix : "");
//     }

//     public set_bdd_suffix_prefix_table_name(
//         table_name: string,
//         table_name_suffix: string = "",
//         table_name_prefix: string = "") {
//         this.table_name = table_name;
//         this.suffix = table_name_suffix;
//         this.prefix = table_name_prefix;
//     }


//     public default_get_field_api_version(e: any, field: ModuleTableFieldVO<any>, table: ModuleTableVO<any>, translate_field_name: boolean = true): any {
//         if ((!field) || (field.is_readonly)) {
//             throw new Error('Should not ask for readonly fields');
//         }

//         /**
//          * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
//          */
//         if (!!field.secure_boolean_switch_only_server_side) {
//             if (!!e) {
//                 StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_to_api.secure_boolean_switch_only_server_side", table.vo_type + '.' + field.field_name);
//             }
//             return false;
//         }

//         switch (field.field_type) {

//             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//                 return RangeHandler.translate_to_api(e);

//             case ModuleTableFieldVO.FIELD_TYPE_numrange:
//             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//                 return RangeHandler.translate_range_to_api(e);

//             case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

//                 if (e && e._type) {

//                     let trans_plain_vo_obj = e ? ModuleTableVO.default_get_api_version(e, translate_field_name) : null;
//                     return trans_plain_vo_obj ? JSON.stringify(trans_plain_vo_obj) : null;

//                 } else if ((!!e) && isArray(e)) {

//                     /**
//                      * Gestion des tableaux de plain_vo_obj
//                      */
//                     let trans_array = [];
//                     for (let i in e) {
//                         let e_ = e[i];

//                         if ((typeof e_ === 'string') && ((!e_) || (e_.indexOf('{') < 0))) {
//                             trans_array.push(e_);
//                         } else {
//                             trans_array.push(this.default_get_field_api_version(e_, field, translate_field_name));
//                         }
//                     }
//                     return JSON.stringify(trans_array);

//                 } else if (!!e) {
//                     return JSON.stringify(e);
//                 } else {
//                     return null;
//                 }

//             case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
//             case ModuleTableFieldVO.FIELD_TYPE_tstz:
//             default:
//                 return e;
//         }
//     }

//     public default_field_from_api_version(e: any, field: ModuleTableFieldVO<any>, table: ModuleTableVO<any>): any {
//         if ((!field) || field.is_readonly) {
//             throw new Error('Should no ask for readonly fields');
//         }

//         /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
//         if (field.field_name == reflect<IIsServerField>().is_server) {
//             return false;
//         }

//         /**
//          * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
//          */
//         if (!!field.secure_boolean_switch_only_server_side) {
//             if (!!e) {
//                 StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_from_api.secure_boolean_switch_only_server_side", table.vo_type + '.' + field.field_name);
//             }
//             return false;
//         }

//         switch (field.field_type) {

//             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//                 return RangeHandler.translate_from_api(NumRange.RANGE_TYPE, e);

//             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//                 return RangeHandler.translate_from_api(TSRange.RANGE_TYPE, e);

//             case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//                 return RangeHandler.translate_from_api(HourRange.RANGE_TYPE, e);

//             case ModuleTableFieldVO.FIELD_TYPE_numrange:
//                 return MatroidIndexHandler.from_normalized_range(e, NumRange.RANGE_TYPE);

//             case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//                 return MatroidIndexHandler.from_normalized_range(e, HourRange.RANGE_TYPE);

//             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//                 return MatroidIndexHandler.from_normalized_range(e, TSRange.RANGE_TYPE);

//             case ModuleTableFieldVO.FIELD_TYPE_hour:
//             case ModuleTableFieldVO.FIELD_TYPE_tstz:
//                 return ConversionHandler.forceNumber(e);

//             case ModuleTableFieldVO.FIELD_TYPE_int_array:
//             case ModuleTableFieldVO.FIELD_TYPE_float_array:
//                 if (Array.isArray(e)) {
//                     return e;
//                 }

//                 if (!e || (e == '{}')) {
//                     return null;
//                 }

//                 let res: any[] = (e.length > 2) ? e.substr(1, e.length - 2).split(',') : e;

//                 if (res && res.length) {
//                     for (let i in res) {
//                         res[i] = ConversionHandler.forceNumber(res[i]);
//                     }
//                 }

//                 return res;

//             case ModuleTableFieldVO.FIELD_TYPE_string_array:
//             case ModuleTableFieldVO.FIELD_TYPE_html_array:
//                 if (Array.isArray(e)) {
//                     return e;
//                 }

//                 if (!e || (e == '{}')) {
//                     return null;
//                 }

//                 return (e.length > 2) ? e.substr(1, e.length - 2).split(',') : e;

//             case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

//                 if ((e == null) || (e == '{}')) {
//                     return null;
//                 }

//                 let trans_ = ObjectHandler.try_get_json(e);
//                 if (!!trans_) {

//                     /**
//                      * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
//                      */
//                     if (isArray(trans_)) {
//                         let new_array = [];
//                         for (let i in trans_) {
//                             let transi = trans_[i];
//                             new_array.push(ModuleTableVO.default_from_api_version(ObjectHandler.try_get_json(transi)));
//                         }
//                         trans_ = new_array;
//                     } else {

//                         /**
//                          * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
//                          */
//                         let elt_type = trans_ ? trans_._type : null;

//                         let field_table = elt_type ? VOsTypesManager.moduleTables_by_voType[elt_type] : null;
//                         if (!field_table) {
//                             let new_obj = new Object();
//                             for (let i in trans_) {
//                                 let transi = trans_[i];
//                                 new_obj[i] = ModuleTableVO.default_from_api_version(ObjectHandler.try_get_json(transi));
//                             }
//                             trans_ = new_obj;
//                         } else {
//                             trans_ = Object.assign(field_table.voConstructor(), ModuleTableVO.default_from_api_version(trans_));
//                         }
//                     }
//                 }
//                 return trans_;

//             case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

//                 if (!e || (e == '{}')) {
//                     return null;
//                 }

//                 if ((e === null) || (typeof e === 'undefined')) {
//                     return e;
//                 } else {
//                     return (e as string[]).map((ts: string) => ConversionHandler.forceNumber(ts));
//                 }

//             default:
//                 return e;
//         }
//     }

//     /**
//      * Traduire le champs field.field_name de src_vo dans dest_vo. Possibilité de fournir un alias qui sera utilisé pour retrouver le champs dans la source et la destination
//      * @param field le descriptif du champs à traduire
//      * @param src_vo le vo source
//      * @param dest_vo le vo de destination de la traduction (potentiellement le même que src_vo)
//      * @param field_alias optionnel. Permet de définir un nom de champs différent du field_name utilisé dans le src_vo et le dest_vo typiquement en résultat d'un contextquery
//      */
//     public force_numeric_field(field: ModuleTableFieldVO<any>, src_vo: any, dest_vo: any, field_alias: string = null) {

//         if (field.is_readonly) {
//             return;
//         }

//         let field_name = field_alias ? field_alias : field.field_name;
//         let field_value = src_vo[field_name.toLowerCase()] ? src_vo[field_name.toLowerCase()] : src_vo[field_name];

//         if ((typeof field_value == 'undefined') || (field_value === null)) {
//             return;
//         }

//         switch (field.field_type) {

//             case ModuleTableFieldVO.FIELD_TYPE_string_array:
//             case ModuleTableFieldVO.FIELD_TYPE_html_array:
//                 if (Array.isArray(field_value)) {
//                     dest_vo[field_name] = field_value;
//                 } else {
//                     dest_vo[field_name] = (field_value.length > 2) ? field_value.substr(1, field_value.length - 2).split(',') : field_value;
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_float:
//             case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
//             case ModuleTableFieldVO.FIELD_TYPE_amount:
//             case ModuleTableFieldVO.FIELD_TYPE_file_ref:
//             case ModuleTableFieldVO.FIELD_TYPE_image_ref:
//             case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
//             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
//             case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
//             case ModuleTableFieldVO.FIELD_TYPE_int:
//             case ModuleTableFieldVO.FIELD_TYPE_enum:
//             case ModuleTableFieldVO.FIELD_TYPE_prct:

//             case ModuleTableFieldVO.FIELD_TYPE_hour:
//             case ModuleTableFieldVO.FIELD_TYPE_tstz:
//                 dest_vo[field_name] = ConversionHandler.forceNumber(field_value);
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_float_array:
//                 dest_vo[field_name] = field_value.map(Number);
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_int_array:
//                 dest_vo[field_name] = field_value.map(Number);
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_numrange:
//                 let field_index_n = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
//                 if (field_index_n != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_n, NumRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.parseRangeBDD(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
//                 }
//                 break;
//             case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//                 let field_index_t = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
//                 if (field_index_t != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_t, TSRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.parseRangeBDD(TSRange.RANGE_TYPE, field_value, (field.segmentation_type ? field.segmentation_type : TimeSegment.TYPE_SECOND));
//                 }
//                 break;
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//                 let field_index_h = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
//                 if (field_index_h != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.parseRangeBDD(HourRange.RANGE_TYPE, field_value, HourSegment.TYPE_SECOND);
//                 }
//                 break;


//             case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//             case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//                 let field_index_ns = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
//                 if (field_index_ns != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_ns, NumRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.translate_from_bdd(NumRange.RANGE_TYPE, field_value, NumSegment.TYPE_INT);
//                 }
//                 break;
//             case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//                 let field_index_ts = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
//                 if (field_index_ts != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_ts, TSRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.translate_from_bdd(TSRange.RANGE_TYPE, field_value, field.segmentation_type);
//                 }
//                 break;
//             case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//                 let field_index_hs = src_vo[field_name.toLowerCase() + '_ndx'] ? src_vo[field_name.toLowerCase() + '_ndx'] : src_vo[field_name + '_ndx'];
//                 // TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
//                 // KEEP dest_vo[field_name] = MatroidIndexHandler.from_normalized_range(field_index_h, HourRange.RANGE_TYPE);
//                 if (field_index_hs != null) {
//                     dest_vo[field_name] = MatroidIndexHandler.from_normalized_ranges(field_index_hs, HourRange.RANGE_TYPE);
//                 } else {
//                     dest_vo[field_name] = RangeHandler.translate_from_bdd(HourRange.RANGE_TYPE, field_value, field.segmentation_type);
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_day:
//             case ModuleTableFieldVO.FIELD_TYPE_date:
//             case ModuleTableFieldVO.FIELD_TYPE_month:
//                 dest_vo[field_name] = DateHandler.getInstance().formatDayForIndex(moment(field_value).utc(true).unix());
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
//                 if (!((field_value === null) || (typeof field_value === 'undefined'))) {
//                     dest_vo[field_name] = field_value.map((ts: string) => ConversionHandler.forceNumber(ts));
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_geopoint:
//                 if (field_value) {
//                     dest_vo[field_name] = GeoPointVO.clone(field_value);
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_email:
//                 if (field_value && field_value.trim) {
//                     dest_vo[field_name] = field_value.trim();
//                 }
//                 break;

//             case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
//                 let trans_ = ObjectHandler.try_get_json(field_value);

//                 if (!!trans_) {

//                     /**
//                      * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
//                      */
//                     if (isArray(trans_)) {
//                         trans_ = ModuleTableVO.defaultforceNumerics(trans_);
//                     } else {

//                         /**
//                          * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
//                          */
//                         let elt_type = trans_ ? trans_._type : null;

//                         let field_table = elt_type ? VOsTypesManager.moduleTables_by_voType[elt_type] : null;
//                         if (!field_table) {
//                             let new_obj = new Object();
//                             for (let i in trans_) {
//                                 let transi_ = trans_[i];
//                                 new_obj[i] = ModuleTableVO.defaultforceNumeric(ObjectHandler.try_get_json(transi_));
//                             }
//                             trans_ = new_obj;
//                         } else {
//                             trans_ = Object.assign(field_table.voConstructor(), ModuleTableVO.defaultforceNumeric(trans_));
//                         }
//                     }
//                 }
//                 dest_vo[field_name] = trans_;
//                 break;

//             default:
//                 dest_vo[field_name] = field_value;
//                 break;
//         }
//     }

//     public set_bdd_ref(
//         database_name: string,
//         table_name: string,
//         table_name_suffix: string = "",
//         table_name_prefix: string = "") {

//         if ((!database_name) || (!table_name)) {
//             return;
//         }

//         // Si la base est segmentée, interdiction de modifier les liaisons
//         if (this.is_segmented) {
//             return null;
//         }

//         this.set_bdd_suffix_prefix_table_name(table_name, table_name_suffix, table_name_prefix);
//         this.database = database_name;

//         this.full_name = this.database + '.' + this.name;
//         this.uid = this.database + '_' + this.name;

//         for (let i in this.fields_) {
//             this.fields_[i].setTargetDatatable(this);
//         }

//         this.label.code_text = "fields.labels." + this.full_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
//         DefaultTranslationManager.registerDefaultTranslation(this.label);
//     }

//     public set_is_archived(): ModuleTableVO<any> {
//         this.is_archived = true;

//         this.push_field((ModuleTableFieldController.create_new(field_names<>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true, true, false)).setModuleTable(this));

//         return this;
//     }

//     /**
//      * A voir si dirty et nécessite refonte mais ça semble bien suffisant et très simple/rapide
//      */
//     private getFieldIdToAPIMap(): { [field_name: string]: string } {

//         if (this.fieldIdToAPIMap) {
//             return this.fieldIdToAPIMap;
//         }

//         let res: { [field_name: string]: string } = {};
//         let n = 0;

//         for (let i in this.sortedFields) {
//             let field = this.sortedFields[i];

//             res[field.field_name] = ModuleTableVO.OFFUSC_IDs[n];
//             n++;
//         }

//         this.fieldIdToAPIMap = res;
//         return this.fieldIdToAPIMap;
//     }

//     // /**
//     //  * A voir si dirty et nécessite refonte mais ça semble bien suffisant et très simple/rapide
//     //  */
//     // private getAPIToFieldIdMap(): { [api_id: string]: string } {
//     //     let res: { [api_id: string]: string } = {};
//     //     let n = 0;

//     //     for (let i in this.sortedFields) {
//     //         let field = this.sortedFields[i];

//     //         res[ModuleTableVO.OFFUSC_IDs[n]] = field.field_name;
//     //         n++;
//     //     }

//     //     return res;
//     // }

//     /**
//      * Permet de récupérer un clone dont les fields sont insérables en bdd.
//      * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec le format de la BDD
//      * @param e Le VO dont on veut une version insérable en BDD
//      * @param inside_plain_vo_obj  pour indiquer si on est dans un plain_vo ou sur des champs directement stockés en BDD. ça change a minima le format des string[] qui en base est pas ["",""] mais {"",""}
//      */
//     private default_get_bdd_version(e: T, inside_plain_vo_obj: boolean = false): T {
//         if (!e) {
//             return null;
//         }

//         let res = cloneDeep(e);

//         if (!this.fields_) {
//             return res;
//         }

//         for (let i in this.fields_) {
//             let field = this.fields_[i];

//             switch (field.field_type) {

//                 case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
//                 case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
//                 case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
//                 case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
//                 case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
//                     res[field.field_name + '_ndx'] = MatroidIndexHandler.get_normalized_ranges(res[field.field_name] as IRange[]);
//                     res[field.field_name] = RangeHandler.translate_to_bdd(res[field.field_name]);
//                     break;

//                 case ModuleTableFieldVO.FIELD_TYPE_numrange:
//                 case ModuleTableFieldVO.FIELD_TYPE_tsrange:
//                 case ModuleTableFieldVO.FIELD_TYPE_hourrange:
//                     res[field.field_name + '_ndx'] = MatroidIndexHandler.get_normalized_range(res[field.field_name] as IRange);
//                     res[field.field_name] = RangeHandler.translate_range_to_bdd(res[field.field_name]);
//                     break;

//                 case ModuleTableFieldVO.FIELD_TYPE_geopoint:
//                     if (res[field.field_name]) {
//                         res[field.field_name] = GeoPointHandler.getInstance().format(res[field.field_name]);
//                     }
//                     break;

//                 case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
//                     if (e[field.field_name] && e[field.field_name]._type) {
//                         let field_table = VOsTypesManager.moduleTables_by_voType[e[field.field_name]._type];

//                         let trans_ = e[field.field_name] ? field_table.default_get_bdd_version(e[field.field_name], true) : null;
//                         res[field.field_name] = trans_ ? JSON.stringify(trans_) : null;
//                     } else if (e[field.field_name]) {
//                         res[field.field_name] = JSON.stringify(e[field.field_name]);
//                     } else {
//                         res[field.field_name] = null;
//                     }
//                     break;

//                 case ModuleTableFieldVO.FIELD_TYPE_email:
//                     if (res[field.field_name] && res[field.field_name].trim) {
//                         res[field.field_name] = res[field.field_name].trim();
//                     }
//                     break;

//                 case ModuleTableFieldVO.FIELD_TYPE_float_array:
//                 case ModuleTableFieldVO.FIELD_TYPE_int_array:
//                 case ModuleTableFieldVO.FIELD_TYPE_string_array:
//                     // ATTENTION - INTERDITION DE METTRE UNE VIRGULE DANS UN CHAMP DE TYPE ARRAY SINON CA FAIT X VALEURS
//                     if (res[field.field_name]) {
//                         let values: any[] = [];

//                         for (let j in res[field.field_name]) {
//                             if (res[field.field_name][j]) {
//                                 values.push(res[field.field_name][j]);
//                             }
//                         }

//                         if (!values || !values.length) {
//                             res[field.field_name] = null;
//                         } else {
//                             res[field.field_name] = inside_plain_vo_obj ? '[' + values.join(',') + ']' : '{' + values.join(',') + '}';
//                         }
//                     }

//                     break;

//                 default:
//             }
//         }

//         return res;
//     }

//     private set_sortedFields() {
//         this.sortedFields = Array.from(this.fields_);

//         this.sortedFields.sort((a: ModuleTableFieldVO<any>, b: ModuleTableFieldVO<any>) => {
//             if (a.field_name < b.field_name) {
//                 return -1;
//             }
//             if (a.field_name > b.field_name) {
//                 return 1;
//             }
//             return 0;
//         });
//     }


//     private check_unicity_field_names(tmp_fields: Array<ModuleTableFieldVO<any>>) {
//         let field_names: { [field_name: string]: boolean } = {};

//         for (let i in tmp_fields) {
//             let field = tmp_fields[i];

//             if (field_names[field.field_name]) {
//                 ConsoleHandler.error('Field name ' + field.field_name + ' already exists in table ' + this.name);
//                 throw new Error('Field name ' + field.field_name + ' already exists in table ' + this.name);
//             }

//             field_names[field.field_name] = true;
//         }
//     }
// }
import { cloneDeep, isArray } from 'lodash';
import ObjectHandler, { field_names, reflect } from '../../../tools/ObjectHandler';
import IArchivedVOBase from '../../IArchivedVOBase';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import ConversionHandler from '../../../tools/ConversionHandler';
import GeoPointHandler from '../../../tools/GeoPointHandler';
import MatroidIndexHandler from '../../../tools/MatroidIndexHandler';
import RangeHandler from '../../../tools/RangeHandler';
import ContextQueryInjectionCheckHandler from '../../ContextFilter/ContextQueryInjectionCheckHandler';
import IRange from '../../DataRender/interfaces/IRange';
import HourRange from '../../DataRender/vos/HourRange';
import NumRange from '../../DataRender/vos/NumRange';
import NumSegment from '../../DataRender/vos/NumSegment';
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';
import IIsServerField from '../../IIsServerField';
import MatroidController from '../../Matroid/MatroidController';
import Module from '../../Module';
import StatsController from '../../Stats/StatsController';
import DefaultTranslationManager from '../../Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import VarDataBaseVO from '../../Var/vos/VarDataBaseVO';
import ModuleTableFieldController from '../ModuleTableFieldController';
import ModuleTableFieldVO from './ModuleTableFieldVO';


export default class ModuleTableVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "module_table";

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     * @param translate_field_id Si on veut traduire les field_id en api_field_id (false pour l'usage du update_vos que la context query)
     * @param translate_plain_obj_inside_fields_ids Si on veut traduire les plain obj à l'intérieur des fields (a priori true tout le temps, même dans le cas des context query)
     */
    public static default_get_api_version<T extends IDistantVOBase>(e: T, translate_field_id: boolean = true, translate_plain_obj_inside_fields_ids: boolean = true): any {
        if (!e) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res = {};
        if (!table.fields_) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on ignore les champs du matroid dans ce cas, on recréera le matroid de l'autre côté via l'index
         *  et par contre on crée un field fictif _api_only_index avec l'index dedans
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable) {
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
            res['_api_only_index'] = (e as any as VarDataBaseVO).index;
        }

        for (let i in table.fields_) {
            let field = table.fields_[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let new_id = translate_field_id ? fieldIdToAPIMap[field.field_id] : field.field_id;
            res[new_id] = table.default_get_field_api_version(e[field.field_id], field, translate_plain_obj_inside_fields_ids);
        }

        return res;
    }

    /**
     * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
     * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
     */
    public static default_from_api_version<T extends IDistantVOBase>(e: any): T {
        if (e == null) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res: T = table.getNewVO();

        if ((!table.fields_) || (!res)) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on recrée le matroid de l'autre côté via l'index dans _api_only_index
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable && !!e['_api_only_index']) {
            let a: T = MatroidIndexHandler.from_normalized_vardata(e['_api_only_index']) as any as T;
            a._type = res._type;
            a.id = res.id;
            res = a;
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
        }

        for (let i in table.fields_) {
            let field = table.fields_[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let old_id = fieldIdToAPIMap[field.field_id];
            res[field.field_id] = table.default_field_from_api_version(e[old_id], field);
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (!!res[reflect<IIsServerField>().is_server]) {
            res[reflect<IIsServerField>().is_server] = false;
        }

        return res;
    }

    private static UID: number = 1;

    private static getNextUID(): number {
        return ModuleTableVO.UID++;
    }

    public id: number;
    public _type: string = ModuleTableFieldVO.API_TYPE_ID;

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
    public is_versioned: boolean = false;
    public is_archived: boolean = false;
    public table_segmented_field: ModuleTableFieldVO = null;
    public table_segmented_field_range_type: number = null;
    public table_segmented_field_segment_type: number = null;

    public hook_datatable_install: (db) => {} = null;

    public module: Module;
    // public fields: ModuleTableFieldVO[];
    public suffix: string;
    public prefix: string;
    public database: string;
    public vo_type: string;
    public label: DefaultTranslationVO = null;

    /**
     * ATTENTION : Il faut bien récupérer la valeur du forcenumeric, l'objet peut être reconstruit
     */
    public forceNumeric: (e: T) => T = null;
    /**
     * ATTENTION : Il faut bien récupérer la valeur du forcenumeric, l'objet peut être reconstruit
     */
    public forceNumerics: (es: T[]) => T[] = null;

    public get_bdd_version: (e: T) => T = null;

    public default_label_field: ModuleTableFieldVO = null;
    public table_label_function: (vo: T) => string = null;
    public table_label_function_field_ids_deps: string[] = null;
    public importable: boolean = false;
    public isModuleParamTable: boolean = false;

    public inherit_rights_from_vo_type: string = null;

    public isMatroidTable: boolean = false;

    public any_to_many_default_behaviour_show: boolean = true;

    public voConstructor: () => T = null;

    /**
     * Mappings de traduction d'un Vo de ce type vers un Vo du type b
     *  Par défaut il faut lever une erreur si on cherche un mapping undefined
     *  et si on veut rien mapper de particulier mais permettre le mapping, mettre {}
     *  le mapping sera fait à l'identique
     */
    public mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_id_a: string]: string } } = {};

    private vo_interfaces: { [interface_name: string]: boolean } = {};
    /**
     * ----- Local thread cache
     */

    constructor(
        tmp_module: Module,
        tmp_vo_type: string,
        voConstructor: () => T,
        tmp_fields: ModuleTableFieldVO[],
        default_label_field: ModuleTableFieldVO,
        label: string | DefaultTranslationVO = null
    ) {

        this.voConstructor = voConstructor;

        this.default_label_field = default_label_field;
        this.get_bdd_version = this.default_get_bdd_version;

        this.vo_type = tmp_vo_type;
        this.module = tmp_module;

        if (this.module && this.module.name) {
            this.set_bdd_suffix_prefix_table_name(this.module.name, this.vo_type, "module");
        }

        if (!label) {
            label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: this.name });
        }
        if (typeof label === "string") {
            label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: label });
        } else {
            if ((!label.default_translations) || (!label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION] = this.name;
            }
        }
        this.label = label;

        this.check_unicity_field_names(tmp_fields);

        //remplis fields_ et fields_by_ids avec le champ tmp_fields
        this.set_fields(tmp_fields);

        if (this.module && this.module.name) {
            this.set_bdd_ref("ref", this.module.name, this.vo_type, "module");
        }

        if (this.vo_type) {
            VOsTypesManager.registerModuleTable(this);
        }
    }


    /**
     * On ne peut segmenter que sur un field de type range ou ranges pour le moment
     *  techniquement rien n'empeche d'étendre ça à tous les autres types de données
     */
    public segment_on_field(field_id: string, segment_type: number): ModuleTableVO {

        let field = this.getFieldFromId(field_id);

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            default:
                return null;

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                this.table_segmented_field_range_type = HourRange.RANGE_TYPE;
                break;

            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                this.table_segmented_field_range_type = TSRange.RANGE_TYPE;
                break;
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
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


    public get_segmented_full_name(segmented_value: number): string {

        if (!this.is_segmented) {
            return null;
        }

        let name = this.get_segmented_name(segmented_value);

        if (!name) {
            return null;
        }

        return this.database + '.' + name;
    }

    public get_segmented_name(segmented_value: number): string {

        if (!this.is_segmented) {
            return null;
        }

        ContextQueryInjectionCheckHandler.assert_integer(segmented_value);

        return this.name + '_' + segmented_value.toString();
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

        let field_value = this.get_segmented_field_raw_value_from_vo(vo);

        if (!field_value) {
            return null;
        }

        // On doit avoir un cardinal 1 dans tous les cas, mais on check pas sinon c'est trop lourd

        switch (this.table_segmented_field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return RangeHandler.getSegmentedMin(field_value as HourRange, this.table_segmented_field_segment_type);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return RangeHandler.getSegmentedMin_from_ranges(field_value as HourRange[], this.table_segmented_field_segment_type);

            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                // TODO
                ConsoleHandler.error('Not Implemented');
                break;

            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_int:
                if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
                    return field_value;
                } else {
                    ConsoleHandler.error('Not Implemented');
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
                if (this.table_segmented_field_segment_type == NumSegment.TYPE_INT) {
                    return Math.floor(field_value);
                } else {
                    ConsoleHandler.error('Not Implemented');
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                return RangeHandler.getSegmentedMin_from_ranges(field_value as NumRange[], this.table_segmented_field_segment_type);
        }

        return null;
    }

    public get_segmented_field_raw_value_from_vo(vo: IDistantVOBase): any {

        if (!this.is_segmented) {
            return null;
        }

        if (!vo) {
            return null;
        }

        return vo[this.table_segmented_field.field_id];
    }

    public get_field_by_id(field_id: string): ModuleTableFieldVO {
        return this.fields_by_ids[field_id];
    }

    public push_field(field: ModuleTableFieldVO) {
        this.fields_.push(field);
        this.fields_by_ids[field.field_id] = field;
        if (field.is_readonly) {
            this.readonlyfields_by_ids[field.field_id] = field;
        }

        if (field.is_unique) {
            let found = false;
            for (let i in this.uniq_indexes) {
                let index = this.uniq_indexes[i];

                if (index && (index.length == 1) && (index[0].field_id == field.field_id)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                this.uniq_indexes.push([field]);
            }
        }

        this.set_sortedFields();
    }

    //remplis fields_ avec les ModuleTableFieldVO et fields_by_ids avec le ModuleTableFieldVO et leur field_id
    public set_fields(fields: ModuleTableFieldVO[]) {
        this.fields_ = fields;

        this.fields_by_ids = {};
        this.readonlyfields_by_ids = {};
        for (let i in this.fields_) {
            let field = this.fields_[i];
            this.fields_by_ids[field.field_id] = field;

            if (field.is_readonly) {
                this.readonlyfields_by_ids[field.field_id] = field;
            }

            if (field.is_unique) {
                let found = false;
                for (let j in this.uniq_indexes) {
                    let index = this.uniq_indexes[j];

                    if (index && (index.length == 1) && (index[0].field_id == field.field_id)) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this.uniq_indexes.push([field]);
                }
            }
        }

        this.set_sortedFields();
    }

    public addAlias(api_type_id_alias: string): ModuleTableVO {
        VOsTypesManager.addAlias(api_type_id_alias, this.vo_type);
        return this;
    }

    /**
     * A utiliser sur tous les params pour indiquer vers quels autres params on peut mapper des champs (pour des intersections principalement)
     *  et sur tous les vos pour indiquer vers quels params on peut mapper des champs (pour des intersections également en base)
     * @param mapping_by_api_type_ids
     */
    public set_mapping_by_api_type_ids(mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_id_a: string]: string } }): ModuleTableVO {
        this.mapping_by_api_type_ids = mapping_by_api_type_ids;
        return this;
    }

    public defineAsMatroid(): ModuleTableVO {
        this.isMatroidTable = true;
        return this;
    }

    public set_inherit_rights_from_vo_type(inherit_rights_from_vo_type: string): ModuleTableVO {
        this.inherit_rights_from_vo_type = inherit_rights_from_vo_type;
        return this;
    }

    public hideAnyToManyByDefault(): ModuleTableVO {
        this.any_to_many_default_behaviour_show = false;
        return this;
    }

    public hasVOInterface(interface_name: string): boolean {

        return this.vo_interfaces[interface_name];
    }

    public defineVOInterfaces(interface_names: string[]): ModuleTableVO {

        for (let i in interface_names) {
            let interface_name = interface_names[i];

            this.vo_interfaces[interface_name] = true;
        }

        return this;
    }

    public define_default_label_function(
        table_label_function: (vo: T) => string,
        table_label_function_field_ids_deps: string[]): ModuleTableVO {

        this.default_label_field = null;
        this.table_label_function = table_label_function;
        this.table_label_function_field_ids_deps = table_label_function_field_ids_deps;

        return this;
    }

    public defineVOConstructor(voConstructor: () => T): ModuleTableVO {
        this.voConstructor = voConstructor;

        return this;
    }

    public getNewVO(): T {
        if (this.voConstructor) {
            return this.voConstructor();
        }
        return null;
    }

    public defineAsModuleParamTable(): ModuleTableVO {
        this.isModuleParamTable = true;
        return this;
    }

    public defineAsImportable(): ModuleTableVO {

        // Il faut créer le moduleTable des datas raws.
        // this.registerImportableModuleTable();

        this.importable = true;
        return this;
    }

    public getFieldFromId(field_id: string): ModuleTableFieldVO {
        if (!field_id) {
            return null;
        }

        return this.fields_by_ids[field_id];
    }

    public has_field_id(field_id: string): boolean {
        if (!field_id) {
            return false;
        }

        if (!this.fields_by_ids) {
            return false;
        }

        return !!this.fields_by_ids[field_id];
    }

    /**
     * On part du principe que les refs on en trouve une par type sur une table, en tout cas on renvoie la premiere
     * @param vo_type
     */
    public getRefFieldFromTargetVoType(vo_type: string): ModuleTableFieldVO {
        if (!vo_type) {
            return null;
        }

        for (let i in this.fields_) {
            let field: ModuleTableFieldVO = this.fields_[i];

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


    public default_get_field_api_version(e: any, field: ModuleTableFieldVO, table: ModuleTableVO, translate_field_id: boolean = true): any {
        if ((!field) || (field.is_readonly)) {
            throw new Error('Should not ask for readonly fields');
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (!!field.secure_boolean_switch_only_server_side) {
            if (!!e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_to_api.secure_boolean_switch_only_server_side", table.vo_type + '.' + field.field_id);
            }
            return false;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return RangeHandler.translate_range_to_api(e);

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

                if (e && e._type) {

                    let trans_plain_vo_obj = e ? ModuleTableVO.default_get_api_version(e, translate_field_id) : null;
                    return trans_plain_vo_obj ? JSON.stringify(trans_plain_vo_obj) : null;

                } else if ((!!e) && isArray(e)) {

                    /**
                     * Gestion des tableaux de plain_vo_obj
                     */
                    let trans_array = [];
                    for (let i in e) {
                        let e_ = e[i];

                        if ((typeof e_ === 'string') && ((!e_) || (e_.indexOf('{') < 0))) {
                            trans_array.push(e_);
                        } else {
                            trans_array.push(this.default_get_field_api_version(e_, field, translate_field_id));
                        }
                    }
                    return JSON.stringify(trans_array);

                } else if (!!e) {
                    return JSON.stringify(e);
                } else {
                    return null;
                }

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            default:
                return e;
        }
    }

    public default_field_from_api_version(e: any, field: ModuleTableFieldVO, table: ModuleTableVO): any {
        if ((!field) || field.is_readonly) {
            throw new Error('Should no ask for readonly fields');
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (field.field_id == reflect<IIsServerField>().is_server) {
            return false;
        }

        /**
         * Si le champ est secure_boolean_switch_only_server_side, on bloque au niveau des APIs à false, et on log si ya une tentative d'envoi d'un true depuis le client
         */
        if (!!field.secure_boolean_switch_only_server_side) {
            if (!!e) {
                StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_from_api.secure_boolean_switch_only_server_side", table.vo_type + '.' + field.field_id);
            }
            return false;
        }

        switch (field.field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return RangeHandler.translate_from_api(NumRange.RANGE_TYPE, e);

            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return RangeHandler.translate_from_api(TSRange.RANGE_TYPE, e);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return RangeHandler.translate_from_api(HourRange.RANGE_TYPE, e);

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return MatroidIndexHandler.from_normalized_range(e, NumRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return MatroidIndexHandler.from_normalized_range(e, HourRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return MatroidIndexHandler.from_normalized_range(e, TSRange.RANGE_TYPE);

            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return ConversionHandler.forceNumber(e);

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e || (e == '{}')) {
                    return null;
                }

                let res: any[] = (e.length > 2) ? e.substr(1, e.length - 2).split(',') : e;

                if (res && res.length) {
                    for (let i in res) {
                        res[i] = ConversionHandler.forceNumber(res[i]);
                    }
                }

                return res;

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                if (Array.isArray(e)) {
                    return e;
                }

                if (!e || (e == '{}')) {
                    return null;
                }

                return (e.length > 2) ? e.substr(1, e.length - 2).split(',') : e;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:

                if ((e == null) || (e == '{}')) {
                    return null;
                }

                let trans_ = ObjectHandler.try_get_json(e);
                if (!!trans_) {

                    /**
                     * Prise en compte des tableaux. dans ce cas chaque élément du tableau est instancié
                     */
                    if (isArray(trans_)) {
                        let new_array = [];
                        for (let i in trans_) {
                            let transi = trans_[i];
                            new_array.push(ModuleTableVO.default_from_api_version(ObjectHandler.try_get_json(transi)));
                        }
                        trans_ = new_array;
                    } else {

                        /**
                         * Si on est sur un object, pas tableau et pas typé, on boucle sur les champs pour les traduire aussi (puisque potentiellement des objects typés)
                         */
                        let elt_type = trans_ ? trans_._type : null;

                        let field_table = elt_type ? VOsTypesManager.moduleTables_by_voType[elt_type] : null;
                        if (!field_table) {
                            let new_obj = new Object();
                            for (let i in trans_) {
                                let transi = trans_[i];
                                new_obj[i] = ModuleTableVO.default_from_api_version(ObjectHandler.try_get_json(transi));
                            }
                            trans_ = new_obj;
                        } else {
                            trans_ = Object.assign(field_table.voConstructor(), ModuleTableVO.default_from_api_version(trans_));
                        }
                    }
                }
                return trans_;

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                if (!e || (e == '{}')) {
                    return null;
                }

                if ((e === null) || (typeof e === 'undefined')) {
                    return e;
                } else {
                    return (e as string[]).map((ts: string) => ConversionHandler.forceNumber(ts));
                }

            default:
                return e;
        }
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
            this.fields_[i].set_module_table(this);
        }

        this.label.code_text = "fields.labels." + this.full_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.registerDefaultTranslation(this.label);
    }

    public set_is_archived(): ModuleTableVO {
        this.is_archived = true;

        this.push_field((ModuleTableFieldController.create_new(IArchivedVOBase.API_TYPE_ID, field_names<IArchivedVOBase>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true, true, false)).setModuleTable(this));

        return this;
    }

    /**
     * Permet de récupérer un clone dont les fields sont insérables en bdd.
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec le format de la BDD
     * @param e Le VO dont on veut une version insérable en BDD
     * @param inside_plain_vo_obj  pour indiquer si on est dans un plain_vo ou sur des champs directement stockés en BDD. ça change a minima le format des string[] qui en base est pas ["",""] mais {"",""}
     */
    private default_get_bdd_version(e: T, inside_plain_vo_obj: boolean = false): T {
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

                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    res[field.field_id + '_ndx'] = MatroidIndexHandler.get_normalized_ranges(res[field.field_id] as IRange[]);
                    res[field.field_id] = RangeHandler.translate_to_bdd(res[field.field_id]);
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_numrange:
                case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                    res[field.field_id + '_ndx'] = MatroidIndexHandler.get_normalized_range(res[field.field_id] as IRange);
                    res[field.field_id] = RangeHandler.translate_range_to_bdd(res[field.field_id]);
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                    if (res[field.field_id]) {
                        res[field.field_id] = GeoPointHandler.getInstance().format(res[field.field_id]);
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    if (e[field.field_id] && e[field.field_id]._type) {
                        let field_table = VOsTypesManager.moduleTables_by_voType[e[field.field_id]._type];

                        let trans_ = e[field.field_id] ? field_table.default_get_bdd_version(e[field.field_id], true) : null;
                        res[field.field_id] = trans_ ? JSON.stringify(trans_) : null;
                    } else if (e[field.field_id]) {
                        res[field.field_id] = JSON.stringify(e[field.field_id]);
                    } else {
                        res[field.field_id] = null;
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_email:
                    if (res[field.field_id] && res[field.field_id].trim) {
                        res[field.field_id] = res[field.field_id].trim();
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_float_array:
                case ModuleTableFieldVO.FIELD_TYPE_int_array:
                case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    // ATTENTION - INTERDITION DE METTRE UNE VIRGULE DANS UN CHAMP DE TYPE ARRAY SINON CA FAIT X VALEURS
                    if (res[field.field_id]) {
                        let values: any[] = [];

                        for (let j in res[field.field_id]) {
                            if (res[field.field_id][j]) {
                                values.push(res[field.field_id][j]);
                            }
                        }

                        if (!values || !values.length) {
                            res[field.field_id] = null;
                        } else {
                            res[field.field_id] = inside_plain_vo_obj ? '[' + values.join(',') + ']' : '{' + values.join(',') + '}';
                        }
                    }

                    break;

                default:
            }
        }

        return res;
    }

    private set_sortedFields() {
        this.sortedFields = Array.from(this.fields_);

        this.sortedFields.sort((a: ModuleTableFieldVO, b: ModuleTableFieldVO) => {
            if (a.field_id < b.field_id) {
                return -1;
            }
            if (a.field_id > b.field_id) {
                return 1;
            }
            return 0;
        });
    }


    private check_unicity_field_names(tmp_fields: ModuleTableFieldVO[]) {
        let field_names: { [field_name: string]: boolean } = {};

        for (let i in tmp_fields) {
            let field = tmp_fields[i];

            if (field_names[field.field_id]) {
                ConsoleHandler.error('Field name ' + field.field_id + ' already exists in table ' + this.name);
                throw new Error('Field name ' + field.field_id + ' already exists in table ' + this.name);
            }

            field_names[field.field_id] = true;
        }
    }
}
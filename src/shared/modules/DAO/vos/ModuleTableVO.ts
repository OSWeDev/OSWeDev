import ConsoleHandler from '../../../tools/ConsoleHandler';
import { field_names } from '../../../tools/ObjectHandler';
import RangeHandler from '../../../tools/RangeHandler';
import ContextQueryInjectionCheckHandler from '../../ContextFilter/ContextQueryInjectionCheckHandler';
import ContextFilterVO from '../../ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../ContextFilter/vos/SortByVO';
import HourRange from '../../DataRender/vos/HourRange';
import NumRange from '../../DataRender/vos/NumRange';
import NumSegment from '../../DataRender/vos/NumSegment';
import TSRange from '../../DataRender/vos/TSRange';
import IArchivedVOBase from '../../IArchivedVOBase';
import IDistantVOBase from '../../IDistantVOBase';
import DefaultTranslationManager from '../../Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../Translation/vos/DefaultTranslationVO';
import ModuleTableController from '../ModuleTableController';
import ModuleTableFieldController from '../ModuleTableFieldController';
import ModuleTableCompositePartialIndexVO from './ModuleTableCompositePartialIndexVO';
import ModuleTableFieldVO from './ModuleTableFieldVO';


export default class ModuleTableVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "module_table";

    public static DEFINITION_TYPE_CODE: number = 0;
    public static DEFINITION_TYPE_NOCODE: number = 1;
    public static DEFINITION_TYPE_LABELS: { [type: number]: string } = {
        [ModuleTableVO.DEFINITION_TYPE_CODE]: "ModuleTableVO.DEFINITION_TYPE_CODE",
        [ModuleTableVO.DEFINITION_TYPE_NOCODE]: "ModuleTableVO.DEFINITION_TYPE_NOCODE",
    };

    public id: number;
    public _type: string = ModuleTableVO.API_TYPE_ID;

    public definition_type: number;

    public table_name: string;
    public full_name: string;
    public uid: string;

    /**
     * Ajout pour expliquer le type de données, son usage, ... que ce soit pour les devs, les utilisateurs finaux, ou encore les assistants
     */
    public description: string;

    /**
     * Infos liées à la segmentation d'une table
     *  Techniquement on a un segment_type déclaré sur le field directement, mais on imagine un cas de segmentation
     *      de table de log à la journée, le log est segmenté à la seconde par contre, donc les segmentations sont différentiés
     *  En revanche en théorie le range_type se déduit du type du field sur lequel on segmente, donc on le set automatiquement et
     *      on garde lisible juste pour trace et éviter de refaire le switch en permanence.
     */
    public is_segmented: boolean;
    public is_versioned: boolean;
    public is_archived: boolean;
    public table_segmented_field: ModuleTableFieldVO;
    public table_segmented_field_range_type: number;
    public table_segmented_field_segment_type: number;

    public module_name: string;
    // public module: Module;
    // public fields: ModuleTableFieldVO[];
    public suffix: string;
    public prefix: string;
    public database: string;
    public vo_type: string;
    public label: DefaultTranslationVO;

    public sort_by_field: SortByVO;

    public default_label_field: ModuleTableFieldVO;
    public importable: boolean;

    public inherit_rights_from_vo_type: string;

    public is_matroid_table: boolean;

    public any_to_many_default_behaviour_show: boolean;

    public composite_partial_indexes: ModuleTableCompositePartialIndexVO[];

    /**
     * Mappings de traduction d'un Vo de ce type vers un Vo du type b
     *  Par défaut il faut lever une erreur si on cherche un mapping undefined
     *  et si on veut rien mapper de particulier mais permettre le mapping, mettre {}
     *  le mapping sera fait à l'identique
     */
    public mapping_by_api_type_ids: { [api_type_id_b: string]: { [field_name_a: string]: string } };

    public constructor() { }

    /**
     * @deprecated use ModuleTableController.table_label_function_by_vo_type instead
     * Or it needs to be optimized for recurring calls
     */
    get table_label_function(): <T extends IDistantVOBase>(vo: T) => string {
        return ModuleTableController.table_label_function_by_vo_type[this.vo_type];
    }

    get name(): string {
        return (this.prefix ? this.prefix + "_" : "") + this.table_name + ((this.suffix != "") ? "_" + this.suffix : "");
    }

    public set_description(description: string): ModuleTableVO {
        this.description = description;
        return this;
    }

    /**
     * On ne peut segmenter que sur un field de type range ou ranges pour le moment
     *  techniquement rien n'empeche d'étendre ça à tous les autres types de données
     */
    public segment_on_field(field_name: string, segment_type: number): ModuleTableVO {

        const field = this.getFieldFromId(field_name);

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
            case ModuleTableFieldVO.FIELD_TYPE_color:
            case ModuleTableFieldVO.FIELD_TYPE_color_array:
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
            case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
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

    /**
     * @deprecated use ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type][field_name] instead
     * Or it needs to be optimized for recurring calls
     */
    public getFieldFromId(field_name: string): ModuleTableFieldVO {
        return ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type][field_name];
    }

    /**
     * @deprecated use ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type] instead. WARN it is a map not an array
     * Or it needs to be optimized for recurring calls
     */
    public get_fields(): ModuleTableFieldVO[] {
        return ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type] ?
            Object.values(ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type]) :
            null;
    }

    public get_segmented_full_name(segmented_value: number): string {

        if (!this.is_segmented) {
            return null;
        }

        const name = this.get_segmented_name(segmented_value);

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

        const name = this.get_segmented_name_from_vo(vo);

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

        const segmented_field_value = this.get_segmented_field_value_from_vo(vo);

        if (!segmented_field_value) {
            return null;
        }

        return this.get_segmented_name(segmented_field_value);
    }

    public get_segmented_field_value_from_vo(vo: IDistantVOBase): any {

        const field_value = this.get_segmented_field_raw_value_from_vo(vo);

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

        return vo[this.table_segmented_field.field_name];
    }

    public get_field_by_id(field_name: string): ModuleTableFieldVO {
        return ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type][field_name];
    }

    public defineAsMatroid(): ModuleTableVO {
        this.is_matroid_table = true;
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

    public defineAsImportable(): ModuleTableVO {

        // Il faut créer le moduleTable des datas raws.
        // this.registerImportableModuleTable();

        this.importable = true;
        return this;
    }

    /**
     * On part du principe que les refs on en trouve une par type sur une table, en tout cas on renvoie la premiere
     * @param vo_type
     */
    public getRefFieldFromTargetVoType(vo_type: string): ModuleTableFieldVO {
        if (!vo_type) {
            return null;
        }

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.vo_type];
        for (const i in fields) {
            const field: ModuleTableFieldVO = fields[i];

            if (field && field.foreign_ref_vo_type == vo_type) {
                return field;
            }
        }

        return null;
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

        this.label.code_text = "fields.labels." + this.full_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        DefaultTranslationManager.registerDefaultTranslation(this.label);
    }

    public set_is_archived(): ModuleTableVO {
        this.is_archived = true;

        ModuleTableFieldController.create_new(this.vo_type, field_names<IArchivedVOBase>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true, true, false);

        return this;
    }

    /**
     * @deprecated use ModuleTableController.vo_constructor_by_vo_type instead
     * Or it needs to be optimized for recurring calls
     */
    public voConstructor(): IDistantVOBase {
        return new ModuleTableController.vo_constructor_by_vo_type[this.vo_type]();
    }

    /**
     *
     * @param field_names_
     * @param context_filters
     * @param overload_index_name_schema pour forcer un nom d'index avec un param {table_name} qui sera remplacé par le nom de la table (typiquement sur une segmented)
     * @returns
     */
    public add_composite_partial_index(field_names_: string[], context_filters: ContextFilterVO[] = null, overload_index_name_schema: string = null): ModuleTableVO {

        const composite_partial_index = new ModuleTableCompositePartialIndexVO();

        composite_partial_index.vo_type = this.vo_type;
        composite_partial_index.field_names = field_names_;
        composite_partial_index.context_filters = context_filters;
        composite_partial_index.overload_index_name_schema = overload_index_name_schema;

        if (!this.composite_partial_indexes) {
            this.composite_partial_indexes = [];
        }
        this.composite_partial_indexes.push(composite_partial_index);

        return this;
    }
}
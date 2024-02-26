import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import DatatableField from '../DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import TableColumnDescVO from '../DashboardBuilder/vos/TableColumnDescVO';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import StatsController from '../Stats/StatsController';
import VarConfVO from '../Var/vos/VarConfVO';
import BuildSelectQueryParamVO, { BuildSelectQueryParamVOStatic } from './vos/BuildSelectQueryParamVO';
import ContextFilterVO from './vos/ContextFilterVO';
import ContextQueryFieldVO from './vos/ContextQueryFieldVO';
import ContextQueryJoinOnFieldVO from './vos/ContextQueryJoinOnFieldVO';
import ContextQueryJoinVO from './vos/ContextQueryJoinVO';
import ContextQueryVO from './vos/ContextQueryVO';
import CountValidSegmentationsParamVO, { CountValidSegmentationsParamVOStatic } from './vos/CountValidSegmentationsParamVO';
import DeleteVosParamVO, { DeleteVosParamVOStatic } from './vos/DeleteVosParamVO';
import SelectFilterVisibleOptionsParamVO, { SelectFilterVisibleOptionsParamVOStatic } from './vos/GetOptionsFromContextFiltersParamVO';
import ParameterizedQueryWrapper from './vos/ParameterizedQueryWrapper';
import QueryVOFromUniqueFieldContextFiltersParamVO, { QueryVOFromUniqueFieldContextFiltersParamVOStatic } from './vos/QueryVOFromUniqueFieldContextFiltersParamVO';
import SelectCountParamVO, { SelectCountParamVOStatic } from './vos/SelectCountParamVO';
import SelectDatatableRowsParamVO, { SelectDatatableRowsParamVOStatic } from './vos/SelectDatatableRowsParamVO';
import SelectVosParamVO, { SelectVosParamVOStatic } from './vos/SelectVosParamVO';
import SortByVO from './vos/SortByVO';
import UpdateVosParamVO, { UpdateVosParamVOStatic } from './vos/UpdateVosParamVO';

export default class ModuleContextFilter extends Module {

    public static MAX_SEGMENTATION_OPTIONS: number = 200;

    public static MODULE_NAME: string = "ContextFilter";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleContextFilter.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleContextFilter.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_select: string = "select";
    public static APINAME_select_filter_visible_options: string = "select_filter_visible_options";
    public static APINAME_select_datatable_rows: string = "select_datatable_rows";
    public static APINAME_select_count: string = "select_count";
    public static APINAME_select_vos: string = "select_vos";
    public static APINAME_delete_vos: string = "delete_vos";
    public static APINAME_update_vos: string = "update_vos";
    public static APINAME_select_vo_from_unique_field: string = "select_vo_from_unique_field";
    public static APINAME_count_valid_segmentations: string = "count_valid_segmentations";
    public static APINAME_build_select_query: string = "build_select_query";
    public static APINAME_build_select_query_str: string = "build_select_query_str";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleContextFilter {
        if (!ModuleContextFilter.instance) {
            ModuleContextFilter.instance = new ModuleContextFilter();
        }

        return ModuleContextFilter.instance;
    }

    private static instance: ModuleContextFilter = null;

    /**
     * Compter les segmentations valides à partir des filtres passés en paramètres (pour un type segmenté donné)
     * @param context_query
     */
    public count_valid_segmentations: (api_type_id: string, context_query: ContextQueryVO, ignore_self_filter?: boolean) => Promise<number> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_count_valid_segmentations);

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public select: (
        context_query: ContextQueryVO
    ) => Promise<any[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select);

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public select_datatable_rows: (
        context_query: ContextQueryVO,
        columns_by_field_name: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ) => Promise<any[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select_datatable_rows);

    /**
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public select_count: (
        context_query: ContextQueryVO
    ) => Promise<number> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select_count);

    /**
     * Récupérer un vo par un field d'unicité
     * @param api_type_id le type de l'objet cherché
     * @param unique_field_name le field_name d'unicité
     * @param unique_field_value la value du field unique
     */
    public select_vo_from_unique_field: <T extends IDistantVOBase> (
        api_type_id: string,
        unique_field_name: string,
        unique_field_value: any,
    ) => Promise<T> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select_vo_from_unique_field);

    /**
     * Créer la requête sur la base des filtres
     * @param context_query
     */
    public build_select_query: (context_query: ContextQueryVO) => Promise<ParameterizedQueryWrapper> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_build_select_query);

    /**
     * Créer la requête sur la base des filtres => renvoie que la query en mode texte
     * @param context_query
     */
    public build_select_query_str: (context_query: ContextQueryVO) => Promise<string> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_build_select_query_str);

    /**
     * Filtrer des vos avec les context filters
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public select_vos: <T extends IDistantVOBase>(context_query: ContextQueryVO) => Promise<T[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select_vos);

    /**
     * Delete des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un delete qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     */
    public delete_vos: (context_query: ContextQueryVO) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_delete_vos);

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param new_api_translated_values Map, avec en KEY Le nom du champs cible (sur le base_api_type_id), et en valeur la nouvelle valeur du champ. ATTENTION à la passer en format api_translated (par exemple issue de moduletable.default_get_field_api_version)
     */
    public update_vos: <T extends IDistantVOBase>(
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_name in keyof T]?: any }
    ) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_update_vos);

    /**
     * Filtrer des datafilteroption (pour les filtrages type multiselect) avec les context filters, en indiquant obligatoirement le champs ciblé
     * @param context_query le champs fields doit être rempli avec un seul champs, celui qui correspond au filtrage du multiselect, et l'alias "label" a priori
     */
    public select_filter_visible_options: (
        context_query: ContextQueryVO,
        actual_query: string
    ) => Promise<DataFilterOption[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_select_filter_visible_options);

    private constructor() {

        super("contextfilter", ModuleContextFilter.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.init_ContextFilterVO();
        this.init_SortByVO();
        this.init_ContextQueryFieldVO();
        this.init_ContextQueryVO();
        this.init_ContextQueryJoinOnFieldVO();
        this.init_ContextQueryJoinVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<CountValidSegmentationsParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_count_valid_segmentations,
            (params: CountValidSegmentationsParamVO) => {
                let res: { [api_type_id: string]: boolean } = {
                    [params.api_type_id]: true
                };
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            CountValidSegmentationsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectVosParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select,
            (params: SelectVosParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectVosParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectFilterVisibleOptionsParamVO, DataFilterOption[]>(
            null,
            ModuleContextFilter.APINAME_select_filter_visible_options,
            (params: SelectFilterVisibleOptionsParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectFilterVisibleOptionsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectDatatableRowsParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_datatable_rows,
            (params: SelectDatatableRowsParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectDatatableRowsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectCountParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_count,
            (params: SelectCountParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectCountParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<QueryVOFromUniqueFieldContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_vo_from_unique_field,
            (params: QueryVOFromUniqueFieldContextFiltersParamVO) => {
                return [params.api_type_id];
            },
            QueryVOFromUniqueFieldContextFiltersParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<BuildSelectQueryParamVO, ParameterizedQueryWrapper>(
            null,
            ModuleContextFilter.APINAME_build_select_query,
            (params: BuildSelectQueryParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            BuildSelectQueryParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<BuildSelectQueryParamVO, string>(
            null,
            ModuleContextFilter.APINAME_build_select_query_str,
            (params: BuildSelectQueryParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            BuildSelectQueryParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectVosParamVO, IDistantVOBase[]>(
            null,
            ModuleContextFilter.APINAME_select_vos,
            (params: SelectVosParamVO) => {
                let res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectVosParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<DeleteVosParamVO, InsertOrDeleteQueryResult[]>(
            null,
            ModuleContextFilter.APINAME_delete_vos,
            (params: DeleteVosParamVO) => {
                return params.context_query ? [params.context_query.base_api_type_id] : null;
            },
            DeleteVosParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<UpdateVosParamVO<any>, InsertOrDeleteQueryResult[]>(
            null,
            ModuleContextFilter.APINAME_update_vos,
            (params: UpdateVosParamVO<any>) => {
                return params.context_query ? [params.context_query.base_api_type_id] : null;
            },
            UpdateVosParamVOStatic
        ));
    }

    private define_used_api_type_ids_from_query(query_: ContextQueryVO, res: { [api_type_id: string]: boolean }) {
        res[query_.base_api_type_id] = true;

        if (query_.fields) {
            for (let i in query_.fields) {
                res[query_.fields[i].api_type_id] = true;
            }
        }

        if (query_.filters) {
            for (let i in query_.filters) {
                this.define_used_api_type_ids_from_filter(query_.filters[i], res);
            }
        }

        if (query_.union_queries) {
            for (let i in query_.union_queries) {
                this.define_used_api_type_ids_from_query(query_.union_queries[i], res);
            }
        }

        if (query_.joined_context_queries) {
            for (let i in query_.joined_context_queries) {
                this.define_used_api_type_ids_from_query(query_.joined_context_queries[i].joined_context_query, res);
            }
        }
    }

    private define_used_api_type_ids_from_filter(filter_: ContextFilterVO, res: { [api_type_id: string]: boolean }) {
        res[filter_.vo_type] = true;

        if (filter_.left_hook) {
            this.define_used_api_type_ids_from_filter(filter_.left_hook, res);
        }

        if (filter_.right_hook) {
            this.define_used_api_type_ids_from_filter(filter_.right_hook, res);
        }

        if (filter_.sub_query) {
            this.define_used_api_type_ids_from_query(filter_.sub_query, res);
        }
    }

    private init_SortByVO() {

        let datatable_fields = [
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().alias, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'API TYPE ID'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'FIELD ID'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().sort_asc, ModuleTableFieldVO.FIELD_TYPE_boolean, 'ASC', true, true, true),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().modifier, ModuleTableFieldVO.FIELD_TYPE_enum, 'Modificateur').setEnumValues(SortByVO.MODIFIER_LABELS),
        ];

        let datatable = new ModuleTableVO(this, SortByVO.API_TYPE_ID, () => new SortByVO(null, null, true), datatable_fields, null, "Trier");
        this.datatables.push(datatable);
    }

    private init_ContextFilterVO() {
        let datatable_fields = [
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'API TYPE ID', true),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'FIELD ID', true),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().filter_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true).setEnumValues(ContextFilterVO.TYPE_LABELS),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_text, ModuleTableFieldVO.FIELD_TYPE_string, 'param_text', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_numeric, ModuleTableFieldVO.FIELD_TYPE_float, 'param_numeric', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_numeric_array, ModuleTableFieldVO.FIELD_TYPE_int_array, 'param_numeric_array', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_textarray, ModuleTableFieldVO.FIELD_TYPE_string_array, 'param_textarray', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_tsranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'param_tsranges', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_numranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'param_numranges', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_hourranges, ModuleTableFieldVO.FIELD_TYPE_hourrange_array, 'param_hourranges', false),

            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().left_hook, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'left_hook', false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().right_hook, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'right_hook', false),

            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().text_ignore_case, ModuleTableFieldVO.FIELD_TYPE_boolean, 'text_ignore_case', true, true, true),
            // ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().text_trim, ModuleTableFieldVO.FIELD_TYPE_boolean, 'text_trim', true, true, false),
            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().param_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'alias', false),

            ModuleTableFieldController.create_new(ContextFilterVO.API_TYPE_ID, field_names<ContextFilterVO>().sub_query, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sub_query', false),
        ];

        let datatable = new ModuleTableVO(this, ContextFilterVO.API_TYPE_ID, () => new ContextFilterVO(), datatable_fields, null, "Filtre contextuel");
        this.datatables.push(datatable);
    }

    private init_ContextQueryJoinOnFieldVO() {

        let datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().joined_table_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().joined_table_field_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_field_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().initial_context_query_api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'initial_context_query_api_type_id', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().initial_context_query_field_name_or_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'initial_context_query_field_name_or_alias', true),
        ];

        let datatable = new ModuleTableVO(this, ContextQueryJoinOnFieldVO.API_TYPE_ID, () => new ContextQueryJoinOnFieldVO(), datatable_fields, null, "Champs pour join de requêtes");
        this.datatables.push(datatable);
    }

    private init_ContextQueryJoinVO() {

        let datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().joined_context_query, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'joined_context_query', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().joined_table_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().join_on_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'join_on_fields', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().join_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'join_type', true, true, ContextQueryJoinVO.JOIN_TYPE_LEFT_JOIN).setEnumValues(ContextQueryJoinVO.JOIN_TYPE_LABELS),
        ];

        let datatable = new ModuleTableVO(this, ContextQueryJoinVO.API_TYPE_ID, () => new ContextQueryJoinVO(), datatable_fields, null, "Join de requête");
        this.datatables.push(datatable);
    }

    private init_ContextQueryFieldVO() {

        let datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Api_type_id', true),
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du champs', true),
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().alias, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias', false),
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', false).setEnumValues(VarConfVO.AGGREGATOR_LABELS),
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().modifier, ModuleTableFieldVO.FIELD_TYPE_enum, 'Modificateur', false).setEnumValues(ContextQueryFieldVO.FIELD_MODIFIER_LABELS),
            ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().cast_with, ModuleTableFieldVO.FIELD_TYPE_string, 'Caster avec', false),
        ];
        let datatable = new ModuleTableVO(this, ContextQueryFieldVO.API_TYPE_ID, () => new ContextQueryFieldVO(), datatable_fields, null, "Champs de requête");
        this.datatables.push(datatable);
    }

    private init_ContextQueryVO() {

        let datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().base_api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'base_api_type_id', true),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'fields', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'filters', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().active_api_type_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'active_api_type_ids', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_limit, ModuleTableFieldVO.FIELD_TYPE_int, 'query_limit', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_offset, ModuleTableFieldVO.FIELD_TYPE_int, 'query_offset', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().sort_by, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sort_by', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_tables_prefix, ModuleTableFieldVO.FIELD_TYPE_string, 'query_tables_prefix', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().is_admin, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_admin', true, true, false).flag_as_secure_boolean_switch_only_server_side(),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().use_technical_field_versioning, ModuleTableFieldVO.FIELD_TYPE_boolean, 'use_technical_field_versioning', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_distinct, ModuleTableFieldVO.FIELD_TYPE_boolean, 'query_distinct', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().discarded_field_paths, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'discarded_field_paths', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().union_queries, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'union_queries', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().joined_context_queries, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'joined_context_queries', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().do_count_results, ModuleTableFieldVO.FIELD_TYPE_boolean, 'do_count_results', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().max_age_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'max_age_ms', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().request_id, ModuleTableFieldVO.FIELD_TYPE_int, 'request_id', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().throttle_query_select, ModuleTableFieldVO.FIELD_TYPE_boolean, 'throttle_query_select', true, true, true),
        ];

        let datatable = new ModuleTableVO(this, ContextQueryVO.API_TYPE_ID, () => new ContextQueryVO(), datatable_fields, null, "Requête");
        this.datatables.push(datatable);
    }
}
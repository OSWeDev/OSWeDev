import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import DatatableField from '../DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import TableColumnDescVO from '../DashboardBuilder/vos/TableColumnDescVO';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
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
        columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
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
     * @param unique_field_id le field_id d'unicité
     * @param unique_field_value la value du field unique
     */
    public select_vo_from_unique_field: <T extends IDistantVOBase> (
        api_type_id: string,
        unique_field_id: string,
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
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_id in keyof T]?: any }
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
        this.fields = [];
        this.datatables = [];

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
            null,
            CountValidSegmentationsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectVosParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select,
            null,
            SelectVosParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectFilterVisibleOptionsParamVO, DataFilterOption[]>(
            null,
            ModuleContextFilter.APINAME_select_filter_visible_options,
            null,
            SelectFilterVisibleOptionsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectDatatableRowsParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_datatable_rows,
            null,
            SelectDatatableRowsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectCountParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_count,
            null,
            SelectCountParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<QueryVOFromUniqueFieldContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_vo_from_unique_field,
            null,
            QueryVOFromUniqueFieldContextFiltersParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<BuildSelectQueryParamVO, ParameterizedQueryWrapper>(
            null,
            ModuleContextFilter.APINAME_build_select_query,
            null,
            BuildSelectQueryParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<BuildSelectQueryParamVO, string>(
            null,
            ModuleContextFilter.APINAME_build_select_query_str,
            null,
            BuildSelectQueryParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SelectVosParamVO, IDistantVOBase[]>(
            null,
            ModuleContextFilter.APINAME_select_vos,
            null,
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

    private init_SortByVO() {

        let datatable_fields = [
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'API TYPE ID'),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'FIELD ID'),
            new ModuleTableField('sort_asc', ModuleTableField.FIELD_TYPE_boolean, 'ASC', true, true, true),
        ];

        let datatable = new ModuleTable(this, SortByVO.API_TYPE_ID, () => new SortByVO(null, null, true), datatable_fields, null, "Trier");
        this.datatables.push(datatable);
    }

    private init_ContextFilterVO() {

        let datatable_fields = [
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'API TYPE ID', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'FIELD ID', true),
            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true).setEnumValues(ContextFilterVO.TYPE_LABELS),
            new ModuleTableField('param_text', ModuleTableField.FIELD_TYPE_string, 'param_text', false),
            new ModuleTableField('param_numeric', ModuleTableField.FIELD_TYPE_float, 'param_numeric', false),
            new ModuleTableField('param_numeric_array', ModuleTableField.FIELD_TYPE_int_array, 'param_numeric_array', false),
            new ModuleTableField('param_textarray', ModuleTableField.FIELD_TYPE_string_array, 'param_textarray', false),
            new ModuleTableField('param_tsranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'param_tsranges', false),
            new ModuleTableField('param_numranges', ModuleTableField.FIELD_TYPE_numrange_array, 'param_numranges', false),
            new ModuleTableField('param_hourranges', ModuleTableField.FIELD_TYPE_hourrange_array, 'param_hourranges', false),

            new ModuleTableField('left_hook', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'left_hook', false),
            new ModuleTableField('right_hook', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'right_hook', false),

            new ModuleTableField('sub_query', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sub_query', false),
        ];

        let datatable = new ModuleTable(this, ContextFilterVO.API_TYPE_ID, () => new ContextFilterVO(), datatable_fields, null, "Filtre contextuel");
        this.datatables.push(datatable);
    }

    private init_ContextQueryJoinOnFieldVO() {

        let datatable_fields = [
            new ModuleTableField('joined_table_alias', ModuleTableField.FIELD_TYPE_string, 'joined_table_alias', true),
            new ModuleTableField('joined_table_field_alias', ModuleTableField.FIELD_TYPE_string, 'joined_table_field_alias', true),
            new ModuleTableField('initial_context_query_api_type_id', ModuleTableField.FIELD_TYPE_string, 'initial_context_query_api_type_id', true),
            new ModuleTableField('initial_context_query_field_id_or_alias', ModuleTableField.FIELD_TYPE_string, 'initial_context_query_field_id_or_alias', true),
        ];

        let datatable = new ModuleTable(this, ContextQueryJoinOnFieldVO.API_TYPE_ID, () => new ContextQueryJoinOnFieldVO(), datatable_fields, null, "Champs pour join de requêtes");
        this.datatables.push(datatable);
    }

    private init_ContextQueryJoinVO() {

        let datatable_fields = [
            new ModuleTableField('joined_context_query', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'joined_context_query', true),
            new ModuleTableField('joined_table_alias', ModuleTableField.FIELD_TYPE_string, 'joined_table_alias', true),
            new ModuleTableField('join_on_fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'join_on_fields', true),
            new ModuleTableField('join_type', ModuleTableField.FIELD_TYPE_enum, 'join_type', true, true, ContextQueryJoinVO.JOIN_TYPE_LEFT_JOIN).setEnumValues(ContextQueryJoinVO.JOIN_TYPE_LABELS),
        ];

        let datatable = new ModuleTable(this, ContextQueryJoinVO.API_TYPE_ID, () => new ContextQueryJoinVO(), datatable_fields, null, "Join de requête");
        this.datatables.push(datatable);
    }

    private init_ContextQueryFieldVO() {

        let datatable_fields = [
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'Api_type_id', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID du champs', true),
            new ModuleTableField('alias', ModuleTableField.FIELD_TYPE_string, 'Alias', false),
            new ModuleTableField('aggregator', ModuleTableField.FIELD_TYPE_enum, 'Aggrégateur', false).setEnumValues(VarConfVO.AGGREGATOR_LABELS),
        ];

        let datatable = new ModuleTable(this, ContextQueryFieldVO.API_TYPE_ID, () => new ContextQueryFieldVO(), datatable_fields, null, "Champs de requête");
        this.datatables.push(datatable);
    }

    private init_ContextQueryVO() {

        let datatable_fields = [
            new ModuleTableField('base_api_type_id', ModuleTableField.FIELD_TYPE_string, 'base_api_type_id', true),
            new ModuleTableField('fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'fields', false),
            new ModuleTableField('filters', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'filters', false),
            new ModuleTableField('active_api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'active_api_type_ids', false),
            new ModuleTableField('query_limit', ModuleTableField.FIELD_TYPE_int, 'query_limit', true, true, 0),
            new ModuleTableField('query_offset', ModuleTableField.FIELD_TYPE_int, 'query_offset', true, true, 0),
            new ModuleTableField('sort_by', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sort_by', false),
            new ModuleTableField('query_tables_prefix', ModuleTableField.FIELD_TYPE_string, 'query_tables_prefix', false),
            new ModuleTableField('is_admin', ModuleTableField.FIELD_TYPE_boolean, 'is_admin', true, true, false).set_custom_translate_to_api(this.is_admin_custom_translate_to_api).set_custom_translate_from_api(this.is_admin_custom_translate_from_api),
            new ModuleTableField('use_technical_field_versioning', ModuleTableField.FIELD_TYPE_boolean, 'use_technical_field_versioning', true, true, false),
            new ModuleTableField('query_distinct', ModuleTableField.FIELD_TYPE_boolean, 'query_distinct', true, true, false),
            new ModuleTableField('discarded_field_paths', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'discarded_field_paths', false),
            new ModuleTableField('union_queries', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'discarded_field_paths', false),
            new ModuleTableField('joined_context_queries', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'joined_context_queries', false),
            new ModuleTableField('do_count_results', ModuleTableField.FIELD_TYPE_boolean, 'do_count_results', true, true, false),
        ];

        let datatable = new ModuleTable(this, ContextQueryVO.API_TYPE_ID, () => new ContextQueryVO(), datatable_fields, null, "Requête");
        this.datatables.push(datatable);
    }

    /**
     * On ne veut pas que le is_access_hook_def/is_admin soit envoyé par le client
     *  Si on tente un envoi depuis le client en true, on stat et on modifie en false
     */
    private is_admin_custom_translate_to_api(e: boolean): boolean {
        if (!!e) {
            StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_to_api", "query.is_admin");
            return false;
        }
        return e;
    }

    /**
     * On ne veut pas que le is_access_hook_def/is_admin soit envoyé par le client
     *  Si on reçoit une api depuis le client en true, on stat et on modifie en false
     */
    private is_admin_custom_translate_from_api(e: boolean): boolean {
        if (!!e) {
            StatsController.register_stat_COMPTEUR(StatsController.GROUP_NAME_ERROR_ALERTS, "translate_from_api", "query.is_admin");
            return false;
        }
        return e;
    }
}
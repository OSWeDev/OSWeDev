import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import DatatableField from '../DAO/vos/datatable/DatatableField';
import TableColumnDescVO from '../DashboardBuilder/vos/TableColumnDescVO';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
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

    public static instance: ModuleContextFilter = null;


    /**
     * Compter les segmentations valides à partir des filtres passés en paramètres (pour un type segmenté donné)
     * @param context_query
     */
    public count_valid_segmentations: (api_type_id: string, context_query: ContextQueryVO, ignore_self_filter?: boolean) => Promise<number> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().count_valid_segmentations);

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public select: (
        context_query: ContextQueryVO
    ) => Promise<any[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select);

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public select_datatable_rows: (
        context_query: ContextQueryVO,
        columns_by_field_name: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ) => Promise<any[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select_datatable_rows);

    /**
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public select_count: (
        context_query: ContextQueryVO
    ) => Promise<number> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select_count);

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
    ) => Promise<T> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select_vo_from_unique_field);

    /**
     * Créer la requête sur la base des filtres
     * @param context_query
     */
    public build_select_query: (context_query: ContextQueryVO) => Promise<ParameterizedQueryWrapper> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().build_select_query);

    /**
     * Créer la requête sur la base des filtres => renvoie que la query en mode texte
     * @param context_query
     */
    public build_select_query_str: (context_query: ContextQueryVO) => Promise<string> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().build_select_query_str);

    /**
     * Filtrer des vos avec les context filters
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public select_vos: <T extends IDistantVOBase>(context_query: ContextQueryVO) => Promise<T[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select_vos);

    /**
     * Delete des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un delete qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     */
    public delete_vos: (context_query: ContextQueryVO) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().delete_vos);

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param new_api_translated_values Map, avec en KEY Le nom du champs cible (sur le base_api_type_id), et en valeur la nouvelle valeur du champ. ATTENTION à la passer en format api_translated (par exemple issue de moduletable.default_get_field_api_version)
     */
    public update_vos: <T extends IDistantVOBase>(
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_name in keyof T]?: any }
    ) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().update_vos);

    /**
     * Filtrer des datafilteroption (pour les filtrages type multiselect) avec les context filters, en indiquant obligatoirement le champs ciblé
     * @param context_query le champs fields doit être rempli avec un seul champs, celui qui correspond au filtrage du multiselect, et l'alias "label" a priori
     */
    public select_filter_visible_options: (
        context_query: ContextQueryVO,
        actual_query: string
    ) => Promise<DataFilterOption[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleContextFilter>().select_filter_visible_options);

    private constructor() {

        super("contextfilter", ModuleContextFilter.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleContextFilter {
        if (!ModuleContextFilter.instance) {
            ModuleContextFilter.instance = new ModuleContextFilter();
        }

        return ModuleContextFilter.instance;
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

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<CountValidSegmentationsParamVO, any[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().count_valid_segmentations,
            (params: CountValidSegmentationsParamVO) => {
                const res: { [api_type_id: string]: boolean } = {
                    [params.api_type_id]: true
                };
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            CountValidSegmentationsParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<SelectVosParamVO, any[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select,
            (params: SelectVosParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectVosParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<SelectFilterVisibleOptionsParamVO, DataFilterOption[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select_filter_visible_options,
            (params: SelectFilterVisibleOptionsParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectFilterVisibleOptionsParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<SelectDatatableRowsParamVO, any[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select_datatable_rows,
            (params: SelectDatatableRowsParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectDatatableRowsParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<SelectCountParamVO, any[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select_count,
            (params: SelectCountParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectCountParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<QueryVOFromUniqueFieldContextFiltersParamVO, any[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select_vo_from_unique_field,
            (params: QueryVOFromUniqueFieldContextFiltersParamVO) => {
                return [params.api_type_id];
            },
            QueryVOFromUniqueFieldContextFiltersParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<BuildSelectQueryParamVO, ParameterizedQueryWrapper>(
            null,
            this.name,
            reflect<ModuleContextFilter>().build_select_query,
            (params: BuildSelectQueryParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            BuildSelectQueryParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));
        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<BuildSelectQueryParamVO, string>(
            null,
            this.name,
            reflect<ModuleContextFilter>().build_select_query_str,
            (params: BuildSelectQueryParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            BuildSelectQueryParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostForGetAPIDefinition.new<SelectVosParamVO, IDistantVOBase[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().select_vos,
            (params: SelectVosParamVO) => {
                const res: { [api_type_id: string]: boolean } = {};
                this.define_used_api_type_ids_from_query(params.context_query, res);
                return Object.keys(res);
            },
            SelectVosParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<DeleteVosParamVO, InsertOrDeleteQueryResult[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().delete_vos,
            (params: DeleteVosParamVO) => {
                return params.context_query ? [params.context_query.base_api_type_id] : null;
            },
            DeleteVosParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<UpdateVosParamVO<any>, InsertOrDeleteQueryResult[]>(
            null,
            this.name,
            reflect<ModuleContextFilter>().update_vos,
            (params: UpdateVosParamVO<any>) => {
                return params.context_query ? [params.context_query.base_api_type_id] : null;
            },
            UpdateVosParamVOStatic,
            // APIDefinition.API_RETURN_TYPE_NOTIF,
        ));
    }

    private define_used_api_type_ids_from_query(query_: ContextQueryVO, res: { [api_type_id: string]: boolean }) {
        res[query_.base_api_type_id] = true;

        if (query_.fields) {
            for (const i in query_.fields) {
                res[query_.fields[i].api_type_id] = true;
            }
        }

        if (query_.filters) {
            for (const i in query_.filters) {
                this.define_used_api_type_ids_from_filter(query_.filters[i], res);
            }
        }

        if (query_.union_queries) {
            for (const i in query_.union_queries) {
                this.define_used_api_type_ids_from_query(query_.union_queries[i], res);
            }
        }

        if (query_.joined_context_queries) {
            for (const i in query_.joined_context_queries) {
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

        const datatable_fields = [
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().alias, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'API TYPE ID'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'FIELD ID'),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().sort_asc, ModuleTableFieldVO.FIELD_TYPE_boolean, 'ASC', true, true, true),
            ModuleTableFieldController.create_new(SortByVO.API_TYPE_ID, field_names<SortByVO>().modifier, ModuleTableFieldVO.FIELD_TYPE_enum, 'Modificateur').setEnumValues(SortByVO.MODIFIER_LABELS),
        ];

        const datatable = ModuleTableController.create_new(this.name, SortByVO, null, "Trier");
    }

    private init_ContextFilterVO() {
        const datatable_fields = [
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

        const datatable = ModuleTableController.create_new(this.name, ContextFilterVO, null, "Filtre contextuel");
    }

    private init_ContextQueryJoinOnFieldVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().joined_table_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().joined_table_field_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_field_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().initial_context_query_api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'initial_context_query_api_type_id', true),
            ModuleTableFieldController.create_new(ContextQueryJoinOnFieldVO.API_TYPE_ID, field_names<ContextQueryJoinOnFieldVO>().initial_context_query_field_name_or_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'initial_context_query_field_name_or_alias', true),
        ];

        const datatable = ModuleTableController.create_new(this.name, ContextQueryJoinOnFieldVO, null, "Champs pour join de requêtes");
    }

    private init_ContextQueryJoinVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().joined_context_query, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'joined_context_query', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().joined_table_alias, ModuleTableFieldVO.FIELD_TYPE_string, 'joined_table_alias', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().join_on_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'join_on_fields', true),
            ModuleTableFieldController.create_new(ContextQueryJoinVO.API_TYPE_ID, field_names<ContextQueryJoinVO>().join_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'join_type', true, true, ContextQueryJoinVO.JOIN_TYPE_LEFT_JOIN).setEnumValues(ContextQueryJoinVO.JOIN_TYPE_LABELS),
        ];

        const datatable = ModuleTableController.create_new(this.name, ContextQueryJoinVO, null, "Join de requête");
    }

    private init_ContextQueryFieldVO() {

        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Api_type_id', false);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du champs', false);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().alias, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias', false);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', true, true, VarConfVO.NO_AGGREGATOR).setEnumValues(VarConfVO.AGGREGATOR_LABELS);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().modifier, ModuleTableFieldVO.FIELD_TYPE_enum, 'Modificateur', true, true, ContextQueryFieldVO.FIELD_MODIFIER_NONE).setEnumValues(ContextQueryFieldVO.FIELD_MODIFIER_LABELS);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().cast_with, ModuleTableFieldVO.FIELD_TYPE_string, 'Caster avec', false);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().operator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Opérateur', true, true, ContextQueryFieldVO.FIELD_OPERATOR_NONE).setEnumValues(ContextQueryFieldVO.FIELD_OPERATOR_LABELS);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().operator_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Champs de l\'opérateur', false);
        ModuleTableFieldController.create_new(ContextQueryFieldVO.API_TYPE_ID, field_names<ContextQueryFieldVO>().static_value, ModuleTableFieldVO.FIELD_TYPE_string, 'Valeur statique', false);

        const datatable = ModuleTableController.create_new(this.name, ContextQueryFieldVO, null, "Champs de requête");
    }

    private init_ContextQueryVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().base_api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'base_api_type_id', true),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'fields', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'filters', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().active_api_type_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'active_api_type_ids', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_limit, ModuleTableFieldVO.FIELD_TYPE_int, 'query_limit', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_offset, ModuleTableFieldVO.FIELD_TYPE_int, 'query_offset', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().sort_by, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sort_by', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_tables_prefix, ModuleTableFieldVO.FIELD_TYPE_string, 'query_tables_prefix', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().is_server, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_server', true, true, false).flag_as_secure_boolean_switch_only_server_side(),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().use_technical_field_versioning, ModuleTableFieldVO.FIELD_TYPE_boolean, 'use_technical_field_versioning', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().query_distinct, ModuleTableFieldVO.FIELD_TYPE_boolean, 'query_distinct', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().discarded_field_paths, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'discarded_field_paths', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().union_queries, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'union_queries', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().joined_context_queries, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'joined_context_queries', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().do_count_results, ModuleTableFieldVO.FIELD_TYPE_boolean, 'do_count_results', true, true, false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().max_age_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'max_age_ms', true, true, 0),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().request_id, ModuleTableFieldVO.FIELD_TYPE_int, 'request_id', false),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().throttle_query_select, ModuleTableFieldVO.FIELD_TYPE_boolean, 'throttle_query_select', true, true, true),
            ModuleTableFieldController.create_new(ContextQueryVO.API_TYPE_ID, field_names<ContextQueryVO>().anonimized_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'anonimized_fields', false),
        ];

        const datatable = ModuleTableController.create_new(this.name, ContextQueryVO, null, "Requête");
    }
}
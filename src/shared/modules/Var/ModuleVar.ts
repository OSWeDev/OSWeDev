import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ConsoleHandler from '../../tools/ConsoleHandler';
import { all_promises } from '../../tools/PromiseTools';
import RangeHandler from '../../tools/RangeHandler';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ContextFilterVOHandler from '../ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../ContextFilter/vos/ContextFilterVO';
import ContextQueryJoinOnFieldVO from '../ContextFilter/vos/ContextQueryJoinOnFieldVO';
import ContextQueryJoinVO from '../ContextFilter/vos/ContextQueryJoinVO';
import ContextQueryVO, { query } from '../ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../Cron/ManualTasksController';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import APISimpleVOsParamVO, { APISimpleVOsParamVOStatic } from '../DAO/vos/APISimpleVOsParamVO';
import DashboardPageWidgetVO from '../DashboardBuilder/vos/DashboardPageWidgetVO';
import FieldValueFilterWidgetOptionsVO from '../DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import TableColumnDescVO from '../DashboardBuilder/vos/TableColumnDescVO';
import NumRange from '../DataRender/vos/NumRange';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import TSRange from '../DataRender/vos/TSRange';
import Dates from '../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../IDistantVOBase';
import MatroidController from '../Matroid/MatroidController';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import VarsController from './VarsController';
import GetVarParamFromContextFiltersParamVO, { GetVarParamFromContextFiltersParamVOStatic } from './vos/GetVarParamFromContextFiltersParamVO';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarConfAutoDepVO from './vos/VarConfAutoDepVO';
import VarConfIds from './vos/VarConfIds';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';
import VarDataValueResVO from './vos/VarDataValueResVO';
import VarPixelFieldConfVO from './vos/VarPixelFieldConfVO';

export default class ModuleVar extends Module {

    public static PARAM_NAME_limit_nb_ts_ranges_on_param_by_context_filter = 'Var.limit_nb_ts_ranges_on_param_by_context_filter';
    public static VARPARAMFIELD_PREFIX: string = '__varparamfield_';

    public static MODULE_NAME: string = 'Var';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVar.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_VARCONF_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_VARCONF_ACCESS';
    public static POLICY_BO_IMPORTED_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_IMPORTED_ACCESS';
    public static POLICY_DESC_MODE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.DESC_MODE_ACCESS';

    public static APINAME_getSimpleVarDataValueSumFilterByMatroids: string = 'getSimpleVarDataValueSumFilterByMatroids';
    public static APINAME_getSimpleVarDataCachedValueFromParam: string = 'getSimpleVarDataCachedValueFromParam';
    public static APINAME_configureVarCache: string = 'configureVarCache';

    public static APINAME_get_var_id_by_names: string = 'get_var_id_by_names';
    public static APINAME_register_params: string = 'register_params';
    public static APINAME_update_params_registration: string = 'update_params_registration';
    public static APINAME_unregister_params: string = 'unregister_params';

    public static APINAME_get_var_data: string = 'get_var_data';

    public static APINAME_getVarControllerVarsDeps: string = 'getVarControllerVarsDeps';
    public static APINAME_getParamDependencies: string = 'getParamDependencies';
    public static APINAME_getVarControllerDSDeps: string = 'getVarControllerDSDeps';
    public static APINAME_getVarParamDatas: string = 'getVarParamDatas';
    public static APINAME_getAggregatedVarDatas: string = 'getAggregatedVarDatas';

    public static APINAME_getVarParamFromContextFilters: string = 'getVarParamFromContextFilters';

    // public static APINAME_invalidate_cache_intersection: string = 'invalidate_cache_intersection';
    public static APINAME_delete_cache_intersection: string = 'delete_cache_intersection';
    public static APINAME_delete_cache_and_imports_intersection: string = 'delete_cache_and_imports_intersection';

    public static APINAME_invalidate_cache_exact: string = 'invalidate_cache_exact';
    public static APINAME_invalidate_cache_exact_and_parents: string = 'invalidate_cache_exact_and_parents';
    public static APINAME_invalidate_cache_intersection_and_parents: string = 'invalidate_cache_intersection_and_parents';

    public static MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache = 'force_empty_vars_datas_vo_update_cache';

    public static getInstance(): ModuleVar {
        if (!ModuleVar.instance) {
            ModuleVar.instance = new ModuleVar();
        }
        return ModuleVar.instance;
    }

    private static instance: ModuleVar = null;

    public invalidate_cache_exact: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_exact);
    public invalidate_cache_exact_and_parents: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_exact_and_parents);
    public invalidate_cache_intersection_and_parents: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_intersection_and_parents);
    public delete_cache_and_imports_intersection: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_delete_cache_and_imports_intersection);
    public delete_cache_intersection: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_delete_cache_intersection);
    public getVarControllerDSDeps: (var_name: string) => Promise<string[]> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarControllerDSDeps);
    public getVarControllerVarsDeps: (var_name: string) => Promise<{ [dep_name: string]: string }> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarControllerVarsDeps);
    public getParamDependencies: (param: VarDataBaseVO) => Promise<{ [dep_id: string]: VarDataBaseVO }> = APIControllerWrapper.sah(ModuleVar.APINAME_getParamDependencies);
    public getVarParamDatas: (param: VarDataBaseVO) => Promise<{ [ds_name: string]: string }> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarParamDatas);
    public getAggregatedVarDatas: (param: VarDataBaseVO) => Promise<{ [var_data_index: string]: VarDataBaseVO }> = APIControllerWrapper.sah(ModuleVar.APINAME_getAggregatedVarDatas);
    public register_params: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_register_params);
    public update_params_registration: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_update_params_registration);
    public unregister_params: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_unregister_params);
    public get_var_id_by_names: () => Promise<VarConfIds> = APIControllerWrapper.sah(ModuleVar.APINAME_get_var_id_by_names);

    public get_var_data: <T extends VarDataBaseVO>(var_data_index: string) => Promise<T> = APIControllerWrapper.sah(ModuleVar.APINAME_get_var_data);

    public getVarParamFromContextFilters: (
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        accept_max_ranges?: boolean,
    ) => Promise<VarDataBaseVO> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarParamFromContextFilters, null, (
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        accept_max_ranges?: boolean,
    ): boolean => {

        if (!var_name) {
            return false;
        }

        /**
         * On refuse de lancer une requête si on a explicitement pas de filtre custom, alors qu'on en attend un
         */

        // On définit qu'on attend un custom param si on a du ts_ranges ou du hour_ranges pour le moment
        let fields = MatroidController.getMatroidFields(VarsController.var_conf_by_name[var_name].var_data_vo_type);
        if (!fields) {
            // très improbable...
            return true;
        }

        let ts_ranges_fields = fields.filter((field) =>
            (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)
        );

        if (!ts_ranges_fields || !ts_ranges_fields.length) {
            return true;
        }

        for (let i in ts_ranges_fields) {
            if (!custom_filters[ts_ranges_fields[i].field_id]) {
                return false;
            }
        }

        return true;
    }, null);

    public initializedasync_VarsController: boolean = false;

    private constructor() {

        super("var", ModuleVar.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeVarPixelFieldConfVO();
        this.initializeVarConfVO();
        this.initializeVarCacheConfVO();
        this.initializeVarDataValueResVO();

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache] = null;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_register_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_update_params_registration,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_unregister_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, { [dep_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerVarsDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, string[]>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerDSDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [dep_id: string]: VarDataBaseVO }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getParamDependencies,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [ds_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarParamDatas,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetVarParamFromContextFiltersParamVO, VarDataBaseVO>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_getVarParamFromContextFilters,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            GetVarParamFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [var_data_index: string]: VarDataBaseVO }>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_getAggregatedVarDatas,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, VarConfIds>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_get_var_id_by_names,
            [VarConfVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<StringParamVO, VarDataBaseVO>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_get_var_data,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_delete_cache_and_imports_intersection,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_delete_cache_intersection,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_exact_and_parents,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_exact,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_intersection_and_parents,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));
    }

    public async initializeasync(var_conf_by_id: { [var_id: number]: VarConfVO } = null) {
        if (this.initializedasync_VarsController) {
            return;
        }
        this.initializedasync_VarsController = true;

        if (!var_conf_by_id) {
            VarsController.initialize(VOsTypesManager.vosArray_to_vosByIds(await query(VarConfVO.API_TYPE_ID).select_vos<VarConfVO>()));
        } else {
            VarsController.initialize(var_conf_by_id);
        }
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.initializeasync();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await this.initializeasync();
        return true;
    }


    public get_ts_ranges_from_custom_filter(custom_filter: ContextFilterVO, limit_nb_range): TSRange[] {
        let res: TSRange[] = [];

        /**
         * On va chercher par type, et on décide d'un ordre de priorité. Le but étant d'être le plus discriminant possible pour éviter de dépasser la limite du nombre de ranges
         *  Par exemple sur un filtre 2019, 2020 | janvier, février, mars | lundi, jeudi
         *      si on prend lundi, jeudi en premier, sur un max_range initial, on se retrouve avec une "infinité" de ranges.
         *      par contre si on commence par limiter à 2019 et 2020 on a 1 range, puis 2 avec le découpage mois, puis ~60 avec les découpages lundi et jeudi donc là ça passe
         */
        if (!custom_filter) {
            return [RangeHandler.getMaxTSRange()];
        }

        // si on a un filtre direct (x ranges par exemple) on gère directement
        if ((custom_filter.filter_type == ContextFilterVO.TYPE_DATE_INTERSECTS) && !!custom_filter.param_tsranges) {
            return custom_filter.param_tsranges;
        }

        /**
         * Si on a pas de filtre année, on peut de toutes façons rien faire
         */
        let year = ContextFilterVOHandler.getInstance().find_context_filter_by_type(custom_filter, ContextFilterVO.TYPE_DATE_YEAR);
        if (!year) {
            return [RangeHandler.getMaxTSRange()];
        }

        let tsranges = this.get_ts_ranges_from_custom_filter_year(year, limit_nb_range);
        if (!tsranges) {
            return null;
        }

        let month = ContextFilterVOHandler.getInstance().find_context_filter_by_type(custom_filter, ContextFilterVO.TYPE_DATE_MONTH);
        if (!!month) {
            tsranges = this.get_ts_ranges_from_custom_filter_month(tsranges, month, limit_nb_range);
        }

        let week = ContextFilterVOHandler.getInstance().find_context_filter_by_type(custom_filter, ContextFilterVO.TYPE_DATE_WEEK);
        if (!!week) {
            throw new Error('Not implemented');
            // tsranges = this.get_ts_ranges_from_custom_filter_week(tsranges, week, limit_nb_range);
        }

        let dow = ContextFilterVOHandler.getInstance().find_context_filter_by_type(custom_filter, ContextFilterVO.TYPE_DATE_DOW);
        if (!!dow) {
            tsranges = this.get_ts_ranges_from_custom_filter_dow(tsranges, dow, limit_nb_range);
        }


        let dom = ContextFilterVOHandler.getInstance().find_context_filter_by_type(custom_filter, ContextFilterVO.TYPE_DATE_DOM);
        if (!!dom) {
            tsranges = this.get_ts_ranges_from_custom_filter_dom(tsranges, dom, limit_nb_range);
        }

        return tsranges;
    }

    public get_ts_ranges_from_custom_filter_dom(tsranges: TSRange[], custom_filter: ContextFilterVO, limit_nb_range): TSRange[] {
        let numranges: NumRange[] = null;

        if (custom_filter.param_numeric != null) {
            numranges = [RangeHandler.create_single_elt_NumRange(custom_filter.param_numeric, NumSegment.TYPE_INT)];
        }

        numranges = numranges ? numranges : custom_filter.param_numranges;

        if (!(numranges?.length > 0)) {
            return tsranges;
        }

        if ((RangeHandler.getCardinalFromArray(tsranges) * numranges.length) > limit_nb_range) {
            return null;
        }

        let res: TSRange[] = [];
        RangeHandler.foreach_ranges_sync(tsranges, (day: number) => {

            RangeHandler.foreach_ranges_sync(numranges, (dom: number) => {

                if (dom == Dates.date(day)) {
                    res.push(RangeHandler.create_single_elt_TSRange(day, TimeSegment.TYPE_DAY));
                }
            });
        }, TimeSegment.TYPE_DAY);

        if (res && res.length) {
            res = RangeHandler.getRangesUnion(res);
        }
        return res;
    }

    public get_ts_ranges_from_custom_filter_dow(tsranges: TSRange[], custom_filter: ContextFilterVO, limit_nb_range): TSRange[] {
        let numranges: NumRange[] = null;

        if (custom_filter.param_numeric != null) {
            numranges = [RangeHandler.create_single_elt_NumRange(custom_filter.param_numeric, NumSegment.TYPE_INT)];
        }

        numranges = numranges ? numranges : custom_filter.param_numranges;

        if ((!numranges) || (!numranges.length)) {
            return tsranges;
        }

        if ((RangeHandler.getCardinalFromArray(tsranges) * numranges.length) > limit_nb_range) {
            return null;
        }

        let res: TSRange[] = [];
        RangeHandler.foreach_ranges_sync(tsranges, (day: number) => {

            RangeHandler.foreach_ranges_sync(numranges, (dow: number) => {

                if (dow == Dates.isoWeekday(day)) {
                    res.push(RangeHandler.create_single_elt_TSRange(day, TimeSegment.TYPE_DAY));
                }
            });
        }, TimeSegment.TYPE_DAY);

        if (res && res.length) {
            res = RangeHandler.getRangesUnion(res);
        }
        return res;
    }

    public get_ts_ranges_from_custom_filter_month(tsranges: TSRange[], custom_filter: ContextFilterVO, limit_nb_range): TSRange[] {
        let numranges: NumRange[] = null;

        if (custom_filter.param_numeric != null) {
            numranges = [RangeHandler.create_single_elt_NumRange(custom_filter.param_numeric, NumSegment.TYPE_INT)];
        }

        numranges = numranges ? numranges : custom_filter.param_numranges;

        if ((!numranges) || (!numranges.length)) {
            return tsranges;
        }

        if ((RangeHandler.getCardinalFromArray(tsranges) * numranges.length) > limit_nb_range) {
            return null;
        }

        let res: TSRange[] = [];
        RangeHandler.foreach_ranges_sync(tsranges, (year: number) => {

            RangeHandler.foreach_ranges_sync(numranges, (month_i: number) => {

                res.push(RangeHandler.create_single_elt_TSRange(Dates.add(year, month_i - 1, TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH));
            });
        });

        if (res && res.length) {
            res = RangeHandler.getRangesUnion(res);
        }
        return res;
    }

    public get_ts_ranges_from_custom_filter_year(custom_filter: ContextFilterVO, limit_nb_range): TSRange[] {
        if (custom_filter.param_numeric != null) {
            return [RangeHandler.create_single_elt_TSRange(Dates.startOf(Dates.year(0, custom_filter.param_numeric), TimeSegment.TYPE_YEAR), TimeSegment.TYPE_YEAR)];
        }

        if (custom_filter.param_numranges && (custom_filter.param_numranges.length > limit_nb_range)) {
            return null;
        }

        let res: TSRange[] = [];
        RangeHandler.foreach_ranges_sync(custom_filter.param_numranges, (year: number) => {
            res.push(RangeHandler.create_single_elt_TSRange(Dates.startOf(Dates.year(0, year), TimeSegment.TYPE_YEAR), TimeSegment.TYPE_YEAR));
        });
        return res;
    }

    /**
     * On veut rajouter les colonnes qui extraient les IDs des différentes dimensions dont on pourra avoir besoin pour les vars
     * @param context_query
     * @param varcolumn_conf
     */
    public async add_vars_params_columns_for_ref_ids(
        context_query_actuelle: ContextQueryVO,
        columns: TableColumnDescVO[]
    ) {

        // On garde l'état initial de la query pour avoir les fields sans les vars qu'on ajoute pour les ignores de filtres potentiels
        let context_query_initiale = context_query_actuelle.clone();

        // d'un côté on gère les colonnes qui ont pas d'exclusion de filtre, et de l'autre celles qui en ont
        // Dans le cas des exclusions de filtre, on doit faire une sous requete, avec un left join, donc c'est plus compliqué on doit gérer ça à part
        this.add_vars_params_columns_for_ref_ids_without_excluded_filters(context_query_actuelle, columns);
        await this.add_vars_params_columns_for_ref_ids_with_excluded_filters(
            context_query_initiale,
            context_query_actuelle,
            columns);
    }

    public page_widgets_ids_to_exclude_as_alias_prefix(do_not_user_filter_active_ids: number[]): string {

        if ((!do_not_user_filter_active_ids) || (!do_not_user_filter_active_ids.length)) {
            return '';
        }

        return '_pwids2excl__' + do_not_user_filter_active_ids.join('_') + '__';
    }

    public get_var_param_field_name(api_type_id: string, field_id: string, page_widgets_ids_to_exclude_as_alias_prefix: string = null): string {
        return ModuleVar.VARPARAMFIELD_PREFIX + (page_widgets_ids_to_exclude_as_alias_prefix ? page_widgets_ids_to_exclude_as_alias_prefix : '') + api_type_id + '_' + field_id;
    }

    public clean_rows_of_varparamfields(rows: IDistantVOBase[], context_query: ContextQueryVO) {
        for (let i in rows) {
            let row = rows[i];

            for (let field_name in row) {
                if (field_name.indexOf(ModuleVar.VARPARAMFIELD_PREFIX) == 0) {
                    delete row[field_name];
                }
            }
        }

        for (let i in context_query.fields) {
            let field = context_query.fields[i];

            if (field.alias.indexOf(ModuleVar.VARPARAMFIELD_PREFIX) == 0) {
                context_query.remove_field(parseInt(i));
            }
        }
    }

    /**
     * On construit le param en fonction des éléments de la ligne d'une part pour les dimensions de type ref, et d'autre part vo les custom_filters pour les dimensions de type ts
     */
    public getVarParamFromDataRow(
        row: any,
        column: TableColumnDescVO,
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        limit_nb_ts_ranges_on_param_by_context_filter: number = null,
        accept_max_ranges: boolean = false) {

        let var_conf = VarsController.var_conf_by_id[column.var_id];
        let var_param: VarDataBaseVO = VarDataBaseVO.createNew(var_conf.name);
        let matroid_fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);
        let refuse_param: boolean = false;

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            switch (matroid_field.field_type) {
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                    if (matroid_field.has_relation) {

                        let alias = this.get_var_param_field_name(matroid_field.manyToOne_target_moduletable.vo_type, matroid_field.target_field);
                        if ((!row[alias]) || !row[alias].length) {
                            refuse_param = true;
                            break;
                        }

                        let ids: number[] = row[alias].map((id) => parseInt(id));
                        var_param[matroid_field.field_id] = RangeHandler.get_ids_ranges_from_list(ids);
                    } else {
                        if (!accept_max_ranges) {
                            // Max range étant interdit sur les registers de var, on force un retour null

                            if (!refuse_param) {
                                ConsoleHandler.error('getVarParamForExport: max range not allowed on registers of var');
                                refuse_param = true;
                            }
                        } else {
                            var_param[matroid_field.field_id] = [RangeHandler.getMaxNumRange()];
                        }
                    }
                    break;
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    if (!accept_max_ranges) {

                        if (!refuse_param) {
                            ConsoleHandler.error('getVarParamForExport: max range not allowed on registers of var');
                            refuse_param = true;
                        }
                    } else {
                        var_param[matroid_field.field_id] = [RangeHandler.getMaxHourRange()];
                    }
                    break;
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    if (!!custom_filters[matroid_field.field_id]) {
                        // Sur ce système on a un problème il faut limiter à tout prix le nombre de possibilités renvoyées.
                        // on compte en nombre de range et non en cardinal
                        // et on limite à la limite configurée dans l'application
                        var_param[matroid_field.field_id] = this.get_ts_ranges_from_custom_filter(custom_filters[matroid_field.field_id], limit_nb_ts_ranges_on_param_by_context_filter);

                        if ((!var_param[matroid_field.field_id]) || (!var_param[matroid_field.field_id].length)) {
                            if (!accept_max_ranges) {

                                if (!refuse_param) {
                                    ConsoleHandler.error('getVarParamForExport: max range not allowed on registers of var');
                                    refuse_param = true;
                                }

                            } else {
                                var_param[matroid_field.field_id] = [RangeHandler.getMaxNumRange()];
                            }
                        }
                        break;
                    }

                    // Max range étant interdit sur les registers de var, on force un retour null
                    if (!accept_max_ranges) {

                        if (!refuse_param) {
                            ConsoleHandler.error('getVarParamForExport: max range not allowed on registers of var');
                            refuse_param = true;
                        }

                    } else {
                        var_param[matroid_field.field_id] = [RangeHandler.getMaxTSRange()];
                    }
                    break;
            }
        }

        return refuse_param ? null : var_param;
    }

    private initializeVarPixelFieldConfVO() {

        let datatable_fields = [
            new ModuleTableField('pixel_vo_api_type_id', ModuleTableField.FIELD_TYPE_string, 'pixel_vo_api_type_id', false),
            new ModuleTableField('pixel_vo_field_id', ModuleTableField.FIELD_TYPE_string, 'pixel_vo_field_id', false),
            new ModuleTableField('pixel_param_field_id', ModuleTableField.FIELD_TYPE_string, 'pixel_param_field_id', false),
            new ModuleTableField('pixel_range_type', ModuleTableField.FIELD_TYPE_int, 'pixel_range_type', false),
            new ModuleTableField('pixel_segmentation_type', ModuleTableField.FIELD_TYPE_int, 'pixel_segmentation_type', false)
        ];

        let datatable = new ModuleTable(this, VarPixelFieldConfVO.API_TYPE_ID, () => new VarPixelFieldConfVO(), datatable_fields, null);
        datatable.define_default_label_function((vo: VarPixelFieldConfVO) => vo.pixel_vo_api_type_id + vo.pixel_vo_field_id, null);
        this.datatables.push(datatable);
    }

    private initializeVarConfAutoDepVO(): ModuleTableField<any> {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dep Var conf', false);
        let datatable_fields = [
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type de dep', true, true, VarConfAutoDepVO.DEP_TYPE_STATIC).setEnumValues(VarConfAutoDepVO.DEP_TYPE_LABELS),
            var_id,
            new ModuleTableField('static_value', ModuleTableField.FIELD_TYPE_float, 'Valeur fixe', false, true, 0),
            new ModuleTableField('params_transform_strategies', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Stratégies de transformation des paramètres', false),
        ];

        let datatable = new ModuleTable(this, VarConfAutoDepVO.API_TYPE_ID, () => new VarConfAutoDepVO(), datatable_fields, null, 'Configuration de dependance pour var automatique');
        this.datatables.push(datatable);

        return var_id;
    }

    private initializeVarConfVO() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur').unique();
        let datatable_fields = [
            labelField,

            new ModuleTableField('is_auto', ModuleTableField.FIELD_TYPE_boolean, 'Variable automatisée', true, true, false),
            new ModuleTableField('auto_operator', ModuleTableField.FIELD_TYPE_enum, 'Opérateur automatisé', false).setEnumValues(VarConfVO.AUTO_OPERATEUR_LABELS),

            new ModuleTableField('auto_deps', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Dépendances automatisées', false),
            new ModuleTableField('auto_vofieldref_api_type_id', ModuleTableField.FIELD_TYPE_string, 'API_TYPE_ID vofieldref automatisé', false),
            new ModuleTableField('auto_vofieldref_field_id', ModuleTableField.FIELD_TYPE_string, 'FILED_ID vofieldref automatisé', false),

            new ModuleTableField('auto_param_fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Fields param automatisé', false),
            new ModuleTableField('auto_param_context_api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'API_TYPE_IDs context automatisé', false),
            new ModuleTableField('auto_param_context_discarded_field_paths', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Discarded field paths context automatisé', false),
            new ModuleTableField('auto_param_context_use_technical_field_versioning', ModuleTableField.FIELD_TYPE_boolean, 'Use technical fields context automatisé', true, true, false),


            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données'),
            new ModuleTableField('segment_types', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Types des segments du matroid', false),
            new ModuleTableField('show_help_tooltip', ModuleTableField.FIELD_TYPE_boolean, 'Afficher la tooltip d\'aide', true, true, false),
            new ModuleTableField('disable_var', ModuleTableField.FIELD_TYPE_boolean, 'Désactiver la variable', true, true, false),

            new ModuleTableField('aggregator', ModuleTableField.FIELD_TYPE_enum, 'Type d\'aggrégation', true, true, VarConfVO.SUM_AGGREGATOR).setEnumValues(VarConfVO.AGGREGATOR_LABELS),

            new ModuleTableField('pixel_activated', ModuleTableField.FIELD_TYPE_boolean, 'Activer la pixellisation', true, true, false),
            new ModuleTableField('pixel_fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Pixeliser sur les champs', false),
            new ModuleTableField('pixel_never_delete', ModuleTableField.FIELD_TYPE_boolean, 'Ne pas supprimer les pixels en cache', true, true, true),
        ];

        let datatable = new ModuleTable(this, VarConfVO.API_TYPE_ID, () => new VarConfVO(undefined, undefined), datatable_fields, labelField);
        this.datatables.push(datatable);
        let var_id = this.initializeVarConfAutoDepVO();
        var_id.addManyToOneRelation(datatable);
    }

    private initializeVarCacheConfVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true).unique();
        let datatable_fields = [
            var_id,

            new ModuleTableField('use_cache_read_ms_to_partial_clean', ModuleTableField.FIELD_TYPE_boolean, 'Stocker lectures + clean auto', true, true, true),

            new ModuleTableField('cache_startegy', ModuleTableField.FIELD_TYPE_enum, 'Stratégie de mise en cache', true, true, 0).setEnumValues(VarCacheConfVO.VALUE_CACHE_STRATEGY_LABELS),
            new ModuleTableField('cache_bdd_only_requested_params', ModuleTableField.FIELD_TYPE_boolean, 'Cacher uniquement les params demandés', true, true, true),

            new ModuleTableField('estimated_ctree_ddeps_try_load_cache_complet_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_try_load_cache_complet_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_try_load_cache_partiel_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_try_load_cache_partiel_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_get_node_deps_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_get_node_deps_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_handle_pixellisation_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_handle_pixellisation_1k_card', true, true, 0.001),

            new ModuleTableField('estimated_load_node_datas_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_load_node_datas_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_compute_node_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_compute_node_1k_card', true, true, 0.001),
        ];

        let datatable = new ModuleTable(this, VarCacheConfVO.API_TYPE_ID, () => new VarCacheConfVO(), datatable_fields, null);
        this.datatables.push(datatable);
        var_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }

    private initializeVarDataValueResVO() {

        let datatable_fields = [
            new ModuleTableField('index', ModuleTableField.FIELD_TYPE_string, 'Index', true),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur', false),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_int, 'Type', true),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date', false),
            new ModuleTableField('is_computing', ModuleTableField.FIELD_TYPE_boolean, 'En cours de calcul...', false, true, false),
        ];

        let datatable = new ModuleTable(this, VarDataValueResVO.API_TYPE_ID, () => new VarDataValueResVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }


    /**
     * Important de ne pas juste faire une sous requete par colonne de var qui aurait des filtres, mais bien essayer de limiter les sous-requetes
     * par ce que le moteur pgsql ne voit pas même si les requetes sont identiques qu'il peut les factoriser... (tester avec explain les futurs versions, mais en 13 c'est KO)
     * Donc on regroupe par la liste des page_widget_ids qu'on refuse puis par api_type_id, puis par field_id
     * FIXME : TODO : tenter de généraliser avec le cas où on refuse 0 ids. Mais dans ce cas pas de sous requetes, donc c'est peut-etre du temps perdu
     * @param context_query_initiale le contexte initial, hors vars
     * @param context_query_actuelle le contexte actuel, avec les vars en cours d'ajout
     * @param columns
     */
    private async add_vars_params_columns_for_ref_ids_with_excluded_filters(
        context_query_initiale: ContextQueryVO,
        context_query_actuelle: ContextQueryVO,
        columns: TableColumnDescVO[]) {

        // On défini le besoin, en identifiant les dimensions qu'on doit charger, c'est à dire les colonnes ID des VOs qui sont utilisées pour les vars de l'export
        let needed_dimensions_by_page_widgets_ids_to_exclude: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: { [api_type_id: string]: { [field_id: string]: boolean } } } = {};
        let matroids_done_by_page_widget_ids_to_exclude: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: { [api_type_id: string]: boolean } } = {};
        let pages_widgets_ids_to_exclude_by_alias_prefix: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: number[] } = {};

        this.init_maps_for_add_vars_params_columns_for_ref_ids_with_excluded_filters(columns, needed_dimensions_by_page_widgets_ids_to_exclude, matroids_done_by_page_widget_ids_to_exclude, pages_widgets_ids_to_exclude_by_alias_prefix);

        let all_page_widget_by_id: { [id: number]: DashboardPageWidgetVO } = await this.preload_all_page_widget_by_id(columns);

        // On ajoute ces dimensions dans le contextquery
        let all_page_widget_options_cache_by_id: { [id: number]: any } = {};
        for (let page_widgets_ids_to_exclude_as_alias_prefix in needed_dimensions_by_page_widgets_ids_to_exclude) {
            let needed_dimensions = needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix];

            for (let api_type_id in needed_dimensions) {
                let needed_dimensions_api_type_id = needed_dimensions[api_type_id];

                for (let field_id in needed_dimensions_api_type_id) {

                    let field_alias = this.get_var_param_field_name(api_type_id, field_id, page_widgets_ids_to_exclude_as_alias_prefix);

                    /**
                     * On doit dupliquer la query initiale hors vars
                     *  puis on supprime les filtres correspondants aux page_widgets_ids à exclure
                     *  puis on fait un left join avec la query actuelle (donc avec les colonnes de vars déjà en cours d'ajout) sur la base des colonnes identiques (toutes les colonnes de la requete hors vars)
                     *  et on ajoute une colonne à la requete actuelle pour récupérer les ids des colonnes de vars de cette sous-requete
                     */
                    let sub_query = context_query_initiale.clone();
                    let sub_query_table_alias = 'sub_query_' + field_alias;
                    this.delete_context_filters_for_page_widgets_ids_to_exclude(sub_query, pages_widgets_ids_to_exclude_by_alias_prefix[page_widgets_ids_to_exclude_as_alias_prefix], all_page_widget_by_id, all_page_widget_options_cache_by_id);

                    let sub_query_join_on_fields: ContextQueryJoinOnFieldVO[] = [];

                    for (let i in context_query_initiale.fields) {
                        let field = context_query_initiale.fields[i];

                        if (!field) {
                            continue;
                        }

                        sub_query_join_on_fields.push(ContextQueryJoinOnFieldVO.createNew(
                            sub_query_table_alias,
                            field_alias,
                            api_type_id,
                            field_id
                        ));
                    }

                    context_query_actuelle.join_context_query(sub_query, sub_query_table_alias, ContextQueryJoinVO.JOIN_TYPE_LEFT_JOIN, sub_query_join_on_fields);
                    // On ajoute la colonne à la requete actuelle - ARRAY_AGG(DISTINCT sub_query_table_alias.field_alias) as field_alias
                    context_query_actuelle.field(null, field_alias, sub_query_table_alias, VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT);
                }
            }
        }
    }

    private delete_context_filters_for_page_widgets_ids_to_exclude(
        context_query: ContextQueryVO,
        page_widgets_ids_to_exclude: number[],
        all_page_widget_by_id: { [id: number]: DashboardPageWidgetVO },
        all_page_widget_options_cache_by_id: { [id: number]: any }
    ) {

        for (let i in page_widgets_ids_to_exclude) {
            let page_filter_id = page_widgets_ids_to_exclude[i];

            let page_widget: DashboardPageWidgetVO = all_page_widget_by_id[page_filter_id];
            if (!page_widget) {
                continue;
            }

            if (!all_page_widget_options_cache_by_id[page_widget.id]) {
                all_page_widget_options_cache_by_id[page_widget.id] = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
            }
            let page_widget_options = all_page_widget_options_cache_by_id[page_widget.id];

            if (page_widget_options?.vo_field_ref) {

                let new_filters = [];
                for (let j in context_query.filters) {
                    let filter = context_query.filters[j];

                    if (!filter) {
                        continue;
                    }

                    if ((filter.field_id == page_widget_options.vo_field_ref.field_id) &&
                        (filter.vo_type == page_widget_options.vo_field_ref.api_type_id)) {
                        continue;
                    }

                    new_filters.push(filter);
                }
                context_query.filters = new_filters;
            }
        }
    }

    private init_maps_for_add_vars_params_columns_for_ref_ids_with_excluded_filters(
        columns: TableColumnDescVO[],
        needed_dimensions_by_page_widgets_ids_to_exclude: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: { [api_type_id: string]: { [field_id: string]: boolean } } },
        matroids_done_by_page_widget_ids_to_exclude: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: { [api_type_id: string]: boolean } },
        pages_widgets_ids_to_exclude_by_alias_prefix: { [page_widgets_ids_to_exclude_as_alias_prefix: string]: number[] }
    ) {

        for (let j in columns) {
            let column: TableColumnDescVO = columns[j];

            if (!column) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            if (!column.do_not_user_filter_active_ids || !column.do_not_user_filter_active_ids.length) {
                continue;
            }

            let page_widgets_ids_to_exclude_as_alias_prefix = this.page_widgets_ids_to_exclude_as_alias_prefix(column.do_not_user_filter_active_ids);

            if (!pages_widgets_ids_to_exclude_by_alias_prefix[page_widgets_ids_to_exclude_as_alias_prefix]) {
                pages_widgets_ids_to_exclude_by_alias_prefix[page_widgets_ids_to_exclude_as_alias_prefix] = column.do_not_user_filter_active_ids;
            }

            let varconf: VarConfVO = VarsController.var_conf_by_id[column.var_id];

            if (!varconf) {
                ConsoleHandler.error('add_vars_params_columns_for_ref_ids:varconf not found:' + column.var_id);
                continue;
            }

            let matroid_api_type_id = varconf.var_data_vo_type;
            if (!matroids_done_by_page_widget_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix]) {
                matroids_done_by_page_widget_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix] = {};
            }

            if (matroids_done_by_page_widget_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix][matroid_api_type_id]) {
                continue;
            }
            matroids_done_by_page_widget_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix][matroid_api_type_id] = true;

            let matroid_fields = MatroidController.getMatroidFields(matroid_api_type_id);

            if (!matroid_fields) {
                continue;
            }

            for (let i in matroid_fields) {
                let matroid_field: ModuleTableField<any> = matroid_fields[i];

                if ((!matroid_field) || (!matroid_field.manyToOne_target_moduletable)) {
                    continue;
                }

                let matroid_field_api_type_id: string = matroid_field.manyToOne_target_moduletable.vo_type;
                let matroid_field_name: string = matroid_field.target_field;

                if (!needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix]) {
                    needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix] = {};
                }
                if (!needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix][matroid_field_api_type_id]) {
                    needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix][matroid_field_api_type_id] = {};
                }

                needed_dimensions_by_page_widgets_ids_to_exclude[page_widgets_ids_to_exclude_as_alias_prefix][matroid_field_api_type_id][matroid_field_name] = true;
            }
        }
    }

    private add_vars_params_columns_for_ref_ids_without_excluded_filters(context_query: ContextQueryVO, columns: TableColumnDescVO[]) {

        // On défini le besoin, en identifiant les dimensions qu'on doit charger, c'est à dire les colonnes ID des VOs qui sont utilisées pour les vars de l'export
        let needed_dimensions: { [api_type_id: string]: { [field_id: string]: boolean } } = {};
        let matroids_done: { [api_type_id: string]: boolean } = {};

        for (let j in columns) {
            let column: TableColumnDescVO = columns[j];

            if (!column) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            if (column.do_not_user_filter_active_ids && column.do_not_user_filter_active_ids.length) {
                continue;
            }

            let varconf: VarConfVO = VarsController.var_conf_by_id[column.var_id];

            if (!varconf) {
                ConsoleHandler.error('add_vars_params_columns_for_ref_ids:varconf not found:' + column.var_id);
                continue;
            }

            let matroid_api_type_id = varconf.var_data_vo_type;
            if (matroids_done[matroid_api_type_id]) {
                continue;
            }
            matroids_done[matroid_api_type_id] = true;

            let matroid_fields = MatroidController.getMatroidFields(matroid_api_type_id);

            if (!matroid_fields) {
                continue;
            }

            for (let i in matroid_fields) {
                let matroid_field: ModuleTableField<any> = matroid_fields[i];

                if ((!matroid_field) || (!matroid_field.manyToOne_target_moduletable)) {
                    continue;
                }

                let matroid_field_api_type_id: string = matroid_field.manyToOne_target_moduletable.vo_type;
                let matroid_field_name: string = matroid_field.target_field;

                if (!needed_dimensions[matroid_field_api_type_id]) {
                    needed_dimensions[matroid_field_api_type_id] = {};
                }

                needed_dimensions[matroid_field_api_type_id][matroid_field_name] = true;
            }
        }

        // On ajoute ces dimensions dans le contextquery
        for (let api_type_id in needed_dimensions) {
            let needed_dimensions_api_type_id = needed_dimensions[api_type_id];

            for (let field_id in needed_dimensions_api_type_id) {

                let field_alias = this.get_var_param_field_name(api_type_id, field_id);

                context_query.add_field(field_id, field_alias, api_type_id, VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT);
            }
        }
    }

    private async preload_all_page_widget_by_id(columns: TableColumnDescVO[]): Promise<{ [id: number]: DashboardPageWidgetVO }> {
        let all_page_widget_by_id: { [id: number]: DashboardPageWidgetVO } = {};
        let promises = [];

        for (let j in columns) {
            let column: TableColumnDescVO = columns[j];

            if (!column) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            if (!column.do_not_user_filter_active_ids || !column.do_not_user_filter_active_ids.length) {
                continue;
            }

            for (let i in column.do_not_user_filter_active_ids) {
                let page_filter_id = column.do_not_user_filter_active_ids[i];

                if (!!all_page_widget_by_id[page_filter_id]) {
                    continue;
                }

                promises.push((async () => {
                    all_page_widget_by_id[page_filter_id] = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_id(page_filter_id).select_vo<DashboardPageWidgetVO>();
                })());
            }
        }

        await all_promises(promises);

        return all_page_widget_by_id;
    }
}
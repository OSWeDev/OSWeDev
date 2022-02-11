import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ContextFilterVO from './vos/ContextFilterVO';
import GetDatatableRowsCountFromContextFiltersParamVO, { GetDatatableRowsCountFromContextFiltersParamVOStatic } from './vos/GetDatatableRowsCountFromContextFiltersParamVO';
import GetDatatableRowsFromContextFiltersParamVO, { GetDatatableRowsFromContextFiltersParamVOStatic } from './vos/GetDatatableRowsFromContextFiltersParamVO';
import GetDatatableVosCountFromContextFiltersParamVO, { GetDatatableVosCountFromContextFiltersParamVOStatic } from './vos/GetDatatableVosCountFromContextFiltersParamVO';
import GetOptionsForDeleteVosByContextParamVO, { GetOptionsForDeleteVosByContextParamVOStatic } from './vos/GetOptionsForDeleteVosByContextParamVO';
import GetOptionsForUpdateVosByContextParamVO, { GetOptionsForUpdateVosByContextParamVOStatic } from './vos/GetOptionsForUpdateVosByContextParamVO';
import GetOptionsForVosByContextParamVO, { GetOptionsForVosByContextParamVOStatic } from './vos/GetOptionsForVosByContextParamVO';
import GetOptionsFromContextFiltersParamVO, { GetOptionsFromContextFiltersParamVOStatic } from './vos/GetOptionsFromContextFiltersParamVO';
import SortByVO from './vos/SortByVO';

export default class ModuleContextFilter extends Module {

    public static MODULE_NAME: string = "ContextFilter";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleContextFilter.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleContextFilter.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_get_filter_visible_options: string = "get_filter_visible_options";
    public static APINAME_get_filtered_datatable_rows: string = "get_filtered_datatable_rows";
    public static APINAME_query_rows_count_from_active_filters: string = "query_rows_count_from_active_filters";
    public static APINAME_query_vos_from_active_filters: string = "query_vos_from_active_filters";
    public static APINAME_delete_vos_from_active_filters: string = "delete_vos_from_active_filters";
    public static APINAME_update_vos_from_active_filters: string = "update_vos_from_active_filters";
    public static APINAME_query_vos_count_from_active_filters: string = "query_vos_count_from_active_filters";

    public static getInstance(): ModuleContextFilter {
        if (!ModuleContextFilter.instance) {
            ModuleContextFilter.instance = new ModuleContextFilter();
        }
        return ModuleContextFilter.instance;
    }

    private static instance: ModuleContextFilter = null;

    public get_filtered_datatable_rows: (
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases: string[]) => Promise<any[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_get_filtered_datatable_rows);

    public query_rows_count_from_active_filters: (
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ) => Promise<number> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_query_rows_count_from_active_filters);

    public query_vos_count_from_active_filters: (
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ) => Promise<number> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_query_vos_count_from_active_filters);

    public query_vos_from_active_filters: <T extends IDistantVOBase>(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
    ) => Promise<T[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_query_vos_from_active_filters);

    public delete_vos_from_active_filters: (
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ) => Promise<void> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_delete_vos_from_active_filters);

    public update_vos_from_active_filters: (
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        update_field_id: string,
        new_api_translated_value: any
    ) => Promise<void> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_update_vos_from_active_filters);

    public get_filter_visible_options: (
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        actual_query: string,
        limit: number,
        offset: number) => Promise<DataFilterOption[]> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_get_filter_visible_options);

    private constructor() {

        super("contextfilter", ModuleContextFilter.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.init_ContextFilterVO();
        this.init_SortByVO();
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetOptionsFromContextFiltersParamVO, DataFilterOption[]>(
            null,
            ModuleContextFilter.APINAME_get_filter_visible_options,
            null,
            GetOptionsFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetDatatableRowsFromContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_get_filtered_datatable_rows,
            null,
            GetDatatableRowsFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetDatatableRowsCountFromContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_query_rows_count_from_active_filters,
            null,
            GetDatatableRowsCountFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetDatatableVosCountFromContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_query_vos_count_from_active_filters,
            null,
            GetDatatableVosCountFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetOptionsForVosByContextParamVO, IDistantVOBase[]>(
            null,
            ModuleContextFilter.APINAME_query_vos_from_active_filters,
            null,
            GetOptionsForVosByContextParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetOptionsForDeleteVosByContextParamVO, void>(
            null,
            ModuleContextFilter.APINAME_delete_vos_from_active_filters,
            null,
            GetOptionsForDeleteVosByContextParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetOptionsForUpdateVosByContextParamVO, void>(
            null,
            ModuleContextFilter.APINAME_update_vos_from_active_filters,
            null,
            GetOptionsForUpdateVosByContextParamVOStatic
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
            new ModuleTableField('param_textarray', ModuleTableField.FIELD_TYPE_string_array, 'param_textarray', false),
            new ModuleTableField('param_tsrange', ModuleTableField.FIELD_TYPE_tstz_array, 'param_tsrange', false),
            new ModuleTableField('param_numranges', ModuleTableField.FIELD_TYPE_numrange_array, 'param_numranges', false),
            new ModuleTableField('param_hourranges', ModuleTableField.FIELD_TYPE_hourrange_array, 'param_hourranges', false),

            new ModuleTableField('left_hook', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'left_hook', false).set_plain_obj_cstr(() => new ContextFilterVO()),
            new ModuleTableField('right_hook', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'right_hook', false).set_plain_obj_cstr(() => new ContextFilterVO()),
        ];

        let datatable = new ModuleTable(this, ContextFilterVO.API_TYPE_ID, () => new ContextFilterVO(), datatable_fields, null, "Filtre contextuel");
        this.datatables.push(datatable);
    }
}
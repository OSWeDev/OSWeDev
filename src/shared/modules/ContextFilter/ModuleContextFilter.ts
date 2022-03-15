import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ContextFilterVO from './vos/ContextFilterVO';
import ContextQueryVO from './vos/ContextQueryVO';
import DeleteVosParamVO, { DeleteVosParamVOStatic } from './vos/DeleteVosParamVO';
import SelectFilterVisibleOptionsParamVO, { SelectFilterVisibleOptionsParamVOStatic } from './vos/GetOptionsFromContextFiltersParamVO';
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

    public static APINAME_select_filter_visible_options: string = "select_filter_visible_options";
    public static APINAME_select_datatable_rows: string = "select_datatable_rows";
    public static APINAME_select_count: string = "select_count";
    public static APINAME_select_vos: string = "select_vos";
    public static APINAME_delete_vos: string = "delete_vos";
    public static APINAME_update_vos: string = "update_vos";
    public static APINAME_select_vo_from_unique_field: string = "select_vo_from_unique_field";

    public static getInstance(): ModuleContextFilter {
        if (!ModuleContextFilter.instance) {
            ModuleContextFilter.instance = new ModuleContextFilter();
        }
        return ModuleContextFilter.instance;
    }

    private static instance: ModuleContextFilter = null;

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public select_datatable_rows: (
        context_query: ContextQueryVO
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
    public delete_vos: (context_query: ContextQueryVO) => Promise<void> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_delete_vos);

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param update_field_id En cas d'update, le nom du champs cible (sur le base_api_type_id)
     * @param new_api_translated_value En cas d'update, la valeur api_translated (par exemple issue de moduletable.default_get_field_api_version)
     *  qu'on va mettre en remplacement de la valeur actuelle
     */
    public update_vos: (
        context_query: ContextQueryVO, update_field_id: string, new_api_translated_value: any
    ) => Promise<void> = APIControllerWrapper.sah(ModuleContextFilter.APINAME_update_vos);

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
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<SelectFilterVisibleOptionsParamVO, DataFilterOption[]>(
            null,
            ModuleContextFilter.APINAME_select_filter_visible_options,
            null,
            SelectFilterVisibleOptionsParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<SelectDatatableRowsParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_datatable_rows,
            null,
            SelectDatatableRowsParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<SelectCountParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_count,
            null,
            SelectCountParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<QueryVOFromUniqueFieldContextFiltersParamVO, any[]>(
            null,
            ModuleContextFilter.APINAME_select_vo_from_unique_field,
            null,
            QueryVOFromUniqueFieldContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<SelectVosParamVO, IDistantVOBase[]>(
            null,
            ModuleContextFilter.APINAME_select_vos,
            null,
            SelectVosParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<DeleteVosParamVO, void>(
            null,
            ModuleContextFilter.APINAME_delete_vos,
            null,
            DeleteVosParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<UpdateVosParamVO, void>(
            null,
            ModuleContextFilter.APINAME_update_vos,
            null,
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
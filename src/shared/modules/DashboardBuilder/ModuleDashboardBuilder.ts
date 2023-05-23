import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ManyToManyReferenceDatatableFieldVO from '../DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from '../DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from '../DAO/vos/datatable/OneToManyReferenceDatatableFieldVO';
import RefRangesReferenceDatatableFieldVO from '../DAO/vos/datatable/RefRangesReferenceDatatableFieldVO';
import CRUDActionsDatatableFieldVO from '../DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import SelectBoxDatatableFieldVO from '../DAO/vos/datatable/SelectBoxDatatableFieldVO';
import ComponentDatatableFieldVO from '../DAO/vos/datatable/ComponentDatatableFieldVO';
import ComputedDatatableFieldVO from '../DAO/vos/datatable/ComputedDatatableFieldVO';
import SimpleDatatableFieldVO from '../DAO/vos/datatable/SimpleDatatableFieldVO';
import InputDatatableFieldVO from '../DAO/vos/datatable/InputDatatableFieldVO';
import FileDatatableFieldVO from '../DAO/vos/datatable/FileDatatableFieldVO';
import VarDatatableFieldVO from '../DAO/vos/datatable/VarDatatableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VarConfVO from '../Var/vos/VarConfVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import AdvancedDateFilterOptDescVO from './vos/AdvancedDateFilterOptDescVO';
import DashboardFavoritesFiltersVO from './vos/DashboardFavoritesFiltersVO';
import DashboardGraphVORefVO from './vos/DashboardGraphVORefVO';
import DashboardPageWidgetVO from './vos/DashboardPageWidgetVO';
import DashboardWidgetVO from './vos/DashboardWidgetVO';
import TableColumnDescVO from './vos/TableColumnDescVO';
import DashboardPageVO from './vos/DashboardPageVO';
import VOFieldRefVO from './vos/VOFieldRefVO';
import DashboardVO from './vos/DashboardVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';

export default class ModuleDashboardBuilder extends Module {

    public static MODULE_NAME: string = "DashboardBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_START_EXPORT_DATATABLE_USING_FAVORITES_FILTERS: string = "start_export_datatable_using_favorites_filters";

    public static getInstance(): ModuleDashboardBuilder {

        if (!ModuleDashboardBuilder.instance) {
            ModuleDashboardBuilder.instance = new ModuleDashboardBuilder();
        }

        return ModuleDashboardBuilder.instance;
    }

    private static instance: ModuleDashboardBuilder = null;

    public start_export_datatable_using_favorites_filters: () => Promise<void> = APIControllerWrapper.sah(ModuleDashboardBuilder.APINAME_START_EXPORT_DATATABLE_USING_FAVORITES_FILTERS);

    private constructor() {

        super("dashboardbuilder", ModuleDashboardBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        // Load all users favorites filters and start exporting by using their filters
        APIControllerWrapper.registerApi(new PostAPIDefinition<void, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DashboardFavoritesFiltersVO.API_TYPE_ID),
            ModuleDashboardBuilder.APINAME_START_EXPORT_DATATABLE_USING_FAVORITES_FILTERS,
            [DashboardFavoritesFiltersVO.API_TYPE_ID]
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let db_table = this.init_DashboardVO();

        let db_page = this.init_DashboardPageVO(db_table);

        this.init_DashboardFavoritesFiltersVO(db_page);

        this.init_DashboardGraphVORefVO(db_table);
        let db_widget = this.init_DashboardWidgetVO();
        this.init_DashboardPageWidgetVO(db_page, db_widget);
        this.init_VOFieldRefVO();
        this.init_TableColumnDescVO();
        this.init_AdvancedDateFilterOptDescVO();

        this.initialize_ComponentDatatableFieldVO();
        this.initialize_ComputedDatatableFieldVO();
        this.initialize_CRUDActionsDatatableFieldVO();
        this.initialize_FileDatatableFieldVO();
        this.initialize_InputDatatableFieldVO();
        this.initialize_ManyToManyReferenceDatatableFieldVO();
        this.initialize_ManyToOneReferenceDatatableFieldVO();
        this.initialize_OneToManyReferenceDatatableFieldVO();
        this.initialize_RefRangesReferenceDatatableFieldVO();
        this.initialize_SelectBoxDatatableFieldVO();
        this.initialize_SimpleDatatableFieldVO();
        this.initialize_VarDatatableFieldVO();
    }

    private init_DashboardVO(): ModuleTable<any> {

        let datatable_fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'Types', false)
        ];

        let res = new ModuleTable(this, DashboardVO.API_TYPE_ID, () => new DashboardVO(), datatable_fields, null, "Dashboards");
        this.datatables.push(res);
        return res;
    }


    private init_DashboardGraphVORefVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true),
            new ModuleTableField('width', ModuleTableField.FIELD_TYPE_int, 'largeur', true),
            new ModuleTableField('height', ModuleTableField.FIELD_TYPE_int, 'hauteur', true),
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'VOType', true),
            new ModuleTableField('values_to_exclude', ModuleTableField.FIELD_TYPE_string_array, 'field_id des liens à exclure'),
        ];

        let res = new ModuleTable(this, DashboardGraphVORefVO.API_TYPE_ID, () => new DashboardGraphVORefVO(), datatable_fields, null, "Cellule du graph de vos de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardPageVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('hide_navigation', ModuleTableField.FIELD_TYPE_boolean, 'Cacher la navigation', true, true, false),
            new ModuleTableField('group_filters', ModuleTableField.FIELD_TYPE_boolean, 'Grouper les filtres', false, true, false),
        ];

        let res = new ModuleTable(this, DashboardPageVO.API_TYPE_ID, () => new DashboardPageVO(), datatable_fields, null, "Pages de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardWidgetVO(): ModuleTable<any> {

        let name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true).unique();

        let datatable_fields = [
            name,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('widget_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Widget', true),
            new ModuleTableField('options_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Options', true),
            new ModuleTableField('icon_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Icône', true),
            new ModuleTableField('default_width', ModuleTableField.FIELD_TYPE_int, 'Largeur par défaut', true, true, 106),
            new ModuleTableField('default_height', ModuleTableField.FIELD_TYPE_int, 'Hauteur par défaut', true, true, 30),
            new ModuleTableField('default_background', ModuleTableField.FIELD_TYPE_string, 'default_background', true, true, '#f5f5f5'),
            new ModuleTableField('is_filter', ModuleTableField.FIELD_TYPE_boolean, 'is_filter'),
            new ModuleTableField('is_validation_filters', ModuleTableField.FIELD_TYPE_boolean, 'is_validation_filters'),
        ];

        let res = new ModuleTable(this, DashboardWidgetVO.API_TYPE_ID, () => new DashboardWidgetVO(), datatable_fields, name, "Widgets de Dashboard");

        this.datatables.push(res);

        return res;
    }

    private init_DashboardPageWidgetVO(db_page: ModuleTable<any>, db_widget: ModuleTable<any>) {

        let widget_id = new ModuleTableField('widget_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Widget', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        let datatable_fields = [
            widget_id,
            page_id,
            new ModuleTableField('isDraggable', ModuleTableField.FIELD_TYPE_boolean, 'isDraggable', true, true, true),
            new ModuleTableField('isResizable', ModuleTableField.FIELD_TYPE_boolean, 'isResizable', true, true, true),
            new ModuleTableField('static', ModuleTableField.FIELD_TYPE_boolean, 'static', true, true, false),
            new ModuleTableField('minH', ModuleTableField.FIELD_TYPE_int, 'minH', false, true, 1),
            new ModuleTableField('minW', ModuleTableField.FIELD_TYPE_int, 'minW', false, true, 1),
            new ModuleTableField('maxH', ModuleTableField.FIELD_TYPE_int, 'maxH', false, true, 720),
            new ModuleTableField('maxW', ModuleTableField.FIELD_TYPE_int, 'maxW', false, true, 1272),
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true, true, 0),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true, true, 0),
            new ModuleTableField('w', ModuleTableField.FIELD_TYPE_int, 'w', true, true, 0),
            new ModuleTableField('h', ModuleTableField.FIELD_TYPE_int, 'h', true, true, 0),
            new ModuleTableField('i', ModuleTableField.FIELD_TYPE_int, 'i', true),
            new ModuleTableField('dragAllowFrom', ModuleTableField.FIELD_TYPE_string, 'dragAllowFrom', false),
            new ModuleTableField('dragIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'dragIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('resizeIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'resizeIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('preserveAspectRatio', ModuleTableField.FIELD_TYPE_boolean, 'preserveAspectRatio', true, true, false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true),

            new ModuleTableField('json_options', ModuleTableField.FIELD_TYPE_string, 'json_options', false),

            new ModuleTableField('background', ModuleTableField.FIELD_TYPE_string, 'background', true),
        ];

        this.datatables.push(new ModuleTable(this, DashboardPageWidgetVO.API_TYPE_ID, () => new DashboardPageWidgetVO(), datatable_fields, null, "Pages de Dashboard"));

        widget_id.addManyToOneRelation(db_widget);
        page_id.addManyToOneRelation(db_page);
    }

    /**
     * Init Dashboard Favorites Filters
     *  - Database table to stock user favorites of active filters
     *  - May be useful to save the actual dashboard, owner_id and page_filters
     */
    private init_DashboardFavoritesFiltersVO(db_page: ModuleTable<any>) {

        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        let datatable_fields = [
            page_id,

            new ModuleTableField('owner_id', ModuleTableField.FIELD_TYPE_string, 'Owner Id', true),
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom des filtres', true),
            new ModuleTableField('field_filters', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Field Filters', false),
            // export_params: Specify frequence (month day number e.g. 1st, 10th or 20)
            new ModuleTableField('export_params', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Export Params', false),
        ];

        this.datatables.push(
            new ModuleTable(
                this,
                DashboardFavoritesFiltersVO.API_TYPE_ID,
                () => new DashboardFavoritesFiltersVO(),
                datatable_fields,
                null,
                "Filtres Favoris"
            )
        );

        page_id.addManyToOneRelation(db_page);
    }

    private init_VOFieldRefVO() {

        let datatable_fields = [
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', true),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        this.datatables.push(new ModuleTable(this, VOFieldRefVO.API_TYPE_ID, () => new VOFieldRefVO(), datatable_fields, null, "Référence de champs"));
    }

    private init_TableColumnDescVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var', false);

        let datatable_fields = [
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type de colonne', true).setEnumValues(TableColumnDescVO.TYPE_LABELS),

            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', false),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', false),

            var_id,
            new ModuleTableField('var_unicity_id', ModuleTableField.FIELD_TYPE_int, 'Unicité pour colonnes de type var', false),

            new ModuleTableField('component_name', ModuleTableField.FIELD_TYPE_string, 'Composant', false),

            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_string, 'Filtre', false),
            new ModuleTableField('filter_additional_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres filtre', false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('many_to_many_aggregate', ModuleTableField.FIELD_TYPE_boolean, 'Aggrégation des liens ManyToMany'),
            new ModuleTableField('disabled_many_to_one_link', ModuleTableField.FIELD_TYPE_boolean, 'Désactiver les liens ManyToOne'),
            new ModuleTableField('is_nullable', ModuleTableField.FIELD_TYPE_boolean, "La donnée peut-être null"),
            new ModuleTableField('show_tooltip', ModuleTableField.FIELD_TYPE_boolean, "Afficher la popup"),
            new ModuleTableField('is_sticky', ModuleTableField.FIELD_TYPE_boolean, "Figer", false, true, false),
            new ModuleTableField('header_name', ModuleTableField.FIELD_TYPE_string, "Entête de colonne"),

            new ModuleTableField('filter_custom_field_filters', ModuleTableField.FIELD_TYPE_plain_vo_obj, "filter_custom_field_filters"),

            new ModuleTableField('show_if_any_filter_active', ModuleTableField.FIELD_TYPE_int_array, "show_if_any_filter_active"),
            new ModuleTableField('do_not_user_filter_active_ids', ModuleTableField.FIELD_TYPE_int_array, "do_not_user_filter_active_ids"),
            new ModuleTableField('readonly', ModuleTableField.FIELD_TYPE_boolean, "Readonly", false, true, true),
            new ModuleTableField('exportable', ModuleTableField.FIELD_TYPE_boolean, "Exportable", false, true, true),
            new ModuleTableField('hide_from_table', ModuleTableField.FIELD_TYPE_boolean, "Masquer de la table", false, true, false),
            new ModuleTableField('can_filter_by', ModuleTableField.FIELD_TYPE_boolean, "Filtrable", false, true, true),

            new ModuleTableField('column_width', ModuleTableField.FIELD_TYPE_int, 'Largeur de la colonne', false),
            new ModuleTableField('default_sort_field', ModuleTableField.FIELD_TYPE_int, 'Default Sort Field', false),

            new ModuleTableField('filter_by_access', ModuleTableField.FIELD_TYPE_string, "Droit d'accès"),

            new ModuleTableField('enum_bg_colors', ModuleTableField.FIELD_TYPE_plain_vo_obj, "Enum BG colors"),
            new ModuleTableField('enum_fg_colors', ModuleTableField.FIELD_TYPE_plain_vo_obj, "Enum FG colors"),

            new ModuleTableField('children', ModuleTableField.FIELD_TYPE_plain_vo_obj, "Enfants"),
            new ModuleTableField('bg_color_header', ModuleTableField.FIELD_TYPE_string, "Header BG color"),
            new ModuleTableField('font_color_header', ModuleTableField.FIELD_TYPE_string, "Header FG color"),
        ];

        this.datatables.push(new ModuleTable(this, TableColumnDescVO.API_TYPE_ID, () => new TableColumnDescVO(), datatable_fields, null, "Référence de champs"));

        var_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }

    private init_AdvancedDateFilterOptDescVO() {

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_int, 'Valeur', false),
            new ModuleTableField('ts_range', ModuleTableField.FIELD_TYPE_tsrange, 'Date', false).set_segmentation_type(TimeSegment.TYPE_DAY),

            new ModuleTableField('search_type', ModuleTableField.FIELD_TYPE_enum, 'Type de recherche').setEnumValues(AdvancedDateFilterOptDescVO.SEARCH_TYPE_LABELS),
            new ModuleTableField('segmentation_type', ModuleTableField.FIELD_TYPE_enum, 'Type de segment').setEnumValues(TimeSegment.TYPE_NAMES_ENUM),
        ];

        this.datatables.push(new ModuleTable(this, AdvancedDateFilterOptDescVO.API_TYPE_ID, () => new AdvancedDateFilterOptDescVO(), datatable_fields, null, "Option filtre date avancé"));
    }


    private initialize_ComponentDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('component_name', ModuleTableField.FIELD_TYPE_string, 'component_name'),
            new ModuleTableField('parameter_datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'parameter_datatable_field_uid'),
        ];

        this.datatables.push(new ModuleTable(this, ComponentDatatableFieldVO.API_TYPE_ID, () => new ComponentDatatableFieldVO(), datatable_fields, null, "ComponentDatatableFieldVO"));
    }

    private initialize_ComputedDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('compute_function_uid', ModuleTableField.FIELD_TYPE_string, 'compute_function_uid'),
        ];

        this.datatables.push(new ModuleTable(this, ComputedDatatableFieldVO.API_TYPE_ID, () => new ComputedDatatableFieldVO(), datatable_fields, null, "ComputedDatatableFieldVO"));
    }

    private initialize_CRUDActionsDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),
        ];

        this.datatables.push(new ModuleTable(this, CRUDActionsDatatableFieldVO.API_TYPE_ID, () => new CRUDActionsDatatableFieldVO(), datatable_fields, null, "CRUDActionsDatatableFieldVO"));
    }

    private initialize_FileDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('parameter_datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'parameter_datatable_field_uid'),
        ];

        this.datatables.push(new ModuleTable(this, FileDatatableFieldVO.API_TYPE_ID, () => new FileDatatableFieldVO(), datatable_fields, null, "FileDatatableFieldVO"));
    }

    private initialize_InputDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('field_type', ModuleTableField.FIELD_TYPE_string, 'field_type'),
        ];

        this.datatables.push(new ModuleTable(this, InputDatatableFieldVO.API_TYPE_ID, () => new InputDatatableFieldVO(), datatable_fields, null, "InputDatatableFieldVO"));
    }

    private initialize_ManyToManyReferenceDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('target_module_table_type_id', ModuleTableField.FIELD_TYPE_string, 'target_module_table_type_id'),
            new ModuleTableField('sortedTargetFields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sortedTargetFields'),

            new ModuleTableField('inter_module_table_type_id', ModuleTableField.FIELD_TYPE_string, 'inter_module_table_type_id'),
            new ModuleTableField('interTargetRefFieldId', ModuleTableField.FIELD_TYPE_string, 'interTargetRefFieldId'),
            new ModuleTableField('interSrcRefFieldId', ModuleTableField.FIELD_TYPE_string, 'interSrcRefFieldId'),
        ];

        this.datatables.push(new ModuleTable(this, ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, () => new ManyToManyReferenceDatatableFieldVO(), datatable_fields, null, "ManyToManyReferenceDatatableFieldVO"));
    }

    private initialize_ManyToOneReferenceDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('target_module_table_type_id', ModuleTableField.FIELD_TYPE_string, 'target_module_table_type_id'),
            new ModuleTableField('sortedTargetFields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sortedTargetFields'),

            new ModuleTableField('_src_field_id', ModuleTableField.FIELD_TYPE_string, '_src_field_id'),
        ];

        this.datatables.push(new ModuleTable(this, ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, () => new ManyToOneReferenceDatatableFieldVO(), datatable_fields, null, "ManyToOneReferenceDatatableFieldVO"));
    }

    private initialize_OneToManyReferenceDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('target_module_table_type_id', ModuleTableField.FIELD_TYPE_string, 'target_module_table_type_id'),
            new ModuleTableField('sortedTargetFields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sortedTargetFields'),

            new ModuleTableField('_dest_field_id', ModuleTableField.FIELD_TYPE_string, '_dest_field_id'),
        ];

        this.datatables.push(new ModuleTable(this, OneToManyReferenceDatatableFieldVO.API_TYPE_ID, () => new OneToManyReferenceDatatableFieldVO(), datatable_fields, null, "OneToManyReferenceDatatableFieldVO"));
    }

    private initialize_RefRangesReferenceDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            new ModuleTableField('target_module_table_type_id', ModuleTableField.FIELD_TYPE_string, 'target_module_table_type_id'),
            new ModuleTableField('sortedTargetFields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'sortedTargetFields'),

            new ModuleTableField('_src_field_id', ModuleTableField.FIELD_TYPE_string, '_src_field_id'),
        ];

        this.datatables.push(new ModuleTable(this, RefRangesReferenceDatatableFieldVO.API_TYPE_ID, () => new RefRangesReferenceDatatableFieldVO(), datatable_fields, null, "RefRangesReferenceDatatableFieldVO"));
    }

    private initialize_SelectBoxDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),
        ];

        this.datatables.push(new ModuleTable(this, SelectBoxDatatableFieldVO.API_TYPE_ID, () => new SelectBoxDatatableFieldVO(), datatable_fields, null, "SelectBoxDatatableFieldVO"));
    }

    private initialize_SimpleDatatableFieldVO() {
        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),
        ];

        this.datatables.push(new ModuleTable(this, SimpleDatatableFieldVO.API_TYPE_ID, () => new SimpleDatatableFieldVO(), datatable_fields, null, "SimpleDatatableFieldVO"));
    }

    private initialize_VarDatatableFieldVO() {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, "Variable");
        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, "Dashboard");

        let datatable_fields = [
            new ModuleTableField('vo_type_id', ModuleTableField.FIELD_TYPE_string, 'vo_type_id'),
            new ModuleTableField('vo_type_full_name', ModuleTableField.FIELD_TYPE_string, 'vo_type_full_name'),
            new ModuleTableField('tooltip', ModuleTableField.FIELD_TYPE_string, 'tooltip'),
            new ModuleTableField('is_required', ModuleTableField.FIELD_TYPE_boolean, 'is_required', true, true, false),
            new ModuleTableField('is_readonly', ModuleTableField.FIELD_TYPE_boolean, 'is_readonly', true, true, false),
            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'hidden', true, true, false),
            new ModuleTableField('hiden_export', ModuleTableField.FIELD_TYPE_boolean, 'hiden_export', true, true, false),
            new ModuleTableField('hidden_print', ModuleTableField.FIELD_TYPE_boolean, 'hidden_print', true, true, false),
            new ModuleTableField('force_toggle_button', ModuleTableField.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false),
            new ModuleTableField('translatable_place_holder', ModuleTableField.FIELD_TYPE_string, 'translatable_place_holder'),
            new ModuleTableField('select_options_enabled', ModuleTableField.FIELD_TYPE_int_array, 'select_options_enabled'),
            new ModuleTableField('_module_table_field_id', ModuleTableField.FIELD_TYPE_string, '_module_table_field_id'),
            new ModuleTableField('semaphore_auto_update_datatable_field_uid_with_vo_type', ModuleTableField.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'type'),
            new ModuleTableField('datatable_field_uid', ModuleTableField.FIELD_TYPE_string, 'datatable_field_uid'),

            var_id,
            dashboard_id,
            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_string, 'filter_type'),
            new ModuleTableField('filter_additional_params', ModuleTableField.FIELD_TYPE_string, 'filter_additional_params'),
        ];

        this.datatables.push(new ModuleTable(this, VarDatatableFieldVO.API_TYPE_ID, () => new VarDatatableFieldVO(), datatable_fields, null, "VarDatatableFieldVO"));

        var_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        dashboard_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DashboardVO.API_TYPE_ID]);
    }
}
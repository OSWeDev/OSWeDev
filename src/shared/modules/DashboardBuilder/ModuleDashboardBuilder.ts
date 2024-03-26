import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import CRUDActionsDatatableFieldVO from '../DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import ComponentDatatableFieldVO from '../DAO/vos/datatable/ComponentDatatableFieldVO';
import ComputedDatatableFieldVO from '../DAO/vos/datatable/ComputedDatatableFieldVO';
import FileDatatableFieldVO from '../DAO/vos/datatable/FileDatatableFieldVO';
import InputDatatableFieldVO from '../DAO/vos/datatable/InputDatatableFieldVO';
import ManyToManyReferenceDatatableFieldVO from '../DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from '../DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from '../DAO/vos/datatable/OneToManyReferenceDatatableFieldVO';
import RefRangesReferenceDatatableFieldVO from '../DAO/vos/datatable/RefRangesReferenceDatatableFieldVO';
import SelectBoxDatatableFieldVO from '../DAO/vos/datatable/SelectBoxDatatableFieldVO';
import SimpleDatatableFieldVO from '../DAO/vos/datatable/SimpleDatatableFieldVO';
import VarDatatableFieldVO from '../DAO/vos/datatable/VarDatatableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import VarConfVO from '../Var/vos/VarConfVO';
import AdvancedDateFilterOptDescVO from './vos/AdvancedDateFilterOptDescVO';
import DashboardGraphVORefVO from './vos/DashboardGraphVORefVO';
import DashboardPageVO from './vos/DashboardPageVO';
import DashboardPageWidgetVO from './vos/DashboardPageWidgetVO';
import DashboardVO from './vos/DashboardVO';
import DashboardWidgetVO from './vos/DashboardWidgetVO';
import FavoritesFiltersVO from './vos/FavoritesFiltersVO';
import SharedFiltersVO from './vos/SharedFiltersVO';
import TableColumnDescVO from './vos/TableColumnDescVO';
import VOFieldRefVO from './vos/VOFieldRefVO';

export default class ModuleDashboardBuilder extends Module {

    public static MODULE_NAME: string = "DashboardBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_START_EXPORT_FAVORITES_FILTERS_DATATABLE: string = "start_export_favorites_filters_datatable";

    private static instance: ModuleDashboardBuilder = null;
    public start_export_favorites_filters_datatable: () => Promise<void> = APIControllerWrapper.sah(ModuleDashboardBuilder.APINAME_START_EXPORT_FAVORITES_FILTERS_DATATABLE);

    private constructor() {

        super("dashboardbuilder", ModuleDashboardBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDashboardBuilder {

        if (!ModuleDashboardBuilder.instance) {
            ModuleDashboardBuilder.instance = new ModuleDashboardBuilder();
        }

        return ModuleDashboardBuilder.instance;
    }

    public registerApis() {
        // Load all users favorites filters and start exporting by using their filters
        APIControllerWrapper.registerApi(new PostAPIDefinition<void, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, FavoritesFiltersVO.API_TYPE_ID),
            ModuleDashboardBuilder.APINAME_START_EXPORT_FAVORITES_FILTERS_DATATABLE,
            [FavoritesFiltersVO.API_TYPE_ID]
        ));
    }

    public initialize() {
        const db_table = this.init_DashboardVO();

        const db_page = this.init_DashboardPageVO(db_table);
        this.init_shared_filters_vo();

        this.init_FavoritesFiltersVO(db_page);

        this.init_DashboardGraphVORefVO(db_table);
        const db_widget = this.init_DashboardWidgetVO();
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

    private init_DashboardVO(): ModuleTableVO {

        ModuleTableFieldController.create_new(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        const res = ModuleTableController.create_new(this.name, DashboardVO, null, "Dashboards");
        return res;
    }


    private init_DashboardGraphVORefVO(db_table: ModuleTableVO): ModuleTableVO {

        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().dashboard_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Dashboard', true).set_many_to_one_target_moduletable_name(db_table.vo_type);

        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().x, ModuleTableFieldVO.FIELD_TYPE_int, 'x', true);
        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().y, ModuleTableFieldVO.FIELD_TYPE_int, 'y', true);
        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().width, ModuleTableFieldVO.FIELD_TYPE_int, 'largeur', true);
        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().height, ModuleTableFieldVO.FIELD_TYPE_int, 'hauteur', true);
        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'VOType', true);
        ModuleTableFieldController.create_new(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().values_to_exclude, ModuleTableFieldVO.FIELD_TYPE_string_array, 'field_id des liens à exclure');

        const res = ModuleTableController.create_new(this.name, DashboardGraphVORefVO, null, "Cellule du graph de vos de Dashboard");

        return res;
    }

    private init_DashboardPageVO(db_table: ModuleTableVO): ModuleTableVO {

        ModuleTableFieldController.create_new(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().dashboard_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Dashboard', true).set_many_to_one_target_moduletable_name(db_table.vo_type);

        ModuleTableFieldController.create_new(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().hide_navigation, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Cacher la navigation', true, true, false);
        ModuleTableFieldController.create_new(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().group_filters, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Grouper les filtres', false, true, false);

        const res = ModuleTableController.create_new(this.name, DashboardPageVO, null, "Pages de Dashboard");

        return res;
    }

    private init_DashboardWidgetVO(): ModuleTableVO {

        const name = ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();

        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().widget_component, ModuleTableFieldVO.FIELD_TYPE_string, 'Composant - Widget', true);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().options_component, ModuleTableFieldVO.FIELD_TYPE_string, 'Composant - Options', true);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().icon_component, ModuleTableFieldVO.FIELD_TYPE_string, 'Composant - Icône', true);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().default_width, ModuleTableFieldVO.FIELD_TYPE_int, 'Largeur par défaut', true, true, 106);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().default_height, ModuleTableFieldVO.FIELD_TYPE_int, 'Hauteur par défaut', true, true, 30);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().default_background, ModuleTableFieldVO.FIELD_TYPE_string, 'default_background', true, true, '#f5f5f5');
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().is_filter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_filter', true, true, false);
        ModuleTableFieldController.create_new(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().is_validation_filters, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_validation_filters', true, true, false);

        return ModuleTableController.create_new(this.name, DashboardWidgetVO, name, "Widgets de Dashboard");
    }

    private init_DashboardPageWidgetVO(db_page: ModuleTableVO, db_widget: ModuleTableVO) {

        const widget_id = ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().widget_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Widget', true);
        const page_id = ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().static, ModuleTableFieldVO.FIELD_TYPE_boolean, 'static', true, true, false);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().x, ModuleTableFieldVO.FIELD_TYPE_int, 'x', true, true, 0);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().y, ModuleTableFieldVO.FIELD_TYPE_int, 'y', true, true, 0);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().w, ModuleTableFieldVO.FIELD_TYPE_int, 'w', true, true, 0);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().h, ModuleTableFieldVO.FIELD_TYPE_int, 'h', true, true, 0);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().i, ModuleTableFieldVO.FIELD_TYPE_int, 'i', true);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().json_options, ModuleTableFieldVO.FIELD_TYPE_string, 'json_options', false);
        ModuleTableFieldController.create_new(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().background, ModuleTableFieldVO.FIELD_TYPE_string, 'background', true);

        ModuleTableController.create_new(
            this.name,
            DashboardPageWidgetVO,
            null,
            "Pages de Dashboard"
        );

        widget_id.set_many_to_one_target_moduletable_name(db_widget.vo_type);
        page_id.set_many_to_one_target_moduletable_name(db_page.vo_type);
    }

    /**
     * Init Dashboard Favorites Filters
     *  - Database table to stock user favorites of active filters
     *  - May be useful to save the actual dashboard, owner_id and page_filters
     */
    private init_FavoritesFiltersVO(db_page: ModuleTableVO) {

        const page_id = ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().owner_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Owner Id', true);
        ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom des filtres', true);
        ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Field Filters', false);
        ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().export_params, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Export Params', false);
        ModuleTableFieldController.create_new(FavoritesFiltersVO.API_TYPE_ID, field_names<FavoritesFiltersVO>().options, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Behaviours Options', false);

        ModuleTableController.create_new(
            this.name,
            FavoritesFiltersVO,
            null,
            "Filtres Favoris"
        );
        page_id.set_many_to_one_target_moduletable_name(db_page.vo_type);
    }

    /**
     * Init Dashboard Shared Filters
     *  - Database table to stock sharable_filters of active dashboard
     *  - May be useful when switching between dashboard
     */
    private init_shared_filters_vo() {
        ModuleTableFieldController.create_new(SharedFiltersVO.API_TYPE_ID, field_names<SharedFiltersVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom des filtres', true);
        ModuleTableFieldController.create_new(SharedFiltersVO.API_TYPE_ID, field_names<SharedFiltersVO>().field_filters_to_share, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Field Filters To Share', false);
        ModuleTableFieldController.create_new(SharedFiltersVO.API_TYPE_ID, field_names<SharedFiltersVO>().shared_from_dashboard_ids, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Filtre partagé par les dashboards', false);
        ModuleTableFieldController.create_new(SharedFiltersVO.API_TYPE_ID, field_names<SharedFiltersVO>().shared_with_dashboard_ids, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Filtre partagé avec les dashboards', false);

        ModuleTableController.create_new(
            this.name,
            SharedFiltersVO,
            null,
            "Filtres Favoris"
        );
    }

    private init_VOFieldRefVO() {

        ModuleTableFieldController.create_new(VOFieldRefVO.API_TYPE_ID, field_names<VOFieldRefVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'VO Type', true);
        ModuleTableFieldController.create_new(VOFieldRefVO.API_TYPE_ID, field_names<VOFieldRefVO>().field_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Champs', true);
        ModuleTableFieldController.create_new(VOFieldRefVO.API_TYPE_ID, field_names<VOFieldRefVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        ModuleTableController.create_new(this.name, VOFieldRefVO, null, "Référence de champs");
    }

    private init_TableColumnDescVO() {

        const var_id = ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().var_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Var', false);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de colonne', true).setEnumValues(TableColumnDescVO.TYPE_LABELS);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'VO Type', false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().field_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Champs', false);

        var_id;
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().var_unicity_id, ModuleTableFieldVO.FIELD_TYPE_int, 'Unicité pour colonnes de type var', false);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().component_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Composant', false);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().filter_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Filtre', false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().filter_additional_params, ModuleTableFieldVO.FIELD_TYPE_string, 'Paramètres filtre', false);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().many_to_many_aggregate, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Aggrégation des liens ManyToMany');
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().disabled_many_to_one_link, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Désactiver les liens ManyToOne');
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().is_nullable, ModuleTableFieldVO.FIELD_TYPE_boolean, "La donnée peut-être null");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().show_tooltip, ModuleTableFieldVO.FIELD_TYPE_boolean, "Afficher la popup");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().sum_numeral_datas, ModuleTableFieldVO.FIELD_TYPE_boolean, "Somme les datas", false, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().explicit_html, ModuleTableFieldVO.FIELD_TYPE_boolean, "HTML avec mise en forme", false, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().is_sticky, ModuleTableFieldVO.FIELD_TYPE_boolean, "Figer", false, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().header_name, ModuleTableFieldVO.FIELD_TYPE_string, "Entête de colonne");

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().filter_custom_field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, "filter_custom_field_filters");

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().show_if_any_filter_active, ModuleTableFieldVO.FIELD_TYPE_int_array, "show_if_any_filter_active");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().hide_if_any_filter_active, ModuleTableFieldVO.FIELD_TYPE_int_array, "hide_if_any_filter_active");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().do_not_user_filter_active_ids, ModuleTableFieldVO.FIELD_TYPE_int_array, "do_not_user_filter_active_ids");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, "Readonly", false, true, true);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().exportable, ModuleTableFieldVO.FIELD_TYPE_boolean, "Exportable", false, true, true);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().hide_from_table, ModuleTableFieldVO.FIELD_TYPE_boolean, "Masquer de la table", false, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().can_filter_by, ModuleTableFieldVO.FIELD_TYPE_boolean, "Filtrable", false, true, true);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().sortable, ModuleTableFieldVO.FIELD_TYPE_boolean, "Triable", true, true, true);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().column_width, ModuleTableFieldVO.FIELD_TYPE_int, 'Largeur de la colonne', false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().default_sort_field, ModuleTableFieldVO.FIELD_TYPE_int, 'Default Sort Field', false);

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().filter_by_access, ModuleTableFieldVO.FIELD_TYPE_string, "Droit d'accès");

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().enum_bg_colors, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, "Enum BG colors");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().enum_fg_colors, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, "Enum FG colors");

        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().children, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, "Enfants");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().bg_color_header, ModuleTableFieldVO.FIELD_TYPE_string, "Header BG color");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().font_color_header, ModuleTableFieldVO.FIELD_TYPE_string, "Header FG color");
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().kanban_column, ModuleTableFieldVO.FIELD_TYPE_boolean, "Colonne Kanban", true, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().kanban_use_weight, ModuleTableFieldVO.FIELD_TYPE_boolean, "Utiliser le poids pour le kanban", true, true, false);
        ModuleTableFieldController.create_new(TableColumnDescVO.API_TYPE_ID, field_names<TableColumnDescVO>().colors_by_value_and_conditions, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, "Colors by value and conditions");

        ModuleTableController.create_new(this.name, TableColumnDescVO, null, "Référence de champs");
        var_id.set_many_to_one_target_moduletable_name(VarConfVO.API_TYPE_ID);
    }

    private init_AdvancedDateFilterOptDescVO() {

        ModuleTableFieldController.create_new(AdvancedDateFilterOptDescVO.API_TYPE_ID, field_names<AdvancedDateFilterOptDescVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false);
        ModuleTableFieldController.create_new(AdvancedDateFilterOptDescVO.API_TYPE_ID, field_names<AdvancedDateFilterOptDescVO>().value, ModuleTableFieldVO.FIELD_TYPE_int, 'Valeur', false);
        ModuleTableFieldController.create_new(AdvancedDateFilterOptDescVO.API_TYPE_ID, field_names<AdvancedDateFilterOptDescVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Date', false).set_segmentation_type(TimeSegment.TYPE_DAY);

        ModuleTableFieldController.create_new(AdvancedDateFilterOptDescVO.API_TYPE_ID, field_names<AdvancedDateFilterOptDescVO>().search_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de recherche').setEnumValues(AdvancedDateFilterOptDescVO.SEARCH_TYPE_LABELS);
        ModuleTableFieldController.create_new(AdvancedDateFilterOptDescVO.API_TYPE_ID, field_names<AdvancedDateFilterOptDescVO>().segmentation_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de segment').setEnumValues(TimeSegment.TYPE_NAMES_ENUM);

        ModuleTableController.create_new(this.name, AdvancedDateFilterOptDescVO, null, "Option filtre date avancé");
    }


    private initialize_ComponentDatatableFieldVO() {
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().component_name, ModuleTableFieldVO.FIELD_TYPE_string, 'component_name');
        ModuleTableFieldController.create_new(ComponentDatatableFieldVO.API_TYPE_ID, field_names<ComponentDatatableFieldVO<any, any>>().parameter_datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'parameter_datatable_field_uid');

        ModuleTableController.create_new(this.name, ComponentDatatableFieldVO, null, "ComponentDatatableFieldVO");
    }

    private initialize_ComputedDatatableFieldVO() {
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(ComputedDatatableFieldVO.API_TYPE_ID, field_names<ComputedDatatableFieldVO<any, any, any>>().compute_function_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'compute_function_uid');

        ModuleTableController.create_new(this.name, ComputedDatatableFieldVO, null, "ComputedDatatableFieldVO");
    }

    private initialize_CRUDActionsDatatableFieldVO() {
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(CRUDActionsDatatableFieldVO.API_TYPE_ID, field_names<CRUDActionsDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableController.create_new(this.name, CRUDActionsDatatableFieldVO, null, "CRUDActionsDatatableFieldVO");
    }

    private initialize_FileDatatableFieldVO() {
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(FileDatatableFieldVO.API_TYPE_ID, field_names<FileDatatableFieldVO<any, any>>().parameter_datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'parameter_datatable_field_uid');

        ModuleTableController.create_new(this.name, FileDatatableFieldVO, null, "FileDatatableFieldVO");
    }

    private initialize_InputDatatableFieldVO() {
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(InputDatatableFieldVO.API_TYPE_ID, field_names<InputDatatableFieldVO<any, any>>().field_type, ModuleTableFieldVO.FIELD_TYPE_string, 'field_type');

        ModuleTableController.create_new(this.name, InputDatatableFieldVO, null, "InputDatatableFieldVO");
    }

    private initialize_ManyToManyReferenceDatatableFieldVO() {
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().target_module_table_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'target_module_table_type_id');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().sorted_target_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sorted_target_fields');

        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().inter_module_table_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'inter_module_table_type_id');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().inter_target_ref_field_id, ModuleTableFieldVO.FIELD_TYPE_string, 'inter_target_ref_field_id');
        ModuleTableFieldController.create_new(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToManyReferenceDatatableFieldVO<any, any>>().inter_src_ref_field_id, ModuleTableFieldVO.FIELD_TYPE_string, 'inter_src_ref_field_id');

        ModuleTableController.create_new(
            this.name,
            ManyToManyReferenceDatatableFieldVO,
            null,
            "ManyToManyReferenceDatatableFieldVO"
        );
    }

    private initialize_ManyToOneReferenceDatatableFieldVO() {
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().target_module_table_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'target_module_table_type_id');
        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>().sorted_target_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sorted_target_fields');

        ModuleTableFieldController.create_new(ManyToOneReferenceDatatableFieldVO.API_TYPE_ID, field_names<ManyToOneReferenceDatatableFieldVO<any>>()._src_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_src_field_id');

        ModuleTableController.create_new(this.name, ManyToOneReferenceDatatableFieldVO, null, "ManyToOneReferenceDatatableFieldVO");
    }

    private initialize_OneToManyReferenceDatatableFieldVO() {
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().target_module_table_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'target_module_table_type_id');
        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>().sorted_target_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sorted_target_fields');

        ModuleTableFieldController.create_new(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, field_names<OneToManyReferenceDatatableFieldVO<any>>()._dest_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_dest_field_id');

        ModuleTableController.create_new(
            this.name,
            OneToManyReferenceDatatableFieldVO,
            null,
            "OneToManyReferenceDatatableFieldVO"
        );
    }

    private initialize_RefRangesReferenceDatatableFieldVO() {
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().target_module_table_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'target_module_table_type_id');
        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>().sorted_target_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'sorted_target_fields');

        ModuleTableFieldController.create_new(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, field_names<RefRangesReferenceDatatableFieldVO<any>>()._src_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_src_field_id');

        ModuleTableController.create_new(
            this.name,
            RefRangesReferenceDatatableFieldVO,
            null,
            "RefRangesReferenceDatatableFieldVO"
        );
    }

    private initialize_SelectBoxDatatableFieldVO() {
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(SelectBoxDatatableFieldVO.API_TYPE_ID, field_names<SelectBoxDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableController.create_new(this.name, SelectBoxDatatableFieldVO, null, "SelectBoxDatatableFieldVO");
    }

    private initialize_SimpleDatatableFieldVO() {
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().field_type, ModuleTableFieldVO.FIELD_TYPE_string, 'field_type');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().enum_values, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'enum_values');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().segmentation_type, ModuleTableFieldVO.FIELD_TYPE_int, 'segmentation_type');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().is_inclusive_data, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_inclusive_data');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().is_inclusive_ihm, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_inclusive_ihm');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().return_min_value, ModuleTableFieldVO.FIELD_TYPE_boolean, 'return_min_value');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().format_localized_time, ModuleTableFieldVO.FIELD_TYPE_boolean, 'format_localized_time');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().return_max_value, ModuleTableFieldVO.FIELD_TYPE_boolean, 'return_max_value');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(SimpleDatatableFieldVO.API_TYPE_ID, field_names<SimpleDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableController.create_new(this.name, SimpleDatatableFieldVO, null, "SimpleDatatableFieldVO");
    }

    private initialize_VarDatatableFieldVO() {
        const var_id = ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().var_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Variable");
        const dashboard_id = ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().dashboard_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Dashboard");

        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>()._vo_type_id, ModuleTableFieldVO.FIELD_TYPE_string, '_vo_type_id');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().vo_type_full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_full_name');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'tooltip');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().is_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_required', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'is_readonly', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().hiden_export, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hiden_export', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'hidden_print', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().force_toggle_button, ModuleTableFieldVO.FIELD_TYPE_boolean, 'force_toggle_button', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().translatable_place_holder, ModuleTableFieldVO.FIELD_TYPE_string, 'translatable_place_holder');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().select_options_enabled, ModuleTableFieldVO.FIELD_TYPE_int_array, 'select_options_enabled');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>()._module_table_field_id, ModuleTableFieldVO.FIELD_TYPE_string, '_module_table_field_id');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().semaphore_auto_update_datatable_field_uid_with_vo_type, ModuleTableFieldVO.FIELD_TYPE_boolean, 'semaphore_auto_update_datatable_field_uid_with_vo_type', true, true, false);
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'type');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'datatable_field_uid');

        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().filter_type, ModuleTableFieldVO.FIELD_TYPE_string, 'filter_type');
        ModuleTableFieldController.create_new(VarDatatableFieldVO.API_TYPE_ID, field_names<VarDatatableFieldVO<any, any>>().filter_additional_params, ModuleTableFieldVO.FIELD_TYPE_string, 'filter_additional_params');

        ModuleTableController.create_new(this.name, VarDatatableFieldVO, null, "VarDatatableFieldVO");

        var_id.set_many_to_one_target_moduletable_name(VarConfVO.API_TYPE_ID);
        dashboard_id.set_many_to_one_target_moduletable_name(DashboardVO.API_TYPE_ID);
    }
}
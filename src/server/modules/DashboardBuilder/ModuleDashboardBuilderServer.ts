import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardActiveonViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardActiveonViewportVO';
import DashboardGraphVORefVO from '../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import ListObjectLikesVO from '../../../shared/modules/DashboardBuilder/vos/ListObjectLikesVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import DashboardBuilderCronWorkersHandler from './DashboardBuilderCronWorkersHandler';
import DashboardCycleChecker from './DashboardCycleChecker';
import FavoritesFiltersVOService from './service/FavoritesFiltersVOService';

export default class ModuleDashboardBuilderServer extends ModuleServerBase {

    private static instance: ModuleDashboardBuilderServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDashboardBuilder.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDashboardBuilderServer.instance) {
            ModuleDashboardBuilderServer.instance = new ModuleDashboardBuilderServer();
        }
        return ModuleDashboardBuilderServer.instance;
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        DashboardBuilderCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Somme'
        }, 'StatVO.AGGREGATOR_SUM'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Min'
        }, 'StatVO.AGGREGATOR_MIN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Moyenne'
        }, 'StatVO.AGGREGATOR_MEAN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Max'
        }, 'StatVO.AGGREGATOR_MAX'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'export_frequency_prefered_time.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Envoyer aux utilisateurs suivants'
        }, 'dashboard_viewer.favorites_filters.export_to_users.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure préférée'
        }, 'dashboard_viewer.favorites_filters.export_frequency_prefered_time.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'favorites_filters_export_frequency.GRANULARITY_DAY'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'favorites_filters_export_frequency.GRANULARITY_MONTH'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'favorites_filters_export_frequency.GRANULARITY_YEAR'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ouvrir le dashboard'
        }, 'DashboardCycleChecker.open_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres favoris'
        }, 'favorites_filters_select.multiselect_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Graphique de var - Donut, Jauge ou Camembert'
        }, 'dashboards.widgets.icons_tooltips.varpiechart.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Graphique de var - Carte choroplèthe'
        }, 'dashboards.widgets.icons_tooltips.varchoroplethchart.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_choropleth_chart_widget_options_component.separator.widget_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'var_choropleth_chart_widget_options_component.widget_title.title_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_choropleth_chart_widget_options_component.bg_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_choropleth_chart_widget_options_component.separator.chart_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du titre'
        }, 'var_choropleth_chart_widget_options_component.separator.chart_title_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le titre'
        }, 'var_choropleth_chart_widget_options_component.title_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_font_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille de la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_font_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_box_width.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marge de la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_padding.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser le style de point pour la légende'
        }, 'var_choropleth_chart_widget_options_component.legend_use_point_style.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_choropleth_chart_widget_options_component.separator.datas_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'La dimension est un champ ?'
        }, 'var_choropleth_chart_widget_options_component.dimension_is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champ de la dimension'
        }, 'var_choropleth_chart_widget_options_component.dimension_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Segmentation de la dimension'
        }, 'var_choropleth_chart_widget_options_component.max_dimension_values.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par un champ'
        }, 'var_choropleth_chart_widget_options_component.sort_dimension_by_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par ordre croissant ?'
        }, 'var_choropleth_chart_widget_options_component.sort_dimension_by_asc.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable principale'
        }, 'var_choropleth_chart_widget_options_component.separator.var_1_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable principale'
        }, 'var_choropleth_chart_widget_options_component.var_name_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser un dégradé de couleur ?'
        }, 'var_choropleth_chart_widget_options_component.bg_gradient.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de bordure'
        }, 'var_choropleth_chart_widget_options_component.border_color_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_choropleth_chart_widget_options_component.border_width_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre de la dimension'
        }, 'var_choropleth_chart_widget_options_component.dimension_custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'VarChoroplethChartWidgetOptionsComponent.dimension_custom_filter_segment_types.5.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Graphique de var - Radar'
        }, 'dashboards.widgets.icons_tooltips.varradarchart.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_radar_chart_widget_options_component.separator.widget_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre personnalisé'
        }, 'var_radar_chart_widget_options_component.field_that_could_get_custom_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'var_radar_chart_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_radar_chart_widget_options_component.bg_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du titre'
        }, 'var_radar_chart_widget_options_component.separator.chart_title_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le titre'
        }, 'var_radar_chart_widget_options_component.title_display.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du titre'
        }, 'var_radar_chart_widget_options_component.title_font_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille du titre'
        }, 'var_radar_chart_widget_options_component.title_font_size.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur du titre'
        }, 'var_radar_chart_widget_options_component.title_padding.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la légende'
        }, 'var_radar_chart_widget_options_component.separator.chart_legend_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende'
        }, 'var_radar_chart_widget_options_component.legend_display.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Position de la légende'
        }, 'var_radar_chart_widget_options_component.legend_position.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de la légende'
        }, 'var_radar_chart_widget_options_component.legend_font_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille de la légende'
        }, 'var_radar_chart_widget_options_component.legend_font_size.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la légende'
        }, 'var_radar_chart_widget_options_component.legend_box_width.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marge de la légende'
        }, 'var_radar_chart_widget_options_component.legend_padding.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser le style de point pour la légende'
        }, 'var_radar_chart_widget_options_component.legend_use_point_style.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_radar_chart_widget_options_component.separator.datas_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des dimensions'
        }, 'var_radar_chart_widget_options_component.separator.datas_dimension_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Multi dataset'
        }, 'var_radar_chart_widget_options_component.separator.multiple_dataset.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Multi dataset'
        }, 'var_mixed_charts_widget_options_component.separator.multiple_dataset.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Condition du survol'
        }, 'var_mixed_charts_widget_options_component.switch_tooltip_by_index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Par abscisse'
        }, 'var_mixed_charts_widget_options_component.switch_tooltip_by_index.index.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Par valeur proche'
        }, 'var_mixed_charts_widget_options_component.switch_tooltip_by_index.nearest.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du filtre'
        }, 'var_mixed_charts_widget_options_component.section.filter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre du widget'
        }, 'var_mixed_charts_widget_options_component.section.widget_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de base'
        }, 'var_mixed_charts_widget_options_component.section.chart_basic.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre du graphique'
        }, 'var_mixed_charts_widget_options_component.section.chart_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la légende'
        }, 'var_mixed_charts_widget_options_component.section.legend_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_mixed_charts_widget_options_component.section.data_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Multi dataset'
        }, 'var_mixed_charts_widget_options_component.section.multiple_dataset.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de l’échelle X'
        }, 'var_mixed_charts_widget_options_component.section.scale_options_x.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de l’échelle Y'
        }, 'var_mixed_charts_widget_options_component.section.y_axis_options.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser une dimension de donnée, issue d\'un champ ou d\'un filtre date segmenté'
        }, 'var_radar_chart_widget_options_component.has_dimension.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'La dimension est un champ ?'
        }, 'var_radar_chart_widget_options_component.dimension_is_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champ de la dimension'
        }, 'var_radar_chart_widget_options_component.dimension_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Segmentation de la dimension'
        }, 'var_radar_chart_widget_options_component.dimension_custom_filter_segment_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Max. de valeurs pour la dimension choisie'
        }, 'var_radar_chart_widget_options_component.max_dimension_values.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet de définir un nombre max de résultats pris en compte pour le graphique sur la dimension proposée. Par exemple si on a sélectionné une année et qu\'on segmente au jour, on peut limiter aux 10 premiers jours en indiquant 10 ici.'
        }, 'var_radar_chart_widget_options_component.max_dimension_values.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par un champ'
        }, 'var_radar_chart_widget_options_component.sort_dimension_by_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par ordre croissant ?'
        }, 'var_radar_chart_widget_options_component.sort_dimension_by_asc.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre de la dimension'
        }, 'var_radar_chart_widget_options_component.dimension_custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de tri des dimensions'
        }, 'var_radar_chart_widget_options_component.separator.datas_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre des valeurs'
        }, 'var_radar_chart_widget_options_component.widget_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable principale'
        }, 'var_radar_chart_widget_options_component.separator.var_1_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable principale'
        }, 'var_radar_chart_widget_options_component.var_name_1.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_radar_chart_widget_options_component.bg_color_1.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur des bordures'
        }, 'var_radar_chart_widget_options_component.border_color_1.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Position de la légende'
        }, 'var_radar_chart_widget_options_component.legend_position.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable secondaire'
        }, 'var_radar_chart_widget_options_component.separator.var_2_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable secondaire'
        }, 'var_radar_chart_widget_options_component.var_name_2.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_radar_chart_widget_options_component.bg_color_2.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de bordure'
        }, 'var_radar_chart_widget_options_component.border_color_2.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_radar_chart_widget_options_component.border_width_2.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser la somme des deux variables comme valeur max ?'
        }, 'var_radar_chart_widget_options_component.max_is_sum_of_var_1_and_2.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner le champ permettant de faire du multi dataset (plusieurs radars superposés)'
        }, 'var_radar_chart_widget_options_component.multiple_dataset_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Maximum de radars superposés'
        }, 'var_radar_chart_widget_options_component.max_dataset_values.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nombre maximum de radars superposés'
        }, 'var_radar_chart_widget_options_component.max_dataset_values.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner le champ permettant de faire du multi dataset (plusieurs graphiques superposés)'
        }, 'var_mixed_charts_widget_options_component.multiple_dataset_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Le multidataset permet de superposer plusieurs graphiques sur un même axe des abscisses.'
        }, 'var_mixed_charts_widget_options_component.multiple_dataset_vo_field_ref.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Maximum de graphiques superposés'
        }, 'var_mixed_charts_widget_options_component.max_dataset_values.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nombre maximum de graphiques superposés'
        }, 'var_mixed_charts_widget_options_component.max_dataset_values.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_radar_chart_widget_options_component.separator.chart_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_radar_chart_widget_options_component.border_width_1.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable'
        }, 'var_radar_chart_widget_options_component.var_title_1.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du widget'
        }, 'var_mixed_charts_widget_options_component.separator.widget_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Style du graphique'
        }, 'var_mixed_charts_widget_options_component.switch_detailed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Detaillé'
        }, 'var_mixed_charts_widget_options_component.switch_detailed.detailed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Simple'
        }, 'var_mixed_charts_widget_options_component.switch_detailed.simple.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Condition d\'affichage des valeurs des données au survol.'
        }, 'var_mixed_charts_widget_options_component.switch_tooltip_by_index.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pas de données, veuillez vérifier que les tables nécessaires sont présentes.'
        }, 'var_mixed_charts_widget.error_message'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_mixed_charts_widget_options_component.separator.chart_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'var_mixed_charts_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_mixed_charts_widget_options_component.bg_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du titre'
        }, 'var_mixed_charts_widget_options_component.separator.chart_title_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du titre'
        }, 'var_mixed_charts_widget_options_component.title_font_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille du titre'
        }, 'var_mixed_charts_widget_options_component.title_font_size.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur du titre'
        }, 'var_mixed_charts_widget_options_component.title_padding.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le titre'
        }, 'var_mixed_charts_widget_options_component.title_display.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la légende'
        }, 'var_mixed_charts_widget_options_component.separator.chart_legend_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende'
        }, 'var_mixed_charts_widget_options_component.legend_display.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Position'
        }, 'var_mixed_charts_widget_options_component.legend_position.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Haut'
        }, 'var_mixed_charts_widget_options_component.legend_position.top.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Gauche'
        }, 'var_mixed_charts_widget_options_component.legend_position.left.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bas'
        }, 'var_mixed_charts_widget_options_component.legend_position.bottom.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Droite'
        }, 'var_mixed_charts_widget_options_component.legend_position.right.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du texte'
        }, 'var_mixed_charts_widget_options_component.legend_font_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille'
        }, 'var_mixed_charts_widget_options_component.legend_font_size.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur'
        }, 'var_mixed_charts_widget_options_component.legend_box_width.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marge'
        }, 'var_mixed_charts_widget_options_component.legend_padding.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Style'
        }, 'var_mixed_charts_widget_options_component.legend_style.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rond'
        }, 'var_mixed_charts_widget_options_component.legend_style.circle.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rectangle'
        }, 'var_mixed_charts_widget_options_component.legend_style.rectangle.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_mixed_charts_widget_options_component.separator.datas_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des dimensions'
        }, 'var_mixed_charts_widget_options_component.separator.datas_dimension_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'La dimension est un champ ?'
        }, 'var_mixed_charts_widget_options_component.dimension_is_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champ de la dimension'
        }, 'var_mixed_charts_widget_options_component.dimension_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Segmentation de la dimension'
        }, 'var_mixed_charts_widget_options_component.dimension_custom_filter_segment_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Max. de valeurs pour la dimension choisie'
        }, 'var_mixed_charts_widget_options_component.max_dimension_values.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet de définir un nombre max de résultats pris en compte pour le graphique sur la dimension proposée. Par exemple si on a sélectionné une année et qu\'on segmente au jour, on peut limiter aux 10 premiers jours en indiquant 10 ici.'
        }, 'var_mixed_charts_widget_options_component.max_dimension_values.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par un champ'
        }, 'var_mixed_charts_widget_options_component.sort_dimension_by_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par ordre croissant ?'
        }, 'var_mixed_charts_widget_options_component.sort_dimension_by_asc.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre de la dimension'
        }, 'var_mixed_charts_widget_options_component.dimension_custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser une dimension de donnée, issue d\'un champ ou d\'un filtre date segmenté'
        }, 'var_mixed_charts_widget_options_component.has_dimension.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de tri des dimensions'
        }, 'var_mixed_charts_widget_options_component.separator.datas_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre des valeurs'
        }, 'var_mixed_charts_widget_options_component.widget_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable principale'
        }, 'var_mixed_charts_widget_options_component.separator.var_1_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de l\'axe des abscisses'
        }, 'var_mixed_charts_widget_options_component.scale_x_axis_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende'
        }, 'var_mixed_charts_widget_options_component.show_scale_x.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Légende'
        }, 'var_mixed_charts_widget_options_component.scale_x_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type de l\'axe'
        }, 'var_mixed_charts_widget_options_component.scale_x_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende des ordonnées'
        }, 'var_mixed_charts_widget_options_component.show_scale_y.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de l\'axe des ordonnées'
        }, 'var_mixed_charts_widget_options_component.scale_y_axis_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de l\'axe des ordonnées'
        }, 'var_mixed_charts_widget_options_component.scale_options_y.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Graphique de var - Mixés'
        }, 'dashboards.widgets.icons_tooltips.varmixedcharts.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une variable au graphique'
        }, 'var_charts_options_component.add_var_chart_options_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des variables'
        }, 'var_charts_options_component.separator.var_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser une palette de couleur prédéfinie'
        }, 'var_charts_options_component.separator.use_palette.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable'
        }, 'var_chart_options_item_component.separator.var_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options visuelles'
        }, 'var_chart_options_item_component.section.graphical_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_chart_options_item_component.section.filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Id du graphique'
        }, 'var_chart_options_item_component.chart_id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre du graphique'
        }, 'var_chart_options_item_component.var_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable'
        }, 'var_chart_options_item_component.var_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type de graphique'
        }, 'var_chart_options_item_component.graph_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ligne'
        }, 'var_chart_options_item_component.graph_type.line.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Barre'
        }, 'var_chart_options_item_component.graph_type.bar.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Degradé de couleur'
        }, 'var_chart_options_item_component.has_gradient.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_chart_options_item_component.bg_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de bordure'
        }, 'var_chart_options_item_component.border_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_chart_options_item_component.border_width.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les valeurs'
        }, 'var_chart_options_item_component.show_values.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les 0'
        }, 'var_chart_options_item_component.show_zeros.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille des valeurs'
        }, 'var_chart_options_item_component.value_label_size.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Il n\'y a aucune donnée à afficher'
        }, 'var_chart.no_data_to_display.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer la variable du graphique'
        }, 'var_charts_options_component.remove_var_chart_options_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ouvrir'
        }, 'var_charts_options_component.open_var_chart_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fermer'
        }, 'var_charts_options_component.close_var_chart_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des ordonnées'
        }, 'var_charts_scales_options_component.separator.var_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ouvrir les sections'
        }, 'var_charts_scales_options_component.tooltip.toggle_all_button.open.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fermer les sections'
        }, 'var_charts_scales_options_component.tooltip.toggle_all_button.close.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout ouvrir'
        }, 'var_charts_scales_options_component.tooltip.toggle_all_and_children_button.open.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout fermer'
        }, 'var_charts_scales_options_component.tooltip.toggle_all_and_children_button.close.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une ordonnée'
        }, 'var_chart_scales_options_component.add_var_chart_scales_options_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options visuelles'
        }, 'var_chart_scales_options_item_component.separator.var_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ID de l\'ordonnée'
        }, 'var_chart_scales_options_item_component.chart_id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre de l\'ordonnée'
        }, 'var_chart_scales_options_item_component.scale_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Superposer ?'
        }, 'var_chart_scales_options_item.stacked.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet, dans le cas d\'un graphique en bar de superposer les valeurs des différentes variables.'
        }, 'var_chart_scales_options_item.stacked_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Remplir ?'
        }, 'var_chart_scales_options_item.fill.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet, dans le cas d\'un graphique en ligne de remplir l\'espace entre la ligne et l\'axe des abscisses.'
        }, 'var_chart_scales_options_item.fill_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet de filtrer l\'affichage du pas de l\'axe des ordonnées.'
        }, 'var_chart_scales_options_item.widget_filter_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type de l\'ordonnée'
        }, 'var_chart_scales_options_item.scale_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le titre'
        }, 'var_chart_scales_options_item.show_scale_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de l\'axe'
        }, 'var_chart_scales_options_item.scale_axis_color.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Position de l\'axe'
        }, 'var_chart_scales_options_item_component.separator.scale_position.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Gauche'
        }, 'var_chart_scales_options_item_component.separator.scale_position.left.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Droite'
        }, 'var_chart_scales_options_item_component.separator.scale_position.right.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de filtrage des valeurs'
        }, 'var_chart_scales_options_item_component.separator.datas_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Linéaire'
        }, 'chart_js_scale_type.linear.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Logarithmique'
        }, 'chart_js_scale_type.logarithmic.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Catégorie'
        }, 'chart_js_scale_type.category.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Temps'
        }, 'chart_js_scale_type.time.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de l\'unité de temps'
        }, 'chart_js_scale_time_options_component.unit_options_selector.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer l\'ordonnée du graphique'
        }, 'var_chart_scales_options_component.remove_var_chart_scales_options_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du pas de l\'axe des ordonnées'
        }, 'var_chart_scales_options_component.separator.datas_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ordonnée du graphique'
        }, 'var_chart_options_item_component.field_that_could_get_custom_filter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ordonnée du graphique'
        }, 'var_chart_options_item_component.field_that_could_get_scales_filter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'chart_js_scale_options_component.time_unit_year_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trimestre'
        }, 'chart_js_scale_options_component.time_unit_quarter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'chart_js_scale_options_component.time_unit_month_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'chart_js_scale_options_component.time_unit_week_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'chart_js_scale_options_component.time_unit_day_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'chart_js_scale_options_component.time_unit_hour_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'chart_js_scale_options_component.time_unit_minute_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'chart_js_scale_options_component.time_unit_second_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Milliseconde'
        }, 'chart_js_scale_options_component.time_unit_millisecond_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du format de date'
        }, 'chart_js_scale_time_options_component.parser_options_selector.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de format des dimensions'
        }, 'chart_js_scale_options_component.types_options_selector.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du format de date'
        }, 'chart_js_scale_time_options_component.round_options_selector.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de la modification de la liaison'
        }, 'TablesGraphEditFormComponent.switch_edge_acceptance.error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': ''
        }, 'dashboard_builder.tables_graph.message.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Il y a actuellement un bug sur le déplacement des cellules, qui ne peuvent être déplacées que au sein d\'elles mêmes, ou des autres cellules.\nPar ailleurs, lors de la suppression d\'une cellule, le graphique ne se met pas totalement à jour et la cellule reste visible, mais le type est bien supprimé. Recharger le graphique pour voir la modification.'
        }, 'dashboard_builder.tables_graph.message.warning.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': ''
        }, 'dashboard_builder.tables_graph.message.info.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliquer pour éditer'
        }, 'table_widget_kanban_component.edit_card.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliquer pour éditer'
        }, 'table_widget_kanban_component.edit_column.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter...'
        }, 'table_widget_kanban_component.create_new_kanban_column.placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Des données ont été modifiées par ailleurs, rechargement automatique...'
        }, 'update_kanban_data_rows.needs_refresh.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement...'
        }, 'update_kanban_data_rows.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'enregistrement'
        }, 'update_kanban_data_rows.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifications enregistrées'
        }, 'update_kanban_data_rows.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajout de la colonne...'
        }, 'create_new_kanban_column.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'ajout de la colonne'
        }, 'create_new_kanban_column.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Colonne ajoutée'
        }, 'create_new_kanban_column.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Des données ont été modifiées par ailleurs, rechargement automatique...'
        }, 'on_move_columns_kanban_element.needs_refresh.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement...'
        }, 'on_move_columns_kanban_element.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'enregistrement'
        }, 'on_move_columns_kanban_element.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifications enregistrées'
        }, 'on_move_columns_kanban_element.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Archiver'
        }, 'TableWidgetTableComponent.contextmenu.archive.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permettre l\'archivage des cartes Kanban si possible'
        }, 'table_widget_options_component.use_kanban_card_archive_if_exists.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.use_kanban_card_archive_if_exists.true.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.use_kanban_card_archive_if_exists.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ordonner les colonnes du Kanban si possible'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.true.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Affichage Kanban par défaut si il est configuré'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Colonne Kanban'
        }, 'table_widget_options_component.kanban_column.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.kanban_column.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.kanban_column.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Kanban - Utiliser le champs weight'
        }, 'table_widget_options_component.kanban_use_weight.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.kanban_use_weight.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.kanban_use_weight.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'oselia_thread_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Envoi du message...'
        }, 'OseliaThreadWidgetComponent.send_message.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Message envoyé'
        }, 'OseliaThreadWidgetComponent.send_message.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec de l\'envoi du message'
        }, 'OseliaThreadWidgetComponent.send_message.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vous ne pouvez pas envoyer de message contenant ce format'
        }, 'OseliaThreadWidgetComponent.send_message.error_tech_message.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Envoyer le message à Osélia'
        }, 'oselia_thread_widget_component.send_message.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Aucun assistant disponible pour cette discussion'
        }, 'oselia_thread_widget_component.no_assistant.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vous devez choisir un assistant'
        }, 'oselia_thread_widget_component.too_many_assistants.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Discussion avec Osélia'
        }, 'dashboards.widgets.icons_tooltips.oseliathread.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner une discussion pour démarrer'
        }, 'oselia_thread_widget_component.too_many_threads.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cette discussion est introuvable. Vous n\'avez peut-être pas les droits nécessaires pour y accéder.'
        }, 'oselia_thread_widget_component.no_access.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pour débuter la discussion, utilisez le champ de saisie ci-dessous et cliquez sur le bouton "Envoyer".'
        }, 'oselia_thread_widget_component.no_messages.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Osélia'
        }, 'oselia_thread_widget_component.thread_message_header_left_username.oselia.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Système'
        }, 'oselia_thread_widget_component.thread_message_header_left_username.system.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utilisation d\'un outil'
        }, 'oselia_thread_widget_component.thread_message_header_left_username.tool.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vous'
        }, 'oselia_thread_widget_component.thread_message_header_left_username.me.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Appel de fonction'
        }, 'oselia_thread_widget_component.thread_message_header_left_username.function.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Joindre le fichier'
        }, 'oselia_thread_widget_component.dragging_overlay_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Upload l\'image'
        }, 'oselia_thread_widget_component.image_upload_menu_item.upload.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lien vers l\'image'
        }, 'oselia_thread_widget_component.image_upload_menu_item.link.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'URL de l\'image'
        }, 'oselia_thread_widget_component.link_image_menu.url_placeholder.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Annuler'
        }, 'oselia_thread_widget_component.image_upload_menu_item.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Insérer une image depuis un URL'
        }, 'oselia_thread_widget_component.link_image_menu.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fichier'
        }, 'oselia_thread_widget_component.thread_message_attachment_file.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fichier'
        }, 'oselia_thread_widget_component.thread_message_attachment_image.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Exportable'
        }, 'table_widget_column_conf.editable_column.exportable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non exportable'
        }, 'table_widget_column_conf.editable_column.not_exportable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher'
        }, 'table_widget_column_conf.editable_column.show_in_table.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cacher'
        }, 'table_widget_column_conf.editable_column.hide_from_table.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tri visible'
        }, 'table_widget_column_conf.editable_column.sortable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tri masqué'
        }, 'table_widget_column_conf.editable_column.unsortable.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modification en cours...'
        }, 'move_page.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modification terminée'
        }, 'move_page.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec de la modification. Rechargez la page et réessayez'
        }, 'move_page.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer par cette ligne'
        }, 'table_widget_component.filter_by.id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer par cette valeur de la colonne'
        }, 'table_widget_component.filter_by.column_value.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Retirer le filtre'
        }, 'table_widget_component.filter_by.unfilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Total'
        }, 'table_widget_component.table_total_footer.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrable'
        }, 'table_widget_column_conf.editable_column.can_filter_by.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non filtrable'
        }, 'table_widget_column_conf.editable_column.cannot_filter_by.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Figer'
        }, 'table_widget_column_conf.editable_column.is_sticky.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ne pas figer'
        }, 'table_widget_column_conf.editable_column.is_not_sticky.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Conditionner au droit'
        }, 'table_widget_column.filter_by_access.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Exporter la page ou tout ?'
        }, 'table_widget.choose_export_type.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Export'
        }, 'table_widget.choose_export_type.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Page'
        }, 'table_widget.choose_export_type.page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout'
        }, 'table_widget.choose_export_type.all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Choisir une option d\'export par défaut'
        }, 'table_widget_options_component.default_export_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Attribuer une option d\'export par défaut'
        }, 'table_widget_options_component.has_default_export_option.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Alerte de maintenance de l\'export'
        }, 'table_widget_options_component.has_export_maintenance_alert.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer la suppression'
        }, 'inline_clear_value.confirm.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer'
        }, 'inline_clear_value.confirm.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Activer le menu sur : {app_name}'
        }, 'dashboard_menu_conf.menu_switch.label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '3 - Menus'
        }, 'dashboard_builder.menu_conf.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '4 - Filtres Partagés'
        }, 'dashboard_builder.shared_filters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pages du Dashboard'
        }, 'dashboard_builder.shared_filters.dashboard_pages.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres Partageable'
        }, 'dashboard_builder.shared_filters.page_sharable_filters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres Partagé'
        }, 'dashboard_builder.shared_filters.shared_filters_table_head.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres Partagé par ce Dashboard'
        }, 'dashboard_builder.shared_filters.shared_filters_from_this_dashboard_table_head.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres Partagé avec ce Dashboard'
        }, 'dashboard_builder.shared_filters.shared_filters_with_this_dashboard_table_head.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajuster les filtres correspondants aux filtres partagés'
        }, 'dashboard_builder.shared_filters.custom_api_type_ids.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre partagé'
        }, 'dashboard_builder.shared_filters.modal_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Créer un filtre partagé'
        }, 'dashboard_builder.shared_filters.create_shared_filters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreurs de saisie'
        }, 'dashboard_builder.shared_filters.form_errors.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer les filtres à partager'
        }, 'dashboard_builder.shared_filters.field_filters_selection_tab.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer les pages avec lesquels partager'
        }, 'dashboard_builder.shared_filters.share_with_page_tab.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer les dashboards avec lesquels partager'
        }, 'dashboard_builder.shared_filters.share_with_dashboard_tab.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Entrer le nom du filtre partagé *:'
        }, 'dashboard_builder.shared_filters.enter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les dashboards à partir desquels partager'
        }, 'dashboard_builder.shared_filters.share_from_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les dashboards avec lesquels partager'
        }, 'dashboard_builder.shared_filters.share_with_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer les dashboards de partage'
        }, 'dashboard_builder.shared_filters.dashboard_configurations_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les pages avec lesquels partager'
        }, 'dashboard_builder.shared_filters.share_with_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les pages'
        }, 'dashboard_builder.shared_filters.share_with_page_tab_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner le groupe de filtres à partager'
        }, 'dashboard_builder.shared_filters.select_field_filters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Saugarde en des filtres partagés cours...'
        }, 'dashboard_builder.shared_filters.save_start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres partagés sauvegardés avec succès'
        }, 'dashboard_builder.shared_filters.save_ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de la sauvegarde des filtres partagés'
        }, 'dashboard_builder.shared_filters.save_failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours...'
        }, 'dashboard_builder.shared_filters.delete_start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre partagé supprimé avec succès'
        }, 'dashboard_builder.shared_filters.delete_ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de la suppression du filtre partagé'
        }, 'dashboard_builder.shared_filters.delete_failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre caché'
        }, 'dashboard_builder.shared_filters.filter_hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre inexistant dans le dashboard'
        }, 'dashboard_builder.shared_filters.field_filters_does_no_exist_in_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Aucun filtre partagé trouvé'
        }, 'dashboard_builder.shared_filters.empty_list.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom des filtres partagé requis'
        }, 'dashboard_builder.shared_filters.name_required.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Les pages avec lesquels partager sont requises'
        }, 'dashboard_builder.shared_filters.shared_with_dashboard_ids_required.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les pages'
        }, 'dashboard_builder.shared_filters.select_pages_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Selectionner les Dashboards'
        }, 'dashboard_builder.shared_filters.select_dashboards_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Impossible de créer un nouveau Dashboard...'
        }, 'DashboardBuilderComponent.create_new_dashboard.ko.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur de chargement du Dashboard Builder'
        }, 'dashboard_builder.loading_failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer une date par année(s)'
        }, 'dashboards.widgets.icons_tooltips.yearfilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer une date par mois'
        }, 'dashboards.widgets.icons_tooltips.monthfilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Insérer un bloc de texte'
        }, 'dashboards.widgets.icons_tooltips.BlocText.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Insérer une liste d\'objets'
        }, 'dashboards.widgets.icons_tooltips.listobject.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Min/Max relatifs à l\'année actuelle'
        }, 'year_filter_widget_component.year_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.year_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.year_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-selection automatique'
        }, 'year_filter_widget_component.auto_select_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.auto_select_year.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.auto_select_year.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer la pré-sélection relative'
        }, 'year_filter_widget_component.configure_auto_select_year_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à une date'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à'
        }, 'year_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Un autre filtre'
        }, 'year_filter_widget_component.is_relative_to_other_filter.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Aujourd\'hui'
        }, 'year_filter_widget_component.is_relative_to_other_filter.now.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à ce filtre'
        }, 'year_filter_widget_component.relative_to_other_filter_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'year_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection min'
        }, 'year_filter_widget_component.auto_select_year_min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection max'
        }, 'year_filter_widget_component.auto_select_year_max.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer le filtre des mois'
        }, 'month_filter_widget_component.button_setter_widget_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurations du filtre des mois'
        }, 'month_filter_widget_component.configurations_summary_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'month_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Données'
        }, 'month_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeurs'
        }, 'month_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champs'
        }, 'month_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'month_filter_widget_component.custom_filter_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Min/Max relatifs au mois actuel'
        }, 'month_filter_widget_component.month_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.month_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.month_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois minimum (Janvier=1,...)'
        }, 'month_filter_widget_component.min_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois maximum (...,Décembre=12)'
        }, 'month_filter_widget_component.max_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélection de tous les mois'
        }, 'month_filter_widget_component.is_all_months_selected.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cumul à date'
        }, 'month_filter_widget_component.is_month_cumulated_selected.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-selection automatique'
        }, 'month_filter_widget_component.auto_select_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.auto_select_month.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.auto_select_month.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer la pré-sélection relative'
        }, 'month_filter_widget_component.configure_auto_select_month_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection min'
        }, 'month_filter_widget_component.auto_select_month_min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection max'
        }, 'month_filter_widget_component.auto_select_month_max.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres invalides (max 12 mois)'
        }, 'month_filter_widget_component.no_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à'
        }, 'month_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Un autre filtre'
        }, 'month_filter_widget_component.is_relative_to_other_filter.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Aujourd\'hui'
        }, 'month_filter_widget_component.is_relative_to_other_filter.now.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à ce filtre'
        }, 'month_filter_widget_component.relative_to_other_filter_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'month_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Option Selectionner Tout" },
            'month_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Option Cumul à date" },
            'month_filter_widget_component.can_ytd_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Cumul à date - de Janvier à M - ..." },
            'month_filter_widget_component.ytd_option_m_minus_x.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Selectionner Tout" },
            'month_filter_widget_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Cumul à date" },
            'month_filter_widget_component.ytd.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres invalides (max 12 mois)'
        }, 'month_filter_input_component.no_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Selectionner Tout" },
            'month_filter_input_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Cumul à date" },
            'month_filter_input_component.ytd.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Cumuler les mois" },
            'month_filter_input_component.month_cumulated.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dates pour la colonne dynamique'
        }, 'table_widget_options_component.column_dynamic_var_date_custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copie du tableau de bord en cours...'
        }, 'copy_dashboard.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copie du tableau de bord terminée'
        }, 'copy_dashboard.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copie du tableau de bord échouée'
        }, 'copy_dashboard.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Collage du tableau de bord en cours...'
        }, 'paste_dashboard.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Collage du tableau de bord terminé'
        }, 'paste_dashboard.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Collage du tableau de bord échoué'
        }, 'paste_dashboard.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Copier ce tableau de bord dans le presse-papier'
        }, 'dashboard_builder.copy_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Remplacer ce tableau de bord en important depuis le presse-papier'
        }, 'dashboard_builder.replace_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer ce tableau de bord'
        }, 'dashboard_builder.delete_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nouveau tableau de bord vide'
        }, 'dashboard_builder.create_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Importer un nouveau tableau de bord depuis le presse-papier'
        }, 'dashboard_builder.create_dashboard_from.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Checklist'
        }, 'checklist_widget_options_component.checklist_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner une checklist'
        }, 'checklist_widget_options_component.checklist_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Ajouter"'
        }, 'checklist_widget_options_component.create_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.create_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.create_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Tout supprimer"'
        }, 'checklist_widget_options_component.delete_all_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.delete_all_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.delete_all_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Exporter"'
        }, 'checklist_widget_options_component.export_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.export_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.export_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Rafraîchir"'
        }, 'checklist_widget_options_component.refresh_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.refresh_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.refresh_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les éléments d\'une checklist'
        }, 'dashboards.widgets.icons_tooltips.checklist.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lancer la modification ?'
        }, 'BulkOpsWidgetComponent.bulkops.confirmation.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer'
        }, 'BulkOpsWidgetComponent.bulkops.confirmation.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifications terminées'
        }, 'BulkOpsWidgetComponent.bulkops.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Début modification en masse'
        }, 'BulkOpsWidgetComponent.bulkops.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifications échouées'
        }, 'BulkOpsWidgetComponent.bulkops.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifier les données en masse'
        }, 'bulkops.actions.confirm_bulkops.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champs'
        }, 'bulkops_widget_component.field_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Choisir un champs'
        }, 'bulkops_widget_component.field_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Opération'
        }, 'bulkops_widget_component.operator.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeur'
        }, 'bulkops_widget_component.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type de données'
        }, 'bulkops_widget_options_component.api_type_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Choisir un type de données'
        }, 'bulkops_widget_options_component.api_type_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Réaliser des modifications en masse'
        }, 'dashboards.widgets.icons_tooltips.bulkops.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurer le filtre des années'
        }, 'year_filter_widget_component.button_setter_widget_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Configurations du filtre des années'
        }, 'year_filter_widget_component.configurations_summary_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres invalides (max 15 années)'
        }, 'year_filter_widget_component.no_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'year_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Données'
        }, 'year_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeurs'
        }, 'year_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champs'
        }, 'year_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'year_filter_widget_component.custom_filter_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année minimale'
        }, 'year_filter_widget_component.min_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année maximale'
        }, 'year_filter_widget_component.max_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélection de toutes les années'
        }, 'year_filter_widget_component.is_all_years_selected.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Option Selectionner Tout" },
            'year_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Selectionner Tout" },
            'year_filter_widget_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres invalides (max 15 années)'
        }, 'year_filter_input_component.no_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Selectionner Tout" },
            'year_filter_input_component.select_all.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner un Dashboard...'
        }, 'dashboard_builder.select_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Onglet caché. Cliquer pour le rendre visible sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_show_navigation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Onglet visible. Cliquer pour le cacher sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_hide_navigation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Le premier onglet est obligatoirement visible.'
        }, 'dashboard_builder.pages.tooltip_cannot_hide_navigation.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliquer pour sélectionner et afficher cette page du Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_select_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliquer pour revenir à la page précédente.'
        }, 'dashboard_builder.pages.tooltip_select_previous_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cette page est actuellement sélectionnée et affichée.'
        }, 'dashboard_builder.pages.tooltip_selected_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer cette page du Tableaud de bord. Attention tous les widgets inclus dans la page seront également supprimés.'
        }, 'dashboard_builder.pages.tooltip_delete_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une page au Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_create_dashboard_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Table de données. Permet de lister, modifier et supprimer des données de l\'application.'
        }, 'dashboards.widgets.icons_tooltips.datatable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre sur la valeur d\'un champs. Sélectionner un champs et les paramètres de filtrage. Le filtre est appliqué à toutes les pages du Tableau de bord.'
        }, 'dashboards.widgets.icons_tooltips.fieldvaluefilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'KPI. Sélectionner une variable et un format d\'affichage.'
        }, 'dashboards.widgets.icons_tooltips.var.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lien vers une autre page. Permet de naviguer vers une autre page du Tableau de bord, même si celle-ci est cachée par ailleurs du menu.'
        }, 'dashboards.widgets.icons_tooltips.pageswitch.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Au clic, ouvrir cette page'
        }, 'page_switch_widget_options_component.page_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Texte du lien'
        }, 'page_switch_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Avancé'
        }, 'vo_field_ref_advanced.advanced_filters.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Simple'
        }, 'vo_field_ref_advanced.advanced_filters.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Impossible de supprimer la page principale'
        }, 'DashboardBuilderComponent.delete_page.cannot_delete_master_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer la page ?'
        }, 'DashboardBuilderComponent.delete_page.confirmation.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression'
        }, 'DashboardBuilderComponent.delete_page.confirmation.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Page en cours de suppression...'
        }, 'DashboardBuilderComponent.delete_page.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Page supprimée'
        }, 'DashboardBuilderComponent.delete_page.ok.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Composants'
        }, 'dashboard_builder_widgets.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionnez un composant dans la page pour le configurer'
        }, 'dashboard_builder_widgets.first_select_a_widget.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Composant sélectionné'
        }, 'dashboard_builder_widgets.widget_options_header_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'ajout du composant'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ko.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajout du composant en cours...'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Composant ajouté'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboard Builder'
        }, 'dashboard_builder.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilderAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'CMS Builder'
        }, 'menu.menuelements.admin.CMSBuilder.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'CMS Config'
        }, 'menu.menuelements.admin.CMSConfig.___LABEL___'));



        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Impossible de supprimer le dernier Dashboard'
        }, 'DashboardBuilderComponent.delete_dashboard.cannot_delete_master_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer le Dashboard ?'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours...'
        }, 'DashboardBuilderComponent.delete_dashboard.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supression terminée.'
        }, 'DashboardBuilderComponent.delete_dashboard.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champs'
        }, 'field_value_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélection multiple ?'
        }, 'field_value_filter_widget_component.can_select_multiple.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Texte champs de sélection'
        }, 'field_value_filter_widget_component.placeholder_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nombre max. valeurs visibles'
        }, 'field_value_filter_widget_component.max_visible_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer'
        }, 'droppable_vo_fields.filter_by_field_id_or_api_type_id.placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champs'
        }, 'droppable_vo_fields.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une colonne (champs ou variable)'
        }, 'table_widget_column.new_column_select_type_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une colonne dynamique'
        }, 'table_widget_column.add_dynamic_column.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ajouter une entête'
        }, 'table_widget_column.new_header_column_select_type_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Glisser/déposer un champs'
        }, 'single_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner une Variable'
        }, 'table_widget_column.new_column_select_type_var_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_widget_options_component.bg_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du texte'
        }, 'var_widget_options_component.fg_color_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Style du widget'
        }, 'var_widget_options_component.widget_style.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Icône du titre'
        }, 'var_widget_options_component.widget_icon.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille de l\'icône'
        }, 'var_widget_options_component.icon.size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable centrale'
        }, 'var_widget_options_component.var_name_principale.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable centrale basse'
        }, 'var_widget_options_component.var_name_a_date.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable à droite'
        }, 'var_widget_options_component.var_name_complementaire.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable à droite basse'
        }, 'var_widget_options_component.var_name_complementaire_supp.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende de la variable'
        }, 'var_widget_options_component.display_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Est affecté par les conditions'
        }, 'var_widget_options_component.is_condition_target.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable de condition'
        }, 'var_widget_options_component.var_condition.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Conditions d\'affichage'
        }, 'var_widget_options_component.conditional_icon.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Condition'
        }, 'var_widget_options_component.conditional_icon.condition.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeur'
        }, 'var_widget_options_component.conditional_icon.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sous-titre'
        }, 'var_widget_options_component.widget_subtitle.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vous pouvez utiliser "#date_max#" pour afficher la date maximale de la période.'
        }, 'var_widget_options_component.widget_subtitle.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Légende de la variable'
        }, 'var_widget_options_component.var_input_label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du widget'
        }, 'var_widget_options_component.separator.widget_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable centrale'
        }, 'var_widget_options_component.separator.first_var_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable centrale basse'
        }, 'var_widget_options_component.separator.second_var_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable à droite'
        }, 'var_widget_options_component.separator.third_var_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable à droite basse'
        }, 'var_widget_options_component.separator.fourth_var_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des conditions'
        }, 'var_widget_options_component.separator.condition_options.___LABEL___'));



        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filter'
        }, 'FieldValueFilterWidget.filter_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer le composant ?'
        }, 'DashboardBuilderBoardComponent.delete_widget.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression'
        }, 'DashboardBuilderBoardComponent.delete_widget.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours...'
        }, 'DashboardBuilderBoardComponent.delete_widget.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression terminée'
        }, 'DashboardBuilderBoardComponent.delete_widget.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable'
        }, 'var_widget_component.var_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'var_widget_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filter'
        }, 'droppable_vos.set_filter_by_api_type_id.placeholder.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tables'
        }, 'droppable_vos.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '1 - Tables'
        }, 'dashboard_builder.select_vos.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '2 - Widgets'
        }, 'dashboard_builder.build_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Editer'
        }, 'tables_graph_edit_form.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Gérer les liaisons'
        }, 'tables_graph_edit_form.bonds.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer'
        }, 'tables_graph_edit_form.delete.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sélectionner un élément'
        }, 'tables_graph_edit_form.no_object_selected.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer la suppression ?'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours...'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression terminée'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Variable'
        }, 'var_widget_options_component.var_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'var_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Monnaie'
        }, 'amount_filter_options.currency.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Décimales'
        }, 'amount_filter_options.fractionalDigits.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Humaniser'
        }, 'amount_filter_options.humanize.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pas de valeur négative'
        }, 'amount_filter_options.onlyPositive.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Montant'
        }, 'filters.names.__amount__.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pourcentage'
        }, 'filters.names.__percent__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Décimales'
        }, 'filters.names.__toFixed__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Décimales - Arrondi supérieur'
        }, 'filters.names.__toFixedCeil__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Décimales - Arrondi inférieur'
        }, 'filters.names.__toFixedFloor__.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'dow_filter_widget_component.is_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Données'
        }, 'dow_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeurs'
        }, 'dow_filter_widget_component.is_vo_field_ref.value.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Référence de champs (donnée filtrée)'
        }, 'dow_filter_widget_component.vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrer une date par le jour de la semaine'
        }, 'dashboards.widgets.icons_tooltips.dowfilter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton de validation des fitlres'
        }, 'dashboards.widgets.icons_tooltips.validationfilters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton de remise à zéro des filtres'
        }, 'dashboards.widgets.icons_tooltips.resetfilters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'dow_filter_widget_component.custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre'
        }, 'var_widget_options_component.widget_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type de filtre'
        }, 'widget_filter_options.filter_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '<b>ID: </b>{id}'
        }, 'table_widget_component.id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pas de données, veuillez vérifier que les tables nécessaires sont présentes.'
        }, 'var_chart_widget.error.no_data'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du widget'
        }, 'var_pie_chart_widget_options_component.separator.widget_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre personnalisé'
        }, 'var_pie_chart_widget_options_component.field_that_could_get_custom_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre du widget'
        }, 'var_pie_chart_widget_options_component.widget_title.title_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur du fond'
        }, 'var_pie_chart_widget_options_component.bg_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options du titre'
        }, 'var_pie_chart_widget_options_component.section.chart_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_title_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le titre'
        }, 'var_pie_chart_widget_options_component.title_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur'
        }, 'var_pie_chart_widget_options_component.title_font_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille'
        }, 'var_pie_chart_widget_options_component.title_font_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marge'
        }, 'var_pie_chart_widget_options_component.title_padding.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la légende'
        }, 'var_pie_chart_widget_options_component.separator.chart_legend_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher la légende'
        }, 'var_pie_chart_widget_options_component.legend_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher les étiquettes'
        }, 'var_pie_chart_widget_options_component.label_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des étiquettes'
        }, 'var_pie_chart_widget_options_component.separator.chart_label_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Position'
        }, 'var_pie_chart_widget_options_component.legend_position.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur'
        }, 'var_pie_chart_widget_options_component.legend_font_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Taille'
        }, 'var_pie_chart_widget_options_component.legend_font_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur'
        }, 'var_pie_chart_widget_options_component.legend_box_width.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marge'
        }, 'var_pie_chart_widget_options_component.legend_padding.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Style'
        }, 'var_pie_chart_widget_options_component.legend_style.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rond'
        }, 'var_pie_chart_widget_options_component.legend_style.circle.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rectangle'
        }, 'var_pie_chart_widget_options_component.legend_style.rectangle.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de rendu du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_render_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': '% de découpe'
        }, 'var_pie_chart_widget_options_component.cutout_percentage.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Indique la zone qui sera découpée dans le graphique en partant du centre vers les extrémités en pourcentage. 0 pour ne pas découper, 100 pour découper tout le graphique. Exemple : 50 pour un donut'
        }, 'var_pie_chart_widget_options_component.cutout_percentage.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Rotation'
        }, 'var_pie_chart_widget_options_component.rotation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Point de départ du graphique en degrés. Entre 0 et 360. Exemple pour une jauge : 270'
        }, 'var_pie_chart_widget_options_component.rotation.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Circonférence'
        }, 'var_pie_chart_widget_options_component.circumference.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Circonférence du graphique. Entre 0 et 360. Exemple pour une jauge : 180'
        }, 'var_pie_chart_widget_options_component.circumference.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des données'
        }, 'var_pie_chart_widget_options_component.separator.datas_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options des dimensions'
        }, 'var_pie_chart_widget_options_component.separator.datas_dimension_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Créer un filtre favori'
        }, 'dashboard_viewer.save_favorites_filters.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre enregistré'
        }, 'dashboard_viewer.save_favorites_filters.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement du filtre en cours...'
        }, 'dashboard_viewer.save_favorites_filters.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'enregistrement du filtre'
        }, 'dashboard_viewer.save_favorites_filters.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser une dimension de donnée, issue d\'un champ ou d\'un filtre date segmenté'
        }, 'var_pie_chart_widget_options_component.has_dimension.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'La dimension est un champ ?'
        }, 'var_pie_chart_widget_options_component.dimension_is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Champ de la dimension'
        }, 'var_pie_chart_widget_options_component.dimension_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Segmentation de la dimension'
        }, 'var_pie_chart_widget_options_component.dimension_custom_filter_segment_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Max. de valeurs pour la dimension choisie'
        }, 'var_pie_chart_widget_options_component.max_dimension_values.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Permet de définir un nombre max de résultats pris en compte pour le graphique sur la dimension proposée. Par exemple si on a sélectionné une année et qu\'on segmente au jour, on peut limiter aux 10 premiers jours en indiquant 10 ici.'
        }, 'var_pie_chart_widget_options_component.max_dimension_values.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'La conversion des devises suit le tableau suivant : "1€": 1€,"1$": 1.08€,"1£": 0.85€,"1¥": 169.69€,"1AU$": 1.63€,"1CA$": 1.48€,"1CHF": 0.99€,"1CN¥": 7.857464€,"1HK$": 8.46€,"1NZ$": 1.78€'
        }, 'var_pie_chart_widget_options_component.custom_filter_names_1.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par un champ'
        }, 'var_pie_chart_widget_options_component.sort_dimension_by_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Trier la dimension par ordre croissant ?'
        }, 'var_pie_chart_widget_options_component.sort_dimension_by_asc.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de filtrage des valeurs'
        }, 'var_pie_chart_widget_options_component.separator.datas_filter_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre des valeurs'
        }, 'var_pie_chart_widget_options_component.widget_filter_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable principale'
        }, 'var_pie_chart_widget_options_component.separator.var_1_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable principale'
        }, 'var_pie_chart_widget_options_component.var_name_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de fond'
        }, 'var_pie_chart_widget_options_component.bg_color_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre de la variable principale'
        }, 'var_pie_chart_widget_options_component.var_title_1.title_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de bordure'
        }, 'var_pie_chart_widget_options_component.border_color_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_pie_chart_widget_options_component.border_width_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Options de la variable secondaire'
        }, 'var_pie_chart_widget_options_component.separator.var_2_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom de la variable secondaire'
        }, 'var_pie_chart_widget_options_component.var_name_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de fond'
        }, 'var_pie_chart_widget_options_component.bg_color_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Couleur de bordure'
        }, 'var_pie_chart_widget_options_component.border_color_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_pie_chart_widget_options_component.border_width_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser la somme des deux variables comme valeur max ?'
        }, 'var_pie_chart_widget_options_component.max_is_sum_of_var_1_and_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nom du filtre de la dimension'
        }, 'var_pie_chart_widget_options_component.dimension_custom_filter_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Utiliser un dégradé de couleur ?'
        }, 'var_pie_chart_widget_options_component.bg_gradient.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Segmentation'
        }, 'tstz_filter_options.segment_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Date localisée (non GMT)'
        }, 'tstz_filter_options.localized.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Deux exemples:<ul><li>Si on veut un filtre A-1 (appelée Date_Am1 par exemple) relatif à un autre filtre A (appelé Date_A), on indique -1 en min et max sur le filtre Année et 0 sur les autres filtres relatifs (par exemple si la segmentation est sur le mois, on aura aussi un filtre Mois A-1 (nommé Date_Am1 aussi) relatif à un filtre Mois A (nommé Date_A) avec un champ relatif min et max à 0.</li>' +
                '<li>Si on veut un filtre M-1 (appelée Date_Mm1) relatif à un autre filtre (Date_M), sur le filtre Année Date_Mm1 on indique 0 en min/max relatif au filtre Année Date_M. Mais on indique dans le filtre Mois lié (donc nommé Date_Mm1 aussi) en min et max -1, relativement au filtre mois appelé Date_M. Si on est en janvier, le mois relatif sera alors négatif et l\'année du filtrage sera impactée automatiquement - pas graphiquement mais dans les requêtes.</li></ul>'
        }, 'year_filter_widget_component.auto_select_year.is_relative_to_other_filter.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Deux exemples:<ul><li>Si on veut un filtre A-1 (appelée Date_Am1 par exemple) relatif à un autre filtre A (appelé Date_A), on indique -1 en min et max sur le filtre Année et 0 sur les autres filtres relatifs (par exemple si la segmentation est sur le mois, on aura aussi un filtre Mois A-1 (nommé Date_Am1 aussi) relatif à un filtre Mois A (nommé Date_A) avec un champ relatif min et max à 0.</li>' +
                '<li>Si on veut un filtre M-1 (appelée Date_Mm1) relatif à un autre filtre (Date_M), sur le filtre Année Date_Mm1 on indique 0 en min/max relatif au filtre Année Date_M. Mais on indique dans le filtre Mois lié (donc nommé Date_Mm1 aussi) en min et max -1, relativement au filtre mois appelé Date_M. Si on est en janvier, le mois relatif sera alors négatif et l\'année du filtrage sera impactée automatiquement - pas graphiquement mais dans les requêtes.</li></ul>'
        }, 'month_filter_widget_component.auto_select_month.is_relative_to_other_filter.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'TstzFilterOptionsComponent.segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'TstzFilterOptionsComponent.segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'TstzFilterOptionsComponent.segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'TstzFilterOptionsComponent.segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année glissante'
        }, 'TstzFilterOptionsComponent.segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'TstzFilterOptionsComponent.segment_types.5.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'TstzFilterOptionsComponent.segment_types.6.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'TstzFilterOptionsComponent.segment_types.7.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année glissante'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.5.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.6.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.7.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année glissante'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.5.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.6.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'VarRadarChartWidgetOptionsComponent.dimension_custom_filter_segment_types.7.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement en cours...'
        }, 'TableWidgetComponent.onchange_column.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement terminé'
        }, 'TableWidgetComponent.onchange_column.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec de la mise à jour'
        }, 'TableWidgetComponent.onchange_column.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Largeur du contenu de la colonne, en rem (requis si colonne figée)'
        }, 'table_widget_column_conf.column_width.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modifiable'
        }, 'table_widget_column_conf.editable_column.editable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lecture seule'
        }, 'table_widget_column_conf.editable_column.readonly.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Composants'
        }, 'table_widget_column.new_column_select_type_component.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Actions'
        }, 'table_widget_bulk.new_bulk_action.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboards'
        }, 'menu.menuelements.admin.dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'GraphVORefs'
        }, 'menu.menuelements.admin.dashboard_graphvoref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pages'
        }, 'menu.menuelements.admin.dashboard_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Widgets / pages'
        }, 'menu.menuelements.admin.dashboard_pwidget.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Widgets'
        }, 'menu.menuelements.admin.dashboard_widget.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Colonnes'
        }, 'table_widget_options_component.columns.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Chaque colone peut &ecirc;tre configur&eacute;e individuellement et afficher ' +
                'les valeurs de filtres actifs avec lesquels elle a &eacute;t&eacute; filtr&eacute;e, ' +
                'pour les afficher if faut entrer le nom de la colonne suivi de ' +
                '\{\#active_filter\:\&lt;page_widget_id\&gt;\} o&ugrave; \&lt;page_widget_id\&gt; ' +
                'est l\'id du widget de type filtre actif &agrave; afficher.'
        }, 'table_widget_options_component.columns.ca_tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Activer la fonction CRUD'
        }, 'table_widget_options_component.crud_api_type_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Choisir type pour activer'
        }, 'table_widget_options_component.crud_api_type_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher un lien Vocus'
        }, 'table_widget_options_component.vocus_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'table_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.vocus_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.vocus_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton pour supprimer la ligne ?'
        }, 'table_widget_options_component.delete_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.delete_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.delete_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton pour modifier la ligne ?'
        }, 'table_widget_options_component.update_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.update_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.update_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Limite d\'affichage'
        }, 'table_widget_options_component.limit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton pour ajouter une ligne ?'
        }, 'table_widget_options_component.create_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.create_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.create_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton pour rafraîchir les données ?'
        }, 'table_widget_options_component.refresh_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Archiver"'
        }, 'table_widget_options_component.archive_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.refresh_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.refresh_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton pour exporter ?'
        }, 'table_widget_options_component.export_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.export_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.export_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Peut exporter les filtres actifs ?'
        }, 'table_widget_options_component.can_export_active_field_filters.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Peut exporter les variables "indicateur" ?'
        }, 'table_widget_options_component.can_export_vars_indicator.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bouton "Tout supprimer"'
        }, 'table_widget_options_component.delete_all_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.delete_all_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.delete_all_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtrage par champs'
        }, 'table_widget_options_component.can_filter_by.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.can_filter_by.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.can_filter_by.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer ?'
        }, 'TableWidgetComponent.confirm_delete.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supprimer'
        }, 'TableWidgetComponent.confirm_delete.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression en cours'
        }, 'TableWidgetComponent.confirm_delete.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression terminée'
        }, 'TableWidgetComponent.confirm_delete.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de la suppression'
        }, 'TableWidgetComponent.confirm_delete.ko.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'ET' },
            'adv_ref_field_fltr.et'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'OU' },
            'adv_ref_field_fltr.ou'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '<' },
            'adv_ref_field_fltr.inf'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '<=' },
            'adv_ref_field_fltr.infeq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '>' },
            'adv_ref_field_fltr.sup'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '>=' },
            'adv_ref_field_fltr.supeq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Est null' },
            'adv_ref_field_fltr.est_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'N\'est pas null' },
            'adv_ref_field_fltr.nest_pas_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '=' },
            'adv_ref_field_fltr.eq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '!=' },
            'adv_ref_field_fltr.not_eq'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'ET' },
            'adv_number_fltr.et'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'OU' },
            'adv_number_fltr.ou'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '<' },
            'adv_number_fltr.inf'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '<=' },
            'adv_number_fltr.infeq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '>' },
            'adv_number_fltr.sup'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '>=' },
            'adv_number_fltr.supeq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Est null' },
            'adv_number_fltr.est_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'N\'est pas null' },
            'adv_number_fltr.nest_pas_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '=' },
            'adv_number_fltr.eq'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '!=' },
            'adv_number_fltr.not_eq'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Contient' },
            'adv_str_fltr.contient'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ne contient pas' },
            'adv_str_fltr.contient_pas'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Commence par' },
            'adv_str_fltr.commence'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ne commence pas par' },
            'adv_str_fltr.commence_pas'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Est' },
            'adv_str_fltr.est'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'N\'est pas' },
            'adv_str_fltr.nest_pas'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Est vide' },
            'adv_str_fltr.est_vide'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'N\'est pas vide' },
            'adv_str_fltr.nest_pas_vide'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Est null' },
            'adv_str_fltr.est_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'N\'est pas null' },
            'adv_str_fltr.nest_pas_null'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Expression régulière' },
            'adv_str_fltr.regexp'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ajouter un filtre' },
            'advanced_filters.add.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Valider le filtre' },
            'advanced_filters.validate.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Choisir le type de liaison entre ce filtre et le suivant (ET ou OU)' },
            'advanced_filters.link_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Supprimer ce filtre' },
            'advanced_filters.delete.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'ET' },
            'adv_str_fltr.et'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'OU' },
            'adv_str_fltr.ou')
        );

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le 2ème niveau si le niveau 1 n'est pas sélectionné" },
            'field_value_filter_widget_component.hide_lvl2_if_lvl1_not_selected.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le filtre au format case à cocher" },
            'field_value_filter_widget_component.is_checkbox.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombre de colonnes de cases à cocher" },
            'field_value_filter_widget_component.checkbox_columns.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "1" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.1'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "2" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.2'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "3" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.3'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "4" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.4'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "6" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.6'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "12" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.12'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le champ de recherche" },
            'field_value_filter_widget_component.show_search_field.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Séparer les données activées et les options" },
            'field_value_filter_widget_component.separation_active_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ à afficher au 2ème niveau" },
            'field_value_filter_widget_component.vo_field_ref_lvl2.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ pour trier l'affichage du filtre" },
            'field_value_filter_widget_component.vo_field_sort.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ pour trier l'affichage du filtre de niveau 2" },
            'field_value_filter_widget_component.vo_field_sort_lvl2.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Granularité" },
            'field_value_filter_widget_component.segmentation_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Pas de tri" },
            'column.sort.no.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tri ascendant" },
            'column.sort.asc.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tri descendant" },
            'column.sort.desc.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Copier la requête pour les données de la page" },
            'TableWidgetTableComponent.contextmenu.get_page_rows_datas_query_string.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Copier la requête pour compter les résultats" },
            'TableWidgetTableComponent.contextmenu.get_rows_count_query_string.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Copier la requête pour toutes les données" },
            'TableWidgetTableComponent.contextmenu.get_all_rows_datas_query_string.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Mode avancé par défaut" },
            'field_value_filter_widget_component.advanced_mode.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type de recherche avancé par défaut" },
            'field_value_filter_widget_component.default_advanced_string_filter_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type de recherche avancé par défaut" },
            'field_value_filter_widget_component.default_advanced_ref_field_filter_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le type de recherche avancé" },
            'field_value_filter_widget_component.hide_advanced_string_filter_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le type de recherche avancé" },
            'field_value_filter_widget_component.hide_advanced_ref_field_filter_type.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le bouton avancé" },
            'field_value_filter_widget_component.hide_btn_switch_advanced.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Placeholder pour le champs de recherche" },
            'field_value_filter_widget_component.placeholder_advanced_string_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Liste des champs pour la recherche multiple" },
            'field_value_filter_widget_component.vo_field_ref_multiple.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrer" },
            'CurrentUserFilterWidget.filter_placeholder.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Texte champs de sélection" },
            'current_user_filter_widget_options_component.placeholder_name_code_text.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ de référence" },
            'current_user_filter_widget_options_component.vo_field_ref.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Glisser / Déposer les champs pour la recherche multiple" },
            'multiple_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Liste des valeurs sélectionnables (valeurs séparées par une virgule ',')" },
            'table_widget_options_component.limit_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Appliquer les filtres par défaut sans valider" },
            'table_widget_options_component.can_apply_default_field_filters_without_validation.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher sélecteur nombre d'éléments" },
            'table_widget_options_component.show_limit_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_limit_selectable.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_limit_selectable.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le formulaire de pagination" },
            'table_widget_options_component.show_pagination_form.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_form.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_form.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher la pagination sous forme de liste (prev/next)" },
            'table_widget_options_component.show_pagination_list.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombre de blocs page cliquables" },
            'table_widget_options_component.nbpage_pagination_list.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_list.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_list.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le footer de total" },
            'table_widget_options_component.has_table_total_footer.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.has_table_total_footer.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.has_table_total_footer.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le résumé de pagination" },
            'table_widget_options_component.show_pagination_resumee.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_resumee.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_resumee.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Charger les widgets avant première validation" },
            'table_widget_options_component.load_widgets_prevalidation.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.load_widgets_prevalidation.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.load_widgets_prevalidation.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le slider de pagination" },
            'table_widget_options_component.show_pagination_slider.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_slider.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_slider.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Configurer les couleurs" },
            'table_widget_column_conf.color_configuration_section.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur de fond de l'entête" },
            'table_widget_column_conf.editable_column.bg_color_header.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Classe CSS personnalisé" },
            'table_widget_column_conf.editable_column.custom_class_css.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du texte de l'entête" },
            'table_widget_column_conf.editable_column.font_color_header.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Configurer les themes de cellules par valeurs" },
            'table_widget_column_conf.editable_column.conditional_cell_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Condition" },
            'table_widget_column_conf.editable_column.conditional_cell_color.condition.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeur" },
            'table_widget_column_conf.editable_column.conditional_cell_color.value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur cellule" },
            'table_widget_column_conf.editable_column.conditional_cell_color.bg_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur texte" },
            'table_widget_column_conf.editable_column.conditional_cell_color.text_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aperçu" },
            'table_widget_column_conf.editable_column.conditional_cell_color.preview.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter theme cellule" },
            'table_widget_column_conf.editable_column.conditional_cell_color.add.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Format" },
            'table_widget_column_conf.filter_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aggréger les données" },
            'table_widget_column_conf.editable_column.many_to_many_aggregate.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aggréger les données" },
            'table_widget_column_conf.editable_column.many_to_many_aggregate.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Désactiver les liens ManyToOne" },
            'table_widget_column_conf.editable_column.disabled_many_to_one_link.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Désactiver les liens ManyToOne" },
            'table_widget_column_conf.editable_column.disabled_many_to_one_link.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "La donnée peut être vide si ContextAccessHook présent" },
            'table_widget_column_conf.editable_column.is_nullable.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "La donnée peut être vide si ContextAccessHook présent" },
            'table_widget_column_conf.editable_column.is_nullable.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher la popup" },
            'table_widget_column_conf.editable_column.show_tooltip.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher la popup" },
            'table_widget_column_conf.editable_column.show_tooltip.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sommer les datas" },
            'table_widget_column_conf.editable_column.sum_numeral_datas.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ne somme pas les datas" },
            'table_widget_column_conf.editable_column.sum_numeral_datas.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "HTML avec mise en forme" },
            'table_widget_column_conf.editable_column.explicit_html.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "HTML sans mise en forme" },
            'table_widget_column_conf.editable_column.explicit_html.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Période fixe (calendrier)" },
            'adfd_desc.search_type.calendar'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Par rapport à aujourd'hui" },
            'adfd_desc.search_type.last'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "CAD - fin relative à aujourd'hui" },
            'adfd_desc.search_type.ytd'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dans le cas d\'un cumul à date, on peut sélectionner le segment de fin de la période relativement à la date du jour (le segment défini est inclu dans la sélection).' +
                ' La date de début est le début de l\'année de la date de fin.'
        }, 'advanced_date_filter_widget_opt.search_type_ytd.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher un calendrier" },
            'adfd_desc.search_type.custom'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Données'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valeurs'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Case à cocher" },
            'advanced_date_filter_widget_component.is_checkbox.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'advanced_date_filter_widget_component.is_checkbox.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'advanced_date_filter_widget_component.is_checkbox.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeur par défaut" },
            'advanced_date_filter_widget_component.default_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Liste des options" },
            'advanced_date_filter_widget_component.opts.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une option" },
            'advanced_date_filter_widget_component.opts.add.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ de référence" },
            'advanced_date_filter_widget_component.vo_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrer une date avec options" },
            'dashboards.widgets.icons_tooltips.advanceddatefilter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Choisir des valeurs par défaut (sinon à exclure)" },
            'field_value_filter_widget_component.default_value_or_exclude.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeurs affichées par défaut du filtre (pour la Supervision)" },
            'field_value_filter_widget_component.default_showed_filter_opt_values.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': "Utile dans le cas où on souhaite forcer une valeur visible en filtre " +
                    "qui ne sera pas toujours présente dans le résultat de la requête des valeurs " +
                    "en base de données"
            },
            'field_value_filter_widget_component.default_showed_filter_opt_values.ca_tooltip.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeurs par défaut du filtre" },
            'field_value_filter_widget_component.default_filter_opt_values.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeurs à exclure du filtre" },
            'field_value_filter_widget_component.exclude_filter_opt_values.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'field_value_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Du'
        }, 'ts_range_input.placeholder.date_debut.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'au'
        }, 'ts_range_input.placeholder.date_fin.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le filtre n'utilise pas le filtrage actif" },
            'field_value_filter_widget_component.no_inter_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le filtre dépend d'un autre objet" },
            'field_value_filter_widget_component.has_other_ref_api_type_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Objet interdépendant" },
            'field_value_filter_widget_component.other_ref_api_type_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Validation automatique du filtre avancé" },
            'field_value_filter_widget_component.autovalidate_advanced_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Validation manuelle avec validation automatique du filtre avancé" },
            'field_value_filter_widget_component.active_field_on_autovalidate_advanced_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter l'option 'Non renseigné' dans la liste déroulante" },
            'field_value_filter_widget_component.add_is_null_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du fond" },
            'field_value_filter_widget_component.bg_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur de la valeur" },
            'field_value_filter_widget_component.fg_color_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du texte" },
            'field_value_filter_widget_component.fg_color_text.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non renseigné" },
            'datafilteroption.is_null.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Grouper les filtres" },
            'dashboard_viewer.group_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Voir les filtres par défaut" },
            'dashboard_viewer.collapse_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Problème lors du chargement du Tableau de bord" },
            'dashboard_viewer.loading_failed.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valider" },
            'dashboard_viewer.block_widgets_updates.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Réinitialiser" },
            'dashboard_viewer.block_widgets_reset.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sauvegarder les requêtes" },
            'dashboard_viewer.favorites_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Configurez vos filres à dates des exports" },
            'dashboard_viewer.favorites_filters.date_custom_configs.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Configurer le filtre favori" },
            'dashboard_viewer.favorites_filters.modal_title.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Paramètres" },
            'dashboard_viewer.favorites_filters.selection_tab.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Configurer les exports" },
            'dashboard_viewer.favorites_filters.export_tab.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionnez vos filtres de requête" },
            'dashboard_viewer.favorites_filters.select_favorites.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Erreurs de saisie" },
            'dashboard_viewer.favorites_filters.form_errors.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Entrer le nom du filtre favori *:" },
            'dashboard_viewer.favorites_filters.enter_name.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nom de la requête requise" },
            'dashboard_viewer.favorites_filters.name_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Planification des exports" },
            'dashboard_viewer.favorites_filters.export_planification.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Fréquence d'export de données requise" },
            'dashboard_viewer.favorites_filters.export_frequency_every_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Granularité d'export de données requise" },
            'dashboard_viewer.favorites_filters.export_frequency_granularity_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Jour du mois pour l'export de données requis" },
            'dashboard_viewer.favorites_filters.export_frequency_day_in_month_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Données à exporté requis" },
            'dashboard_viewer.favorites_filters.selected_exportable_data_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Saisissez les données à exporter" },
            'dashboard_viewer.favorites_filters.exportable_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Comportement du filtre favori" },
            'dashboard_viewer.favorites_filters.behaviors_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Remplacer les filtres actifs" },
            'dashboard_viewer.favorites_filters.overwrite_active_field_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser les dates fixes des filtres actifs" },
            'dashboard_viewer.favorites_filters.use_field_filters_fixed_dates.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Souhaitez-vous planifier les export ?" },
            'dashboard_viewer.favorites_filters.should_plan_export.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Exporter tous les *:" },
            'dashboard_viewer.favorites_filters.export_frequency_every.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Granularité *:" },
            'dashboard_viewer.favorites_filters.export_frequency_granularity.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Jour dans le mois *:" },
            'dashboard_viewer.favorites_filters.export_frequency_day_in_month.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionnez les tableaux de valeurs à exporter *:" },
            'dashboard_viewer.favorites_filters.select_exportable_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sauver favoris" },
            'dashboard_viewer.favorites_filters.save_favorites.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sauvegarde des requêtes en cours" },
            'dashboard_viewer.favorites_filters.start.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Requêtes sauvegardés avec succès" },
            'dashboard_viewer.favorites_filters.ok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Erreur lors de la sauvegarde des filtres" },
            'dashboard_viewer.favorites_filters.failed.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer la pagination du bas" },
            'table_widget_options_component.hide_pagination_bottom.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.hide_pagination_bottom.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.hide_pagination_bottom.visible.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Appliquer les filtres' },
            'show_favorites_filters_widget_component.validate_favorites_filters_selection.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Décimales' },
            'to_fixed_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondi" },
            'to_fixed_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Décimales' },
            'to_fixed_ceil_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondi" },
            'to_fixed_ceil_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_ceil_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_ceil_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Décimales' },
            'percent_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'pts au lieu de %' },
            'percent_filter_options.pts.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Signe explicite' },
            'percent_filter_options.explicit_sign.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Evolution ? (-100%)' },
            'percent_filter_options.evol_from_prct.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '999 == infini' },
            'percent_filter_options.treat_999_as_infinite.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Décimales' },
            'to_fixed_floor_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondi" },
            'to_fixed_floor_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_floor_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_floor_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Désactiver les liens ManyToOne pour ne pas rendre la donnée cliquable dans le tableau" },
            'table_widget_column_conf.disabled_many_to_one_link.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Activer / Désactiver l'export de la donnée" },
            'table_widget_column_conf.exportable_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Conditionne l'affichage de la donnée" },
            'table_widget_column_conf.filter_by_access.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher / Masquer la donnée dans le tableau (dans tous les cas, charge la donnée via la requête)" },
            'table_widget_column_conf.hide_from_table_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': "Dans le cas d'un champ externe à l'api_type_id de la table, on indique s'il est possible qu'il n'y ai pas de VO lié. <br/>" +
                    "Exemple: On affiche la liste des utilisateurs (UserVO) avec le nom du rôle (RoleVO). Si l'utilisateur n'a pas de rôle et qu'il y a un ContextFilterHook sur les rôles, la ligne ne s'affichera pas dans le tableau.<br/>" +
                    "Si on coche cette case, la ligne s'affichera quand même mais le champ rôle sera vide."
            },
            'table_widget_column_conf.is_nullable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Figer la colonne du tableau pour qu'elle soit toujours visible au niveau du scroll." },
            'table_widget_column_conf.is_sticky_column.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrer par l\'utilisateur connecté." },
            'dashboards.widgets.icons_tooltips.currentuserfilter.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': "Aggréger les données ManyToMany pour regrouper les données sur une seul ligne.<br/>" +
                    "Exemple: On affiche la liste des utilisateurs (UserVO) avec le nom des rôles (RoleVO). Si un utilisateur a plusieurs rôles, on va afficher sur une seule ligne avec un séparateur."
            },
            'table_widget_column_conf.many_to_many_aggregate.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher une popup sur les champs du tableau" },
            'table_widget_column_conf.show_tooltip.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer si filtres actifs" },
            'table_widget_column.hide_if_any_filter_active.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer si 1 filtre actif" },
            'table_widget_column_conf.hide_if_any_filter_active.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtres" },
            'table_widget_column.show_if_any_filter_active.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher si 1 filtre actif" },
            'table_widget_column_conf.show_if_any_filter_active.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtres à ne pas utiliser" },
            'table_widget_column.do_not_user_filter_active_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtres à ne pas utiliser dans la création du param de la VAR" },
            'table_widget_column_conf.do_not_user_filter_active_ids.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "La colonne peut-être éditée directement dans le tableau" },
            'table_widget_column_conf.editable_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "La colonne est filtrable en cliquant directement sur la donnée" },
            'table_widget_column_conf.can_filter_by_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aligner à droite" },
            'table_widget_column_conf.align_content_right.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Alignement par défaut" },
            'table_widget_column_conf.editable_column.align_content_right.default.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aligner à droite" },
            'table_widget_column_conf.editable_column.align_content_right.right.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Supervision" },
            'dashboards.widgets.icons_tooltips.supervision.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type de supervision (api_type_id)" },
            'dashboards.widgets.icons_tooltips.supervision_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le filtre sous forme de bouton" },
            'field_value_filter_widget_component.is_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Types de supervision" },
            'supervision_type_widget_component.supervision_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionner les types de supervision" },
            'supervision_type_widget_component.supervision_api_type_ids_select.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tout" },
            'supervision_widget_component.all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Dernière MAJ" },
            'supervision_widget_component.table.last_update.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Valeur" },
            'supervision_widget_component.table.last_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sonde" },
            'supervision_widget_component.table.name.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le détail" },
            'supervision_widget_component.table.show_detail.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Rechargement automatique" },
            'supervision_widget_options_component.auto_refresh.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'supervision_widget_options_component.auto_refresh.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'supervision_widget_options_component.auto_refresh.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Recharger toutes les (en secondes)" },
            'supervision_widget_options_component.auto_refresh_seconds.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombre d'éléments à afficher" },
            'supervision_widget_options_component.limit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le bouton de rechargement manuel" },
            'supervision_widget_options_component.refresh_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'supervision_widget_options_component.refresh_button.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'supervision_widget_options_component.refresh_button.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Types de supervision" },
            'supervision_widget_options_component.supervision_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionner les types de supervision" },
            'supervision_widget_options_component.supervision_api_type_ids_select.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nom" },
            'supervision_widget_options_component.widget_title.title_name_code_text.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Fermer" },
            'supervision.supervision_item_modal.close.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le compteur par valeurs" },
            'field_value_filter_widget_component.show_count_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher / Masquer la modification du style des options" },
            'field_value_filter_widget_component.show_hide_enum_color_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Marquer comme lu" },
            'supervision_widget_component.mark_as_read.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Marquer comme non lu" },
            'supervision_widget_component.mark_as_unread.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tout sélectionner" },
            'supervision_widget_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tout déselectionner" },
            'supervision_widget_component.unselect_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrer sur tous les types (pour la Supervision seulement)" },
            'field_value_filter_widget_component.force_filter_by_all_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Bulk Edit" },
            'supervision_widget_options_component.show_bulk_edit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Bulk Edit" },
            'table_widget_options_component.show_bulk_edit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Légende du tableau" },
            'table_widget_options_component.legende_tableau.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Option Sélectionner Tout" },
            'field_value_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Option Selectionner Aucun" },
            'field_value_filter_widget_component.can_select_none_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-selection automatique'
        }, 'field_value_filter_widget_component.auto_select_date.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'field_value_filter_widget_component.auto_select_date.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'field_value_filter_widget_component.auto_select_date.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative'
        }, 'field_value_filter_widget_component.auto_select_date_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Oui'
        }, 'field_value_filter_widget_component.auto_select_date_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Non'
        }, 'field_value_filter_widget_component.auto_select_date_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à'
        }, 'field_value_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Un autre filtre'
        }, 'field_value_filter_widget_component.is_relative_to_other_filter.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Aujourd\'hui'
        }, 'field_value_filter_widget_component.is_relative_to_other_filter.now.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection min'
        }, 'field_value_filter_widget_component.auto_select_date_min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection max'
        }, 'field_value_filter_widget_component.auto_select_date_max.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Deux exemples:<ul><li>Si on veut un filtre A-1 (appelée Date_Am1 par exemple) relatif à un autre filtre A (appelé Date_A), on indique -1 en min et max sur le filtre Année et 0 sur les autres filtres relatifs (par exemple si la segmentation est sur le mois, on aura aussi un filtre Mois A-1 (nommé Date_Am1 aussi) relatif à un filtre Mois A (nommé Date_A) avec un champ relatif min et max à 0.</li>' +
                '<li>Si on veut un filtre M-1 (appelée Date_Mm1) relatif à un autre filtre (Date_M), sur le filtre Année Date_Mm1 on indique 0 en min/max relatif au filtre Année Date_M. Mais on indique dans le filtre Mois lié (donc nommé Date_Mm1 aussi) en min et max -1, relativement au filtre mois appelé Date_M. Si on est en janvier, le mois relatif sera alors négatif et l\'année du filtrage sera impactée automatiquement - pas graphiquement mais dans les requêtes.</li></ul>'
        }, 'field_value_filter_widget_component.auto_select_date.is_relative_to_other_filter.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser cette table pour la comptage des valeurs dans les filtres (si activé)" },
            'table_widget_options_component.use_for_count.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sauvegarder les requêtes en favoris" },
            'dashboards.widgets.icons_tooltips.savefavoritesfilters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Voir les requêtes favoris" },
            'dashboards.widgets.icons_tooltips.showfavoritesfilters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nom du filtre" },
            'show_favorites_filters_widget_component.vo_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombre maximum d'éléments à afficher" },
            'show_favorites_filters_widget_component.max_visible_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Peut configurer des exports" },
            'favorites_filters_widget_component.can_configure_export.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Peut configurer les filtres à dates dynamique" },
            'favorites_filters_widget_component.can_configure_date_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Envoyer un email avec notification d'exports" },
            'favorites_filters_widget_component.send_email_with_export_notification.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Alerte de maintenance de l\'export'
        }, 'table_widget_options_component.has_export_maintenance_alert.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tout sélectionner" },
            'table_widget_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tout déselectionner" },
            'table_widget_component.unselect_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher Bulk Edit" },
            'table_widget_options_component.show_bulk_edit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher boutons tout (dé)sélectionner" },
            'table_widget_options_component.show_bulk_select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Actions" },
            'table_widget_options_component.cb_bulk_actions.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer la liste des options" },
            'advanced_date_filter_widget_component.hide_opts.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ne pas mettre à jour la donnée du filtre si pas de date de début" },
            'advanced_date_filter_widget_component.refuse_left_open.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ne pas mettre à jour la donnée du filtre si pas de date de fin" },
            'advanced_date_filter_widget_component.refuse_right_open.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à un autre filtre'
        }, 'advanced_date_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Pré-sélection relative à ce filtre'
        }, 'advanced_date_filter_widget_component.relative_to_other_filter_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Pré-sélection relative à aujourd'hui"
        }, 'advanced_date_filter_widget_component.is_relative_to_today.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Masquer le filtre"
        }, 'advanced_date_filter_widget_component.hide_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Heure" },
            'filters.names.__hour__.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aucun" },
            'filters.names.__none__.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Date" },
            'filters.names.__tstz__.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondi misnutes" },
            'hour_filter_options.arrondiMinutes.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Affichage formatté pour afficher xxhxx" },
            'hour_filter_options.formatted.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Affichage des valeurs négatives" },
            'hour_filter_options.negativeValue.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter le signe +/- explicite" },
            'hour_filter_options.positiveSign.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondi" },
            'hour_filter_options.rounded.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Composant à utiliser dans la colonne dynamique" },
            'table_widget_options_component.column_dynamic_component.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Variable à utiliser dans la colonne dynamique" },
            'table_widget_options_component.column_dynamic_var.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Variable à utiliser dans la colonne dynamique" },
            'table_widget_column.column_dynamic_var.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Composant à utiliser dans la colonne" },
            'table_widget_options_component.column_dynamic_component.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtre à utiliser pour les colonnes dynamiques" },
            'table_widget_options_component.column_dynamic_page_widget_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Segment de date" },
            'table_widget_options_component.column_dynamic_time_segment.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionner les filtres à ne pas utiliser" },
            'table_widget_options_component.do_not_use_page_widget_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionner les filtres à ne pas utiliser" },
            'list_object_widget_options_component.do_not_use_page_widget_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser un filtre pour avoir des colonnes dynamiques dans le tableau" },
            'table_widget_options_component.has_column_dynamic.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher un message lorsqu'il n'y a pas de données" },
            'table_widget_options_component.show_message_no_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_message_no_data.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_message_no_data.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Message à afficher" },
            'table_widget_options_component.message_no_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher un message lorsqu'il n'y a pas de données" },
            'listobject_widget.show_message_no_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'listobject_widget.show_message_no_data.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'listobject_widget.show_message_no_data.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Message à afficher" },
            'listobject_widget.message_no_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter un nouvel indicateur" },
            'crud.field.custom_field.add_new_indicateur.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Trimestres" },
            'ts_ranges_input.placeholder.quarters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "T" },
            'time_segment.quarter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Relative date min" },
            'advanced_date_filter_widget_component.auto_select_relative_date_min.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Relative date max" },
            'advanced_date_filter_widget_component.auto_select_relative_date_max.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser une palette" },
            'var_charts_options_component.use_palette.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Choisissez une palette..." },
            'var_charts_options_component.color_palette_selector_placeholder.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'var_mixed_charts_widget_options_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'var_radar_chart_widget_options_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Masquer le filtre" },
            'var_pie_chart_widget_options_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le bouton de rechargement manuel" },
            'supervision_type_widget_component.refresh_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Rechargement automatique" },
            'supervision_type_widget_component.auto_refresh.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Recharger toutes les (en secondes)" },
            'supervision_type_widget_component.auto_refresh_seconds.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titre" },
            'cms_bloc_text.widget_option.titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sous-titre" },
            'cms_bloc_text.widget_option.sous_titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sur-titre" },
            'cms_bloc_text.widget_option.sur_titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Contenu" },
            'cms_bloc_text.widget_option.contenu.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Alignement du titre" },
            'cms_bloc_text.widget_option.alignement_titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Alignement du sous-titre" },
            'cms_bloc_text.widget_option.alignement_sous_titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Alignement du contenu" },
            'cms_bloc_text.widget_option.alignement_contenu.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Gauche" },
            'cms_bloc_text.alignement.gauche.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré" },
            'cms_bloc_text.alignement.centre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Droite" },
            'cms_bloc_text.alignement.droite.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Justifié" },
            'cms_bloc_text.alignement.justifie.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Justifié" },
            'cms_bloc_text.alignement.justifie.___LABEL___'
        ));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Options de la liste" },
            'list_object_widget_options_component.separator.widget_options.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titres" },
            'list_object_widget_options_component.widget_title.title.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titres (champ obligatoire)" },
            'list_object_widget_options_component.widget_title.title_mandaroty.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sous-titres" },
            'list_object_widget_options_component.widget_subtitle.subtitle.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sur-titre" },
            'list_object_widget_options_component.widget_surtitre.surtitre.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Images" },
            'list_object_widget_options_component.widget_image.image.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombres" },
            'list_object_widget_options_component.widget_number.number.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Nombre d\'éléments" },
            'list_object_widget_options_component.number_of_elements.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Tri d\'affichage" },
            'list_object_widget_options_component.sort_dimension_by.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Orientation" },
            'list_object_widget_options_component.display_orientation.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Card" },
            'ListObjectWidgetOptionsVO.type_display_card.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Liste" },
            'ListObjectWidgetOptionsVO.type_display_list.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Horizontal" },
            'ListObjectWidgetOptionsVO.display_orientation_horizontal.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Vertical" },
            'ListObjectWidgetOptionsVO.display_orientation_vertical.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Activer le bouton like" },
            'list_object_widget_options_component.activate_like_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type d'affichage" },
            'list_object_widget_options_component.type_display.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Les éléments sont des boutons" },
            'list_object_widget_options_component.button_for_elements.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "URL" },
            'list_object_widget_options_component.url.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser blank" },
            'list_object_widget_options_component.use_blank.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ pour trier" },
            'list_object_widget_options_component.sort_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher une seule carte (zoomée)" },
            'list_object_widget_options_component.card_width.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter un texte après le surtitre" },
            'list_object_widget_options_component.symbole_surtitre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter un texte après le sous titre" },
            'list_object_widget_options_component.symbole_sous_titre.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le titre est une date ?" },
            'cms_bloc_text.widget_option.titre_template_is_date.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le sous-titre est une date ?" },
            'cms_bloc_text.widget_option.sous_titre_template_is_date.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le sur-titre est une date ?" },
            'cms_bloc_text.widget_option.sur_titre_template_is_date.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Le contenu est une date ?" },
            'cms_bloc_text.widget_option.contenu_template_is_date.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter un texte après le sous-titre" },
            'cms_bloc_text.widget_option.sous_titre_symbole.___LABEL___'
        ));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "URL" },
            'cms_link_button.widget_option.url.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Texte du bouton" },
            'cms_link_button.widget_option.titre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Lien vers lequel le bouton doit renvoyer." },
            'cms_link_button.tooltip_url.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ouvrir dans un autre onglet ?" },
            'cms_link_button.widget_option.about_blank.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_link_button.widget_option.about_blank.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_link_button.widget_option.about_blank.false.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du bouton" },
            'cms_link_button.widget_option.color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Blanc" },
            'cms_link_button.widget_option.text_color.blanc.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Noir" },
            'cms_link_button.widget_option.text_color.noir.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du texte du bouton" },
            'cms_link_button.widget_option.text_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Icône" },
            'cms_link_button.widget_option.icone.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Code FontAwesome" },
            'cms_link_button.widget_option.icone.tooltip.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_link_button.widget_option.is_url_field.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_link_button.widget_option.is_url_field.false.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "L'URL est un champs ?" },
            'cms_link_button.widget_option.is_url_field.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondir les angles (valeur en degrés)" },
            'cms_image.widget_option.radius.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Bouton de redirection" },
            'dashboards.widgets.icons_tooltips.cmslinkbutton.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Image simple" },
            'dashboards.widgets.icons_tooltips.cmsimage.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Bloc de texte" },
            'dashboards.widgets.icons_tooltips.cmsbloctext.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "CMS Builder" },
            'cms_builder.title.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Sélectionner un Viewport..." },
            'dashboard_builder.select_viewport.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': " colonnes" },
            'dashboard_builder.viewport.columns.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ce viewport n'a pas été encore activé pour cette page. La disposition de vos widgets risque de ne pas être compatible avec ce nouveau viewport. Souhaitez-vous qu'un positionnement par défaut soit appliqué à vos widgets ?" },
            'dashboard_builder.viewport_not_activated.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui, définir une disposition par défaut." },
            'dashboard_builder.viewport_not_activated.yes.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non, garder l'ancienne disposition." },
            'dashboard_builder.viewport_not_activated.no.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur" },
            'cms_like_button.widget_option.color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Arrondir les angles (valeur en degrés)" },
            'cms_like_button.widget_option.radius.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Bouton \"J'aime\"" },
            'dashboards.widgets.icons_tooltips.cmslikebutton.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ image à utiliser pour le template (dynamique)" },
            'cms_image.widget_option.field_ref_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Fichier à uploader" },
            'cms_image.widget_option.file_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser en mode template (dynamique)" },
            'cms_image.widget_option.use_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser en mode template (dynamique)" },
            'cms_bloc_text.widget_option.use_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Utiliser en mode template (dynamique)" },
            'cms_visionneuse_pdf.widget_option.use_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ contenu à utiliser pour le template (dynamique)" },
            'cms_visionneuse_pdf.widget_option.field_ref_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Fichier" },
            'cms_visionneuse_pdf.widget_option.file_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ contenu à utiliser pour le template (dynamique)" },
            'cms_image.widget_option.contenu_field_ref_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ sous-titre à utiliser pour le template (dynamique)" },
            'cms_image.widget_option.sous_titre_field_ref_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ sur-titre à utiliser pour le template (dynamique)" },
            'cms_image.widget_option.sur_titre_field_ref_for_template.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ titre à utiliser pour le template (dynamique)" },
            'cms_image.widget_option.titre_field_ref_for_template.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré au centre" },
            'cms_image.position.centre_centre.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré à gauche" },
            'cms_image.position.centre_gauche.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré à droite" },
            'cms_image.position.centre_droite.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré en haut" },
            'cms_image.position.centre_haut.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Centré en base" },
            'cms_image.position.centre_bas.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "En haut à gauche" },
            'cms_image.position.haut_gauche.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "En haut à droite" },
            'cms_image.position.haut_droite.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "En bas à gauche" },
            'cms_image.position.bas_gauche.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "En bas à droite" },
            'cms_image.position.bas_droite.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Par défaut" },
            'cms_image.mise_en_page.defaut.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couvrir" },
            'cms_image.mise_en_page.couvrir.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Contenir" },
            'cms_image.mise_en_page.contenir.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Position" },
            'cms_image.widget_option.position.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Mise en page" },
            'cms_image.widget_option.mise_en_page.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le bouton d'ajout" },
            'cms_crud_buttons.widget_option.show_add.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_crud_buttons.widget_option.show_add.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_crud_buttons.widget_option.show_add.false.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le bouton de mise à jour" },
            'cms_crud_buttons.widget_option.show_update.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_crud_buttons.widget_option.show_update.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_crud_buttons.widget_option.show_update.false.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher le bouton de suppression" },
            'cms_crud_buttons.widget_option.show_delete.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_crud_buttons.widget_option.show_delete.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_crud_buttons.widget_option.show_delete.false.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrage dynamique (pour les templates uniquement, filtre sur l'identifiant de l'objet de la page)" },
            'listobject_widget.filter_on_cmv_vo.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'listobject_widget.filter_on_cmv_vo.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'listobject_widget.filter_on_cmv_vo.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Filtrage dynamique (pour les templates uniquement, filtre sur une foreign key de l'objet courant)" },
            'listobject_widget.filter_on_distant_vo.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'listobject_widget.filter_on_distant_vo.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'listobject_widget.filter_on_distant_vo.hidden.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Choisir le type d'objet manuellement" },
            'cms_crud_buttons.widget_option.show_manual_vo_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_crud_buttons.widget_option.show_manual_vo_type.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_crud_buttons.widget_option.show_manual_vo_type.false.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type d'objet" },
            'cms_crud_buttons.widget_option.vo_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher les boutons d'ajout et de modification" },
            'cms_crud_buttons.widget_option.show_add_edit_fk.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Oui" },
            'cms_crud_buttons.widget_option.show_add_edit_fk.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Non" },
            'cms_crud_buttons.widget_option.show_add_edit_fk.false.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Boutons de CRUD" },
            'dashboards.widgets.icons_tooltips.crudbuttons.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Afficher un paramètre" },
            'dashboards.widgets.icons_tooltips.cmsprintparam.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type de contenu" },
            'cms_config.api_type_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Dashboard pour template" },
            'cms_config.dbb_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Affectation d'un template pour un type de contenu" },
            'cms_config.template_for_api_type_id.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "STRING" },
            'cms_print_param.string.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "BOOLÉEN" },
            'cms_print_param.boolean.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "ENTIER" },
            'cms_print_param.int.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "DECIMAL" },
            'cms_print_param.float.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "DATE" },
            'cms_print_param.date.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "VRAI" },
            'print_param.boolean.true.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "FAUX" },
            'print_param.boolean.false.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Type de paramètre" },
            'cms_print_param.widget_option.type_param.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Paramètre" },
            'cms_print_param.widget_option.param.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titre" },
            'cms_print_param.widget_option.title.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Rôles" },
            'multiselect.roles.placeholder.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Limiter l'accès au CRUD aux rôles suivants" },
            'cms_crud_buttons.widget_option.role_access.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ne renseigner aucun rôle laisse l'accès à tout le monde." },
            'cms_crud_buttons.widget_option.role_access.tooltip.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Bouton de booléen" },
            'dashboards.widgets.icons_tooltips.cmsbooleanbutton.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ booléen" },
            'cms_boolean_button.widget_option.vo_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titre pour valeur 'Vraie'" },
            'cms_boolean_button.widget_option.titre_ok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Titre pour valeur 'Faux'" },
            'cms_boolean_button.widget_option.titre_nok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Icône pour valeur 'Vraie'" },
            'cms_boolean_button.widget_option.icone_ok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Icône pour valeur 'Faux'" },
            'cms_boolean_button.widget_option.icone_nok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du bouton" },
            'cms_boolean_button.widget_option.color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Couleur du texte" },
            'cms_boolean_button.widget_option.text_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Code FontAwesome" },
            'cms_boolean_button.widget_option.icone.tooltip.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Champ User" },
            'cms_boolean_button.widget_option.user_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une classe (CSS)" },
            'cms_link_button.widget_option.button_class.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une classe au titre (CSS)" },
            'cms_bloc_text.widget_option.titre_class.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une classe au sous-titre (CSS)" },
            'cms_bloc_text.widget_option.sous_titre_class.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une classe au sur-titre (CSS)" },
            'cms_bloc_text.widget_option.sur_titre_class.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Ajouter une classe au contenu (CSS)" },
            'cms_bloc_text.widget_option.contenu_class.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Zoomer la carte au click" },
            'list_object_widget_options_component.zoom_on_click.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Texte de bas de carte" },
            'list_object_widget_options_component.widget_card_footer_label.card_footer_label.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Disponible qu'en mode : Carte, horizontal, ne pas afficher une seule carte et les éléments ne sont pas des boutons" },
            'list_object.widget_option.zoom_on_click.tooltip.___LABEL___'
        ));

        const preCTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this, this.onCDashboardPageWidgetVO);
        preCTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.onCDashboardVO);

        const postUTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUTrigger.registerHandler(DashboardGraphVORefVO.API_TYPE_ID, this, this.onUDashboardGraphVORefVO);

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(DashboardViewportVO.API_TYPE_ID, this, this.postCreateDashboardViewport);
        postCreateTrigger.registerHandler(DashboardPageVO.API_TYPE_ID, this, this.postCreateDashboardPage);
        postCreateTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.postCreateDashboard);
        // postCreateTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this, this.postCreateDashboardPageWidget);

        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpdateTrigger.registerHandler(DashboardViewportVO.API_TYPE_ID, this, this.postUpdateDashboardViewport);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(
            ModuleDashboardBuilder.APINAME_START_EXPORT_FAVORITES_FILTERS_DATATABLE,
            this.start_export_favorites_filters_datatable.bind(this)
        );

        APIControllerWrapper.registerServerApiHandler(
            ModuleDashboardBuilder.APINAME_LIST_OBJECT_WIDGET_TOGGLE_LIKE,
            this.list_object_widget_toggle_like.bind(this)
        );

        APIControllerWrapper.registerServerApiHandler(
            ModuleDashboardBuilder.APINAME_FETCH_LIKES_FOR_ITEMS,
            this.fetch_likes_for_items.bind(this)
        );
    }

    public async fetch_likes_for_items(api_type_id: string, vo_ids: number[]): Promise<ListObjectLikesVO[]> {
        const res: ListObjectLikesVO[] = await query(ListObjectLikesVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ListObjectLikesVO>().api_type_id, api_type_id)
            .filter_by_num_has(field_names<ListObjectLikesVO>().vo_id, vo_ids)
            .select_vos();

        return res;
    }

    public async list_object_widget_toggle_like(given_list_object_likes: ListObjectLikesVO): Promise<ListObjectLikesVO> {
        // On regarde si l'objet existe déjà
        let exist_list_object_likes: ListObjectLikesVO =
            await query(ListObjectLikesVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<ListObjectLikesVO>().api_type_id, given_list_object_likes.api_type_id)
                .filter_by_num_eq(field_names<ListObjectLikesVO>().vo_id, given_list_object_likes.vo_id)
                .select_vo();

        if (!exist_list_object_likes) {
            exist_list_object_likes = new ListObjectLikesVO();
            exist_list_object_likes.api_type_id = given_list_object_likes.api_type_id;
            exist_list_object_likes.vo_id = given_list_object_likes.vo_id;
        }

        // On regarde si l'utilisateur a déjà liké l'objet
        const user_id: number = given_list_object_likes.list_user_likes[0];

        // On vérifie si la liste des utilisateurs est vide
        if (!exist_list_object_likes.list_user_likes) {
            exist_list_object_likes.list_user_likes = [];
        }

        const index: number = exist_list_object_likes.list_user_likes.indexOf(user_id);
        if (index === -1) {
            // L'utilisateur n'a pas liké l'objet, on l'ajoute
            exist_list_object_likes.list_user_likes.push(user_id);
        } else {
            // L'utilisateur a déjà liké l'objet, on le retire
            exist_list_object_likes.list_user_likes.splice(index, 1);
        }

        // On sauvegarde l'objet
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exist_list_object_likes);

        return exist_list_object_likes;
    }

    /**
     * Start Export Datatable Using Favorites Filters
     *
     * @return {Promise<void>}
     */
    public async start_export_favorites_filters_datatable(): Promise<void> {
        FavoritesFiltersVOService.getInstance().export_all_favorites_filters_datatable();
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDashboardBuilder.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboards'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDashboardBuilder.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Dashboards'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleDashboardBuilder.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Consultation des Dashboards'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = fo_access.id;
        front_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        front_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let bo_CMS_VERSION_access: AccessPolicyVO = new AccessPolicyVO();
        bo_CMS_VERSION_access.group_id = group.id;
        bo_CMS_VERSION_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_CMS_VERSION_access.translatable_name = ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS;
        bo_CMS_VERSION_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_CMS_VERSION_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Dashboards type CMS'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_CMS_VERSION_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_CMS_VERSION_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_CMS_VERSION_access_dependency.src_pol_id = bo_CMS_VERSION_access.id;
        admin_CMS_VERSION_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_CMS_VERSION_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_CMS_VERSION_access_dependency);

        let fo_CMS_VERSION_access: AccessPolicyVO = new AccessPolicyVO();
        fo_CMS_VERSION_access.group_id = group.id;
        fo_CMS_VERSION_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_CMS_VERSION_access.translatable_name = ModuleDashboardBuilder.POLICY_CMS_VERSION_FO_ACCESS;
        fo_CMS_VERSION_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_CMS_VERSION_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Consultation des Dashboards type CMS'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_CMS_VERSION_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_CMS_VERSION_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_CMS_VERSION_access_dependency.src_pol_id = fo_CMS_VERSION_access.id;
        front_CMS_VERSION_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        front_CMS_VERSION_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_CMS_VERSION_access_dependency);

        let dbb_filters_visible_on_cms: AccessPolicyVO = new AccessPolicyVO();
        dbb_filters_visible_on_cms.group_id = group.id;
        dbb_filters_visible_on_cms.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        dbb_filters_visible_on_cms.translatable_name = ModuleDashboardBuilder.POLICY_DBB_FILTERS_VISIBLE_ON_CMS;
        dbb_filters_visible_on_cms = await ModuleAccessPolicyServer.getInstance().registerPolicy(dbb_filters_visible_on_cms, DefaultTranslationVO.create_new({
            'fr-fr': 'Filtres des DBB visibles sur le CMS Builder'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let dbb_filters_visible_on_cms_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dbb_filters_visible_on_cms_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dbb_filters_visible_on_cms_access_dependency.src_pol_id = dbb_filters_visible_on_cms.id;
        dbb_filters_visible_on_cms_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        dbb_filters_visible_on_cms_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dbb_filters_visible_on_cms_access_dependency);
    }

    private async onCDashboardVO(e: DashboardVO): Promise<boolean> {
        if (!e) {
            return false;
        }

        await ModuleDashboardBuilderServer.getInstance().check_DashboardVO_weight(e);

        return true;
    }

    private async check_DashboardVO_weight(e: DashboardVO) {
        if (e.weight) {
            return;
        }

        const query_res = await ModuleDAOServer.instance.query('SELECT max(weight) as max_weight from ' + ModuleTableController.module_tables_by_vo_type[DashboardVO.API_TYPE_ID].full_name);
        let max_weight = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_weight'] != 'undefined') && (query_res[0]['max_weight'] !== null)) ? query_res[0]['max_weight'] : null;
        max_weight = max_weight ? parseInt(max_weight.toString()) : null;
        if (!max_weight) {
            max_weight = 1;
        }
        e.weight = max_weight;

        return;
    }

    private async onCDashboardPageWidgetVO(e: DashboardPageWidgetVO): Promise<boolean> {
        if (!e) {
            return false;
        }

        await ModuleDashboardBuilderServer.getInstance().check_DashboardPageWidgetVO_i(e);
        await ModuleDashboardBuilderServer.getInstance().check_DashboardPageWidgetVO_weight(e);

        return true;
    }

    private async check_DashboardPageWidgetVO_weight(e: DashboardPageWidgetVO) {
        if (e.weight) {
            return;
        }

        const query_res = await ModuleDAOServer.instance.query('SELECT max(weight) as max_weight from ' + ModuleTableController.module_tables_by_vo_type[DashboardPageWidgetVO.API_TYPE_ID].full_name);
        let max_weight = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_weight'] != 'undefined') && (query_res[0]['max_weight'] !== null)) ? query_res[0]['max_weight'] : null;
        max_weight = max_weight ? parseInt(max_weight.toString()) : null;
        if (!max_weight) {
            max_weight = 1;
        }
        e.weight = max_weight + 1;

        return;
    }

    private async check_DashboardPageWidgetVO_i(e: DashboardPageWidgetVO) {
        if (e.i) {
            return;
        }

        const query_res = await ModuleDAOServer.instance.query('SELECT max(i) as max_i from ' + ModuleTableController.module_tables_by_vo_type[DashboardPageWidgetVO.API_TYPE_ID].full_name);
        let max_i = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_i'] != 'undefined') && (query_res[0]['max_i'] !== null)) ? query_res[0]['max_i'] : null;
        max_i = max_i ? parseInt(max_i.toString()) : null;
        if (!max_i) {
            max_i = 1;
        }
        e.i = max_i + 1;

        return;
    }

    private async onUDashboardGraphVORefVO(wrapper: DAOUpdateVOHolder<DashboardGraphVORefVO>) {

        // // Si la modif est justement un changement de cycles, on ne fait rien
        // if (DashboardCycleChecker.needs_update(wrapper.pre_update_vo, wrapper.post_update_vo.cycle_tables, wrapper.post_update_vo.cycle_fields, wrapper.post_update_vo.cycle_links)) {
        //     return;
        // }

        DashboardCycleChecker.detectCyclesForDashboards({ [wrapper.post_update_vo.dashboard_id]: true });
    }

    private async postCreateDashboardPage(page: DashboardPageVO) {
        if (!page) {
            return;
        }

        const viewports: DashboardViewportVO[] = await query(DashboardViewportVO.API_TYPE_ID).select_vos();
        const liens_actifs: DashboardActiveonViewportVO[] = [];

        for (const i in viewports) {
            const viewport = viewports[i];

            const lien_actif: DashboardActiveonViewportVO = new DashboardActiveonViewportVO();
            lien_actif.active = viewport?.is_default;
            lien_actif.dashboard_page_id = page.id;
            lien_actif.dashboard_viewport_id = viewport.id;

            liens_actifs.push(lien_actif);
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(liens_actifs);
    }

    private async postCreateDashboard(dbb: DashboardVO) {
        if (!dbb) {
            return;
        }

        if (!dbb.is_cms_compatible) {
            return;
        }

        // On récupère le 1er dbb pour récupérer tous les graphs
        const dbb_graphs_cms: DashboardGraphVORefVO[] = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_in(
                field_names<DashboardGraphVORefVO>().dashboard_id,
                query(DashboardVO.API_TYPE_ID)
                    .field(field_names<DashboardVO>().id)
                    .filter_is_true(field_names<DashboardVO>().is_cms_compatible)
                    .set_limit(1)
            )
            .select_vos();

        if (!dbb_graphs_cms?.length) {
            return;
        }

        for (const i in dbb_graphs_cms) {
            delete dbb_graphs_cms[i].id;
            dbb_graphs_cms[i].dashboard_id = dbb.id;
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(dbb_graphs_cms);
    }

    private async viewportBecomeDefault(viewport: DashboardViewportVO) {
        const viewports: DashboardViewportVO[] = await query(DashboardViewportVO.API_TYPE_ID).select_vos();
        for (const i in viewports) {
            const vp = viewports[i];
            if (vp.id != viewport.id) {
                vp.is_default = false;
            }
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(viewports);
    }

    private async postUpdateDashboardViewport(update: DAOUpdateVOHolder<DashboardViewportVO>) {
        if (!update || !update.pre_update_vo || !update.post_update_vo) {
            return;
        }

        // S'il devient le viewport par défaut, on désactive les autres
        if (update.post_update_vo.is_default) {
            this.viewportBecomeDefault(update.post_update_vo);
        }
    }

    private async postCreateDashboardViewport(viewport: DashboardViewportVO) {
        if (!viewport) {
            return;
        }

        const default_viewport = viewport.is_default
            ? viewport
            : await query(DashboardViewportVO.API_TYPE_ID).filter_is_true(field_names<DashboardViewportVO>().is_default).select_vo();

        // Si le nouveau devient le défaut, on désactive les autres
        if (viewport.is_default) {
            this.viewportBecomeDefault(viewport);
        }

        // Liaison des dashboards au viewport
        const dbb_pages: DashboardPageVO[] = await query(DashboardPageVO.API_TYPE_ID).select_vos();
        const liaisons_dbbs_viewports: DashboardActiveonViewportVO[] = [];

        for (const i in dbb_pages) {
            const dbb = dbb_pages[i];

            const liaison: DashboardActiveonViewportVO = new DashboardActiveonViewportVO();
            liaison.dashboard_page_id = dbb.id;
            liaison.dashboard_viewport_id = viewport.id;

            // À la création, on n'active le dashboard que sur le viewport par défaut
            if (viewport.is_default) {
                liaison.active = true;
            } else {
                liaison.active = false;
            }

            liaisons_dbbs_viewports.push(liaison);
        }

        // Liaison des widgets aux viewports
        const default_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_viewport_id, default_viewport.id)
            .select_vos();

        const new_widgets_viewport: DashboardPageWidgetVO[] = [];
        for (const i in default_widgets) {
            const widget = default_widgets[i];

            const widget_position: DashboardPageWidgetVO = new DashboardPageWidgetVO();
            widget_position.x = widget?.x;
            widget_position.y = widget?.y;
            widget_position.w = widget?.w;
            widget_position.h = widget?.h;
            widget_position.i = widget?.i;
            widget_position.static = widget?.static;
            widget_position.show_widget_on_viewport = true;
            widget_position.dashboard_viewport_id = viewport.id;
            widget_position.widget_id = widget.widget_id;

            new_widgets_viewport.push(widget_position);
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(liaisons_dbbs_viewports);
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(new_widgets_viewport);
    }
}
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import DashboardBuilderCronWorkersHandler from './DashboardBuilderCronWorkersHandler';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ExportContextQueryToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import FavoritesFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleDataExportServer from '../DataExport/ModuleDataExportServer';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardBuilderVOFactory from '../../../shared/modules/DashboardBuilder/factory/DashboardBuilderVOFactory';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ContextFilterVOManager from '../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import IExportParamsProps from '../../../shared/modules/DashboardBuilder/interfaces/IExportParamsProps';
import FieldFilterManager from '../../../shared/modules/DashboardBuilder/manager/FieldFilterManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import FavoritesFiltersVOService from './service/FavoritesFiltersVOService';

export default class ModuleDashboardBuilderServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDashboardBuilderServer.instance) {
            ModuleDashboardBuilderServer.instance = new ModuleDashboardBuilderServer();
        }
        return ModuleDashboardBuilderServer.instance;
    }

    private static instance: ModuleDashboardBuilderServer = null;

    private constructor() {
        super(ModuleDashboardBuilder.getInstance().name);
    }

    public registerCrons(): void {
        DashboardBuilderCronWorkersHandler.getInstance();
    }

    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Graphique de var - Donut, Jauge ou Camembert'
        }, 'dashboards.widgets.icons_tooltips.varpiechart.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquer pour éditer'
        }, 'table_widget_kanban_component.edit_card.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquer pour éditer'
        }, 'table_widget_kanban_component.edit_column.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter...'
        }, 'table_widget_kanban_component.create_new_kanban_column.placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Des données ont été modifiées par ailleurs, rechargement automatique...'
        }, 'update_kanban_data_rows.needs_refresh.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement...'
        }, 'update_kanban_data_rows.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'enregistrement'
        }, 'update_kanban_data_rows.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifications enregistrées'
        }, 'update_kanban_data_rows.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajout de la colonne...'
        }, 'create_new_kanban_column.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'ajout de la colonne'
        }, 'create_new_kanban_column.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Colonne ajoutée'
        }, 'create_new_kanban_column.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Des données ont été modifiées par ailleurs, rechargement automatique...'
        }, 'on_move_columns_kanban_element.needs_refresh.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement...'
        }, 'on_move_columns_kanban_element.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'enregistrement'
        }, 'on_move_columns_kanban_element.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifications enregistrées'
        }, 'on_move_columns_kanban_element.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ordonner les colonnes du Kanban si possible'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.true.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.use_kanban_column_weight_if_exists.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Affichage Kanban par défaut si il est configuré'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.use_kanban_by_default_if_exists.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Colonne Kanban'
        }, 'table_widget_options_component.kanban_column.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.kanban_column.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.kanban_column.false.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Kanban - Utiliser le champs weight'
        }, 'table_widget_options_component.kanban_use_weight.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.kanban_use_weight.true.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.kanban_use_weight.false.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exportable'
        }, 'table_widget_column_conf.editable_column.exportable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non exportable'
        }, 'table_widget_column_conf.editable_column.not_exportable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher'
        }, 'table_widget_column_conf.editable_column.show_in_table.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cacher'
        }, 'table_widget_column_conf.editable_column.hide_from_table.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification en cours...'
        }, 'move_page.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification terminée'
        }, 'move_page.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de la modification. Rechargez la page et réessayez'
        }, 'move_page.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer par cette ligne'
        }, 'table_widget_component.filter_by.id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer par cette valeur de la colonne'
        }, 'table_widget_component.filter_by.column_value.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Retirer le filtre'
        }, 'table_widget_component.filter_by.unfilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Total'
        }, 'table_widget_component.table_total_footer.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrable'
        }, 'table_widget_column_conf.editable_column.can_filter_by.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non filtrable'
        }, 'table_widget_column_conf.editable_column.cannot_filter_by.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Figer'
        }, 'table_widget_column_conf.editable_column.is_sticky.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ne pas figer'
        }, 'table_widget_column_conf.editable_column.is_not_sticky.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Conditionner au droit'
        }, 'table_widget_column.filter_by_access.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exporter la page ou tout ?'
        }, 'table_widget.choose_export_type.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export'
        }, 'table_widget.choose_export_type.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Page'
        }, 'table_widget.choose_export_type.page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout'
        }, 'table_widget.choose_export_type.all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Choisir une option d\'export par défaut'
        }, 'table_widget_options_component.default_export_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Attribuer une option d\'export par défaut'
        }, 'table_widget_options_component.has_default_export_option.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer la suppression'
        }, 'inline_clear_value.confirm.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'inline_clear_value.confirm.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Activer le menu sur : {app_name}'
        }, 'dashboard_menu_conf.menu_switch.label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '3 - Menus'
        }, 'dashboard_builder.menu_conf.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Impossible de créer un nouveau Dashboard...'
        }, 'DashboardBuilderComponent.create_new_dashboard.ko.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur de chargement du Dashboard Builder'
        }, 'dashboard_builder.loading_failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer une date par année(s)'
        }, 'dashboards.widgets.icons_tooltips.yearfilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer une date par mois'
        }, 'dashboards.widgets.icons_tooltips.monthfilter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Min/Max relatifs à l\'année actuelle'
        }, 'year_filter_widget_component.year_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.year_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.year_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-selection automatique'
        }, 'year_filter_widget_component.auto_select_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.auto_select_year.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.auto_select_year.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative à une date'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'year_filter_widget_component.auto_select_year_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative à'
        }, 'year_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Un autre filtre'
        }, 'year_filter_widget_component.is_relative_to_other_filter.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aujourd\'hui'
        }, 'year_filter_widget_component.is_relative_to_other_filter.now.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative à ce filtre'
        }, 'year_filter_widget_component.relative_to_other_filter_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le filtre" },
            'year_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection min'
        }, 'year_filter_widget_component.auto_select_year_min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection max'
        }, 'year_filter_widget_component.auto_select_year_max.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'month_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données'
        }, 'month_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeurs'
        }, 'month_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champs'
        }, 'month_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'month_filter_widget_component.custom_filter_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Min/Max relatifs au mois actuel'
        }, 'month_filter_widget_component.month_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.month_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.month_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois minimum (Janvier=1,...)'
        }, 'month_filter_widget_component.min_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois maximum (...,Décembre=12)'
        }, 'month_filter_widget_component.max_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-selection automatique'
        }, 'month_filter_widget_component.auto_select_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.auto_select_month.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.auto_select_month.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'month_filter_widget_component.auto_select_month_relative_mode.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection min'
        }, 'month_filter_widget_component.auto_select_month_min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection max'
        }, 'month_filter_widget_component.auto_select_month_max.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Paramètres invalides (max 12 mois)'
        }, 'month_filter_widget_component.no_month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative à'
        }, 'month_filter_widget_component.is_relative_to_other_filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Un autre filtre'
        }, 'month_filter_widget_component.is_relative_to_other_filter.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aujourd\'hui'
        }, 'month_filter_widget_component.is_relative_to_other_filter.now.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pré-sélection relative à ce filtre'
        }, 'month_filter_widget_component.relative_to_other_filter_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le filtre" },
            'month_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher Option Selectionner Tout" },
            'month_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Selectionner Tout" },
            'month_filter_widget_component.select_all.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copie du tableau de bord en cours...'
        }, 'copy_dashboard.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copie du tableau de bord terminée'
        }, 'copy_dashboard.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copie du tableau de bord échouée'
        }, 'copy_dashboard.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Collage du tableau de bord en cours...'
        }, 'paste_dashboard.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Collage du tableau de bord terminé'
        }, 'paste_dashboard.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Collage du tableau de bord échoué'
        }, 'paste_dashboard.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copier ce tableau de bord dans le presse-papier'
        }, 'dashboard_builder.copy_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Remplacer ce tableau de bord en important depuis le presse-papier'
        }, 'dashboard_builder.replace_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer ce tableau de bord'
        }, 'dashboard_builder.delete_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nouveau tableau de bord vide'
        }, 'dashboard_builder.create_dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importer un nouveau tableau de bord depuis le presse-papier'
        }, 'dashboard_builder.create_dashboard_from.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Checklist'
        }, 'checklist_widget_options_component.checklist_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner une checklist'
        }, 'checklist_widget_options_component.checklist_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton "Ajouter"'
        }, 'checklist_widget_options_component.create_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.create_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.create_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton "Tout supprimer"'
        }, 'checklist_widget_options_component.delete_all_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.delete_all_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.delete_all_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton "Exporter"'
        }, 'checklist_widget_options_component.export_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.export_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.export_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton "Rafraîchir"'
        }, 'checklist_widget_options_component.refresh_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'checklist_widget_options_component.refresh_button.hidden.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'checklist_widget_options_component.refresh_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher les éléments d\'une checklist'
        }, 'dashboards.widgets.icons_tooltips.checklist.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lancer la modification ?'
        }, 'BulkOpsWidgetComponent.bulkops.confirmation.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer'
        }, 'BulkOpsWidgetComponent.bulkops.confirmation.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifications terminées'
        }, 'BulkOpsWidgetComponent.bulkops.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Début modification en masse'
        }, 'BulkOpsWidgetComponent.bulkops.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifications échouées'
        }, 'BulkOpsWidgetComponent.bulkops.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifier les données en masse'
        }, 'bulkops.actions.confirm_bulkops.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champs'
        }, 'bulkops_widget_component.field_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Choisir un champs'
        }, 'bulkops_widget_component.field_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Opération'
        }, 'bulkops_widget_component.operator.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeur'
        }, 'bulkops_widget_component.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Type de données'
        }, 'bulkops_widget_options_component.api_type_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Choisir un type de données'
        }, 'bulkops_widget_options_component.api_type_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Réaliser des modifications en masse'
        }, 'dashboards.widgets.icons_tooltips.bulkops.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Paramètres invalides (max 15 années)'
        }, 'year_filter_widget_component.no_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'year_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données'
        }, 'year_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeurs'
        }, 'year_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champs'
        }, 'year_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'year_filter_widget_component.custom_filter_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année minimale'
        }, 'year_filter_widget_component.min_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année maximale'
        }, 'year_filter_widget_component.max_year.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher Option Selectionner Tout" },
            'year_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Selectionner Tout" },
            'year_filter_widget_component.select_all.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner un Dashboard...'
        }, 'dashboard_builder.select_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Onglet caché. Cliquer pour le rendre visible sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_show_navigation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Onglet visible. Cliquer pour le cacher sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_hide_navigation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le premier onglet est obligatoirement visible.'
        }, 'dashboard_builder.pages.tooltip_cannot_hide_navigation.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquer pour sélectionner et afficher cette page du Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_select_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquer pour revenir à la page précédente.'
        }, 'dashboard_builder.pages.tooltip_select_previous_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cette page est actuellement sélectionnée et affichée.'
        }, 'dashboard_builder.pages.tooltip_selected_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer cette page du Tableaud de bord. Attention tous les widgets inclus dans la page seront également supprimés.'
        }, 'dashboard_builder.pages.tooltip_delete_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter une page au Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_create_dashboard_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Table de données. Permet de lister, modifier et supprimer des données de l\'application.'
        }, 'dashboards.widgets.icons_tooltips.datatable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Table de valeurs. Pour aggréger les données (et variables) suivant les filtres sélectionnés et les colonnes affichées.'
        }, 'dashboards.widgets.icons_tooltips.valuetable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre sur la valeur d\'un champs. Sélectionner un champs et les paramètres de filtrage. Le filtre est appliqué à toutes les pages du Tableau de bord.'
        }, 'dashboards.widgets.icons_tooltips.fieldvaluefilter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'KPI. Sélectionner une variable et un format d\'affichage.'
        }, 'dashboards.widgets.icons_tooltips.var.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lien vers une autre page. Permet de naviguer vers une autre page du Tableau de bord, même si celle-ci est cachée par ailleurs du menu.'
        }, 'dashboards.widgets.icons_tooltips.pageswitch.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Au clic, ouvrir cette page'
        }, 'page_switch_widget_options_component.page_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Texte du lien'
        }, 'page_switch_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Avancé'
        }, 'vo_field_ref_advanced.advanced_filters.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Simple'
        }, 'vo_field_ref_advanced.advanced_filters.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Impossible de supprimer la page principale'
        }, 'DashboardBuilderComponent.delete_page.cannot_delete_master_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer la page ?'
        }, 'DashboardBuilderComponent.delete_page.confirmation.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression'
        }, 'DashboardBuilderComponent.delete_page.confirmation.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Page en cours de suppression...'
        }, 'DashboardBuilderComponent.delete_page.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Page supprimée'
        }, 'DashboardBuilderComponent.delete_page.ok.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Composants'
        }, 'dashboard_builder_widgets.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionnez un composant dans la page pour le configurer'
        }, 'dashboard_builder_widgets.first_select_a_widget.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'ajout du composant'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ko.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajout du composant en cours...'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Composant ajouté'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dashboard Builder'
        }, 'dashboard_builder.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilderAdminVueModule.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Impossible de supprimer le dernier Dashboard'
        }, 'DashboardBuilderComponent.delete_dashboard.cannot_delete_master_dashboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer le Dashboard ?'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours...'
        }, 'DashboardBuilderComponent.delete_dashboard.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supression terminée.'
        }, 'DashboardBuilderComponent.delete_dashboard.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champs'
        }, 'field_value_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélection multiple ?'
        }, 'field_value_filter_widget_component.can_select_multiple.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Texte champs de sélection'
        }, 'field_value_filter_widget_component.placeholder_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nombre max. valeurs visibles'
        }, 'field_value_filter_widget_component.max_visible_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer'
        }, 'droppable_vo_fields.filter_by_field_id_or_api_type_id.placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champs'
        }, 'droppable_vo_fields.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter une colonne (champs ou variable)'
        }, 'table_widget_column.new_column_select_type_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter une entête'
        }, 'table_widget_column.new_header_column_select_type_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Glisser/déposer un champs'
        }, 'single_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner une Variable'
        }, 'table_widget_column.new_column_select_type_var_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur du fond'
        }, 'var_widget_options_component.bg_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de la valeur'
        }, 'var_widget_options_component.fg_color_value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur du texte'
        }, 'var_widget_options_component.fg_color_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filter'
        }, 'FieldValueFilterWidget.filter_placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer le composant ?'
        }, 'DashboardBuilderBoardComponent.delete_widget.body.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression'
        }, 'DashboardBuilderBoardComponent.delete_widget.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours...'
        }, 'DashboardBuilderBoardComponent.delete_widget.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression terminée'
        }, 'DashboardBuilderBoardComponent.delete_widget.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variable'
        }, 'var_widget_component.var_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre'
        }, 'var_widget_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filter'
        }, 'droppable_vos.set_filter_by_api_type_id.placeholder.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tables'
        }, 'droppable_vos.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '1 - Tables'
        }, 'dashboard_builder.select_vos.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '2 - Widgets'
        }, 'dashboard_builder.build_page.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Editer'
        }, 'tables_graph_edit_form.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Gérer les liaisons'
        }, 'tables_graph_edit_form.bonds.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'tables_graph_edit_form.delete.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner un élément'
        }, 'tables_graph_edit_form.no_object_selected.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer la suppression ?'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours...'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression terminée'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variable'
        }, 'var_widget_options_component.var_name.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre'
        }, 'var_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Monnaie'
        }, 'amount_filter_options.currency.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Décimales'
        }, 'amount_filter_options.fractionalDigits.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Humaniser'
        }, 'amount_filter_options.humanize.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pas de valeur négative'
        }, 'amount_filter_options.onlyPositive.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Montant'
        }, 'filters.names.__amount__.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pourcentage'
        }, 'filters.names.__percent__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Décimales'
        }, 'filters.names.__toFixed__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Décimales - Arrondi supérieur'
        }, 'filters.names.__toFixedCeil__.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Décimales - Arrondi inférieur'
        }, 'filters.names.__toFixedFloor__.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'dow_filter_widget_component.is_vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données'
        }, 'dow_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeurs'
        }, 'dow_filter_widget_component.is_vo_field_ref.value.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Référence de champs (donnée filtrée)'
        }, 'dow_filter_widget_component.vo_field_ref.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer une date par le jour de la semaine'
        }, 'dashboards.widgets.icons_tooltips.dowfilter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton de validation des fitlres'
        }, 'dashboards.widgets.icons_tooltips.validationfilters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton de remise à zéro des filtres'
        }, 'dashboards.widgets.icons_tooltips.resetfilters.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nom du filtre personnalisé'
        }, 'dow_filter_widget_component.custom_filter_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre'
        }, 'var_widget_options_component.widget_filter_options.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Type de filtre'
        }, 'widget_filter_options.filter_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '<b>ID: </b>{id}'
        }, 'table_widget_component.id.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options du widget'
        }, 'var_pie_chart_widget_options_component.separator.widget_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre du widget'
        }, 'var_pie_chart_widget_options_component.widget_title.title_name_code_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur du fond'
        }, 'var_pie_chart_widget_options_component.bg_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_title_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher le titre'
        }, 'var_pie_chart_widget_options_component.title_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur du titre'
        }, 'var_pie_chart_widget_options_component.title_font_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Taille du titre'
        }, 'var_pie_chart_widget_options_component.title_font_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Padding du titre'
        }, 'var_pie_chart_widget_options_component.title_padding.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options de la légende'
        }, 'var_pie_chart_widget_options_component.separator.chart_legend_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher la légende'
        }, 'var_pie_chart_widget_options_component.legend_display.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Position de la légende'
        }, 'var_pie_chart_widget_options_component.legend_position.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de la légende'
        }, 'var_pie_chart_widget_options_component.legend_font_color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Taille du texte de la légende'
        }, 'var_pie_chart_widget_options_component.legend_font_size.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Largeur des blocs de la légende'
        }, 'var_pie_chart_widget_options_component.legend_box_width.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Padding de la légende'
        }, 'var_pie_chart_widget_options_component.legend_padding.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utiliser le style des points pour la légende à la place des blocs'
        }, 'var_pie_chart_widget_options_component.legend_use_point_style.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options de rendu du graphique'
        }, 'var_pie_chart_widget_options_component.separator.chart_render_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '% de découpe'
        }, 'var_pie_chart_widget_options_component.cutout_percentage.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Indique la zone qui sera découpée dans le graphique en partant du centre vers les extrémités. 0 pour ne pas découper, 100 pour découper tout le graphique. Exemple : 50 pour un donut'
        }, 'var_pie_chart_widget_options_component.cutout_percentage.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Rotation'
        }, 'var_pie_chart_widget_options_component.rotation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Point de départ du graphique en degrés. Entre 0 et 2*PI. Exemple pour une jauge : PI'
        }, 'var_pie_chart_widget_options_component.rotation.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Circumference'
        }, 'var_pie_chart_widget_options_component.circumference.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Circumference du graphique. Entre 0 et 2*PI. Exemple pour une jauge : PI'
        }, 'var_pie_chart_widget_options_component.circumference.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options des données'
        }, 'var_pie_chart_widget_options_component.separator.datas_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options des dimensions'
        }, 'var_pie_chart_widget_options_component.separator.datas_dimension_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrer les filtres'
        }, 'dashboard_viewer.save_favorites_filters.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utiliser une dimension de donnée, issue d\'un champ ou d\'un filtre date segmenté'
        }, 'var_pie_chart_widget_options_component.has_dimension.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'La dimension est un champ ?'
        }, 'var_pie_chart_widget_options_component.dimension_is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champ de la dimension'
        }, 'var_pie_chart_widget_options_component.dimension_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Segmentation de la dimension date'
        }, 'var_pie_chart_widget_options_component.dimension_custom_filter_segment_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Max. de valeurs pour la dimension choisie'
        }, 'var_pie_chart_widget_options_component.max_dimension_values.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Permet de définir un nombre max de résultats pris en compte pour le graphique sur la dimension proposée. Par exemple si on a sélectionné une année et qu\'on segmente au jour, on peut limiter aux 10 premiers jours en indiquant 10 ici.'
        }, 'var_pie_chart_widget_options_component.max_dimension_values.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Trier la dimension par un champ'
        }, 'var_pie_chart_widget_options_component.sort_dimension_by_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Trier la dimension par ordre croissant ?'
        }, 'var_pie_chart_widget_options_component.sort_dimension_by_asc.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options de filtrage des valeurs'
        }, 'var_pie_chart_widget_options_component.separator.datas_filter_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre des valeurs'
        }, 'var_pie_chart_widget_options_component.widget_filter_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options de la variable principale'
        }, 'var_pie_chart_widget_options_component.separator.var_1_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nom de la variable principale'
        }, 'var_pie_chart_widget_options_component.var_name_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de fond'
        }, 'var_pie_chart_widget_options_component.bg_color_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de bordure'
        }, 'var_pie_chart_widget_options_component.border_color_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_pie_chart_widget_options_component.border_width_1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Options de la variable secondaire'
        }, 'var_pie_chart_widget_options_component.separator.var_2_options.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nom de la variable secondaire'
        }, 'var_pie_chart_widget_options_component.var_name_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de fond'
        }, 'var_pie_chart_widget_options_component.bg_color_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Couleur de bordure'
        }, 'var_pie_chart_widget_options_component.border_color_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Epaisseur de la bordure'
        }, 'var_pie_chart_widget_options_component.border_width_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utiliser la somme des deux variables comme valeur max ?'
        }, 'var_pie_chart_widget_options_component.max_is_sum_of_var_1_and_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utiliser ce filtre de date personnalisé pour la dimension'
        }, 'var_pie_chart_widget_options_component.dimension_custom_filter_name.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Segmentation'
        }, 'tstz_filter_options.segment_type.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Deux exemples:<ul><li>Si on veut un filtre A-1 (appelée Date_Am1 par exemple) relatif à un autre filtre A (appelé Date_A), on indique -1 en min et max sur le filtre Année et 0 sur les autres filtres relatifs (par exemple si la segmentation est sur le mois, on aura aussi un filtre Mois A-1 (nommé Date_Am1 aussi) relatif à un filtre Mois A (nommé Date_A) avec un champ relatif min et max à 0.</li>' +
                '<li>Si on veut un filtre M-1 (appelée Date_Mm1) relatif à un autre filtre (Date_M), sur le filtre Année Date_Mm1 on indique 0 en min/max relatif au filtre Année Date_M. Mais on indique dans le filtre Mois lié (donc nommé Date_Mm1 aussi) en min et max -1, relativement au filtre mois appelé Date_M. Si on est en janvier, le mois relatif sera alors négatif et l\'année du filtrage sera impactée automatiquement - pas graphiquement mais dans les requêtes.</li></ul>'
        }, 'year_filter_widget_component.auto_select_year.is_relative_to_other_filter.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Deux exemples:<ul><li>Si on veut un filtre A-1 (appelée Date_Am1 par exemple) relatif à un autre filtre A (appelé Date_A), on indique -1 en min et max sur le filtre Année et 0 sur les autres filtres relatifs (par exemple si la segmentation est sur le mois, on aura aussi un filtre Mois A-1 (nommé Date_Am1 aussi) relatif à un filtre Mois A (nommé Date_A) avec un champ relatif min et max à 0.</li>' +
                '<li>Si on veut un filtre M-1 (appelée Date_Mm1) relatif à un autre filtre (Date_M), sur le filtre Année Date_Mm1 on indique 0 en min/max relatif au filtre Année Date_M. Mais on indique dans le filtre Mois lié (donc nommé Date_Mm1 aussi) en min et max -1, relativement au filtre mois appelé Date_M. Si on est en janvier, le mois relatif sera alors négatif et l\'année du filtrage sera impactée automatiquement - pas graphiquement mais dans les requêtes.</li></ul>'
        }, 'month_filter_widget_component.auto_select_month.is_relative_to_other_filter.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année'
        }, 'TstzFilterOptionsComponent.segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois'
        }, 'TstzFilterOptionsComponent.segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Jour'
        }, 'TstzFilterOptionsComponent.segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Semaine'
        }, 'TstzFilterOptionsComponent.segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année glissante'
        }, 'TstzFilterOptionsComponent.segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Heure'
        }, 'TstzFilterOptionsComponent.segment_types.5.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Minute'
        }, 'TstzFilterOptionsComponent.segment_types.6.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Seconde'
        }, 'TstzFilterOptionsComponent.segment_types.7.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.0.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Jour'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Semaine'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.3.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année glissante'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.4.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Heure'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.5.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Minute'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.6.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Seconde'
        }, 'VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.7.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement en cours...'
        }, 'TableWidgetComponent.onchange_column.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement terminé'
        }, 'TableWidgetComponent.onchange_column.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de la mise à jour'
        }, 'TableWidgetComponent.onchange_column.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Largeur du contenu de la colonne, en rem (requis si colonne figée)'
        }, 'table_widget_column_conf.column_width.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifiable'
        }, 'table_widget_column_conf.editable_column.editable.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lecture seule'
        }, 'table_widget_column_conf.editable_column.readonly.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Composants'
        }, 'table_widget_column.new_column_select_type_component.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dashboards'
        }, 'menu.menuelements.admin.dashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'GraphVORefs'
        }, 'menu.menuelements.admin.dashboard_graphvoref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Pages'
        }, 'menu.menuelements.admin.dashboard_page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Widgets / pages'
        }, 'menu.menuelements.admin.dashboard_pwidget.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Widgets'
        }, 'menu.menuelements.admin.dashboard_widget.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Colonnes'
        }, 'table_widget_options_component.columns.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Activer la fonction CRUD'
        }, 'table_widget_options_component.crud_api_type_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Choisir type pour activer'
        }, 'table_widget_options_component.crud_api_type_id_select.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher un lien Vocus'
        }, 'table_widget_options_component.vocus_button.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre'
        }, 'table_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.vocus_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.vocus_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton pour supprimer la ligne ?'
        }, 'table_widget_options_component.delete_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.delete_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.delete_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton pour modifier la ligne ?'
        }, 'table_widget_options_component.update_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.update_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.update_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Limite d\'affichage'
        }, 'table_widget_options_component.limit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton pour ajouter une ligne ?'
        }, 'table_widget_options_component.create_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.create_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.create_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton pour rafraîchir les données ?'
        }, 'table_widget_options_component.refresh_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.refresh_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.refresh_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton pour exporter ?'
        }, 'table_widget_options_component.export_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.export_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.export_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Peut exporter les filtres actifs ?'
        }, 'table_widget_options_component.can_export_active_field_filters.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Peut exporter les variables "indicateur" ?'
        }, 'table_widget_options_component.can_export_vars_indicator.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bouton "Tout supprimer"'
        }, 'table_widget_options_component.delete_all_button.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.delete_all_button.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.delete_all_button.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrage par champs'
        }, 'table_widget_options_component.can_filter_by.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'table_widget_options_component.can_filter_by.visible.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'table_widget_options_component.can_filter_by.hidden.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer ?'
        }, 'TableWidgetComponent.confirm_delete.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'TableWidgetComponent.confirm_delete.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours'
        }, 'TableWidgetComponent.confirm_delete.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression terminée'
        }, 'TableWidgetComponent.confirm_delete.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de la suppression'
        }, 'TableWidgetComponent.confirm_delete.ko.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '<' },
            'adv_number_fltr.inf'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '<=' },
            'adv_number_fltr.infeq'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '>' },
            'adv_number_fltr.sup'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '>=' },
            'adv_number_fltr.supeq'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Est null' },
            'adv_number_fltr.est_null'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'N\'est pas null' },
            'adv_number_fltr.nest_pas_null'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '=' },
            'adv_number_fltr.eq'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '!=' },
            'adv_number_fltr.not_eq'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Contient' },
            'adv_str_fltr.contient'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Ne contient pas' },
            'adv_str_fltr.contient_pas'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Commence par' },
            'adv_str_fltr.commence'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Ne commence pas par' },
            'adv_str_fltr.commence_pas'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Est' },
            'adv_str_fltr.est'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'N\'est pas' },
            'adv_str_fltr.nest_pas'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Est vide' },
            'adv_str_fltr.est_vide'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'N\'est pas vide' },
            'adv_str_fltr.nest_pas_vide'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Est null' },
            'adv_str_fltr.est_null'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'N\'est pas null' },
            'adv_str_fltr.nest_pas_null'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Ajouter un filtre' },
            'advanced_filters.add.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Valider le filtre' },
            'advanced_filters.validate.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Choisir le type de liaison entre ce filtre et le suivant (ET ou OU)' },
            'advanced_filters.link_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Supprimer ce filtre' },
            'advanced_filters.delete.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'ET' },
            'adv_str_fltr.et'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'OU' },
            'adv_str_fltr.ou')
        );

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le 2ème niveau si le niveau 1 n'est pas sélectionné" },
            'field_value_filter_widget_component.hide_lvl2_if_lvl1_not_selected.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le filtre au format case à cocher" },
            'field_value_filter_widget_component.is_checkbox.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nombre de colonnes de cases à cocher" },
            'field_value_filter_widget_component.checkbox_columns.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "1" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.1'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "2" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.2'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "3" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.3'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "4" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.4'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "6" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.6'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "12" },
            'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.12'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le champ de recherche" },
            'field_value_filter_widget_component.show_search_field.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Séparer les données activées et les options" },
            'field_value_filter_widget_component.separation_active_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Champ à afficher au 2ème niveau" },
            'field_value_filter_widget_component.vo_field_ref_lvl2.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Champ pour trier l'affichage du filtre" },
            'field_value_filter_widget_component.vo_field_sort.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Champ pour trier l'affichage du filtre de niveau 2" },
            'field_value_filter_widget_component.vo_field_sort_lvl2.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Granularité" },
            'field_value_filter_widget_component.segmentation_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Pas de tri" },
            'column.sort.no.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Tri ascendant" },
            'column.sort.asc.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Tri descendant" },
            'column.sort.desc.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Mode avancé par défaut" },
            'field_value_filter_widget_component.advanced_mode.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Type de recherche avancé par défaut" },
            'field_value_filter_widget_component.default_advanced_string_filter_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le type de recherche avancé" },
            'field_value_filter_widget_component.hide_advanced_string_filter_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le bouton avancé" },
            'field_value_filter_widget_component.hide_btn_switch_advanced.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Placeholder pour le champs de recherche" },
            'field_value_filter_widget_component.placeholder_advanced_string_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Liste des champs pour la recherche multiple" },
            'field_value_filter_widget_component.vo_field_ref_multiple.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Glisser / Déposer les champs pour la recherche multiple" },
            'multiple_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Liste des valeurs sélectionnables (valeurs séparées par une virgule ',')" },
            'table_widget_options_component.limit_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher sélecteur nombre d'éléments" },
            'table_widget_options_component.show_limit_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_limit_selectable.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_limit_selectable.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le formulaire de pagination" },
            'table_widget_options_component.show_pagination_form.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_form.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_form.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher la pagination sous forme de liste (prev/next)" },
            'table_widget_options_component.show_pagination_list.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nombre de blocs page cliquables" },
            'table_widget_options_component.nbpage_pagination_list.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_list.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_list.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le footer de total" },
            'table_widget_options_component.has_table_total_footer.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.has_table_total_footer.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.has_table_total_footer.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le résumé de pagination" },
            'table_widget_options_component.show_pagination_resumee.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_resumee.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_resumee.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le slider de pagination" },
            'table_widget_options_component.show_pagination_slider.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.show_pagination_slider.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.show_pagination_slider.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Couleur de fond de l'entête" },
            'table_widget_column_conf.editable_column.bg_color_header.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Couleur du texte de l'entête" },
            'table_widget_column_conf.editable_column.font_color_header.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Format" },
            'table_widget_column_conf.filter_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Aggréger les données" },
            'table_widget_column_conf.editable_column.many_to_many_aggregate.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Aggréger les données" },
            'table_widget_column_conf.editable_column.many_to_many_aggregate.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Désactiver les liens ManyToOne" },
            'table_widget_column_conf.editable_column.disabled_many_to_one_link.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Désactiver les liens ManyToOne" },
            'table_widget_column_conf.editable_column.disabled_many_to_one_link.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "La donnée peut être vide si ContextAccessHook présent" },
            'table_widget_column_conf.editable_column.is_nullable.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "La donnée peut être vide si ContextAccessHook présent" },
            'table_widget_column_conf.editable_column.is_nullable.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher la popup" },
            'table_widget_column_conf.editable_column.show_tooltip.show.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher la popup" },
            'table_widget_column_conf.editable_column.show_tooltip.hide.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Période fixe (calendrier)" },
            'adfd_desc.search_type.calendar'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Par rapport à aujourd'hui" },
            'adfd_desc.search_type.last'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher un calendrier" },
            'adfd_desc.search_type.custom'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtre de données ou de valeurs'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.data.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeurs'
        }, 'advanced_date_filter_widget_component.is_vo_field_ref.value.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Case à cocher" },
            'advanced_date_filter_widget_component.is_checkbox.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'advanced_date_filter_widget_component.is_checkbox.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'advanced_date_filter_widget_component.is_checkbox.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Liste des options" },
            'advanced_date_filter_widget_component.opts.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Ajouter une option" },
            'advanced_date_filter_widget_component.opts.add.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Champ de référence" },
            'advanced_date_filter_widget_component.vo_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtrer une date avec options" },
            'dashboards.widgets.icons_tooltips.advanceddatefilter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Choisir des valeurs par défaut (sinon à exclure)" },
            'field_value_filter_widget_component.default_value_or_exclude.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Valeurs par défaut du filtre" },
            'field_value_filter_widget_component.default_filter_opt_values.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Valeurs à exclure du filtre" },
            'field_value_filter_widget_component.exclude_filter_opt_values.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer le filtre" },
            'field_value_filter_widget_component.hide_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Du'
        }, 'ts_range_input.placeholder.date_debut.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'au'
        }, 'ts_range_input.placeholder.date_fin.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Le filtre n'utilise pas le filtrage actif" },
            'field_value_filter_widget_component.no_inter_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Le filtre dépend d'un autre objet" },
            'field_value_filter_widget_component.has_other_ref_api_type_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Objet interdépendant" },
            'field_value_filter_widget_component.other_ref_api_type_id.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Validation automatique du filtre avancé" },
            'field_value_filter_widget_component.autovalidate_advanced_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Validation manuelle avec validation automatique du filtre avancé" },
            'field_value_filter_widget_component.active_field_on_autovalidate_advanced_filter.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Ajouter l'option 'Non renseigné' dans la liste déroulante" },
            'field_value_filter_widget_component.add_is_null_selectable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Couleur du fond" },
            'field_value_filter_widget_component.bg_color.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Couleur de la valeur" },
            'field_value_filter_widget_component.fg_color_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Couleur du texte" },
            'field_value_filter_widget_component.fg_color_text.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non renseigné" },
            'datafilteroption.is_null.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Grouper les filtres" },
            'dashboard_viewer.group_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Problème lors du chargement du Tableau de bord" },
            'dashboard_viewer.loading_failed.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Valider" },
            'dashboard_viewer.block_widgets_updates.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Réinitialiser" },
            'dashboard_viewer.block_widgets_reset.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sauvegarder les filtres favoris" },
            'dashboard_viewer.favorites_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Configurer la sélection de vos filtres favoris" },
            'dashboard_viewer.favorites_filters.modal_title.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Selectionner favoris" },
            'dashboard_viewer.favorites_filters.selection_tab.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Configurer vos exports" },
            'dashboard_viewer.favorites_filters.export_tab.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Selectionner vos filtres favoris" },
            'dashboard_viewer.favorites_filters.select_favorites.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Erreurs de saisie" },
            'dashboard_viewer.favorites_filters.form_errors.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Entrer le nom du favoris *:" },
            'dashboard_viewer.favorites_filters.enter_name.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nom pour les filtres favoris requis" },
            'dashboard_viewer.favorites_filters.name_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Planification des exports" },
            'dashboard_viewer.favorites_filters.export_planification.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Fréquence d'export de données requise" },
            'dashboard_viewer.favorites_filters.export_frequency_every_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Granularité d'export de données requise" },
            'dashboard_viewer.favorites_filters.export_frequency_granularity_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Jour du mois pour l'export de données requis" },
            'dashboard_viewer.favorites_filters.export_frequency_day_in_month_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Données à exporté requis" },
            'dashboard_viewer.favorites_filters.selected_exportable_data_required.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Saisissez les données à exporter" },
            'dashboard_viewer.favorites_filters.exportable_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Comportements des filtres favoris" },
            'dashboard_viewer.favorites_filters.behaviors_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Remplacer les filtres actifs" },
            'dashboard_viewer.favorites_filters.overwrite_active_field_filters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Souhaitez-vous planifier les export ?" },
            'dashboard_viewer.favorites_filters.should_plan_export.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Exporter tous les *:" },
            'dashboard_viewer.favorites_filters.export_frequency_every.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Granularité *:" },
            'dashboard_viewer.favorites_filters.export_frequency_granularity.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Jour dans le mois *:" },
            'dashboard_viewer.favorites_filters.export_frequency_day_in_month.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sélectionnez les tableaux de valeurs à exporter *:" },
            'dashboard_viewer.favorites_filters.select_exportable_data.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sauver favoris" },
            'dashboard_viewer.favorites_filters.save_favorites.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sauvegarde des filtres favoris en cours" },
            'dashboard_viewer.favorites_filters.start.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtres favoris sauvegardés avec succès" },
            'dashboard_viewer.favorites_filters.ok.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Erreur lors de la sauvegarde des filtres" },
            'dashboard_viewer.favorites_filters.failed.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Masquer la pagination du bas" },
            'table_widget_options_component.hide_pagination_bottom.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'table_widget_options_component.hide_pagination_bottom.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'table_widget_options_component.hide_pagination_bottom.visible.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Décimales' },
            'to_fixed_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Arrondi" },
            'to_fixed_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Décimales' },
            'to_fixed_ceil_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Arrondi" },
            'to_fixed_ceil_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_ceil_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_ceil_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Décimales' },
            'percent_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'pts au lieu de %' },
            'percent_filter_options.pts.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Signe explicite' },
            'percent_filter_options.explicit_sign.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Evolution ? (-100%)' },
            'percent_filter_options.evol_from_prct.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '999 == infini' },
            'percent_filter_options.treat_999_as_infinite.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Décimales' },
            'to_fixed_floor_filter_options.fractionalDigits.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Arrondi" },
            'to_fixed_floor_filter_options.arrondi.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': ". à la place de ," },
            'to_fixed_floor_filter_options.dot_decimal_marker.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Pas de valeur négative' },
            'to_fixed_floor_filter_options.onlyPositive.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Désactiver les liens ManyToOne pour ne pas rendre la donnée cliquable dans le tableau" },
            'table_widget_column_conf.disabled_many_to_one_link.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Activer / Désactiver l'export de la donnée" },
            'table_widget_column_conf.exportable_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Conditionne l'affichage de la donnée" },
            'table_widget_column_conf.filter_by_access.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher / Masquer la donnée dans le tableau (dans tous les cas, charge la donnée via la requête)" },
            'table_widget_column_conf.hide_from_table_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': "Dans le cas d'un champ externe à l'api_type_id de la table, on indique s'il est possible qu'il n'y ai pas de VO lié. <br/>" +
                    "Exemple: On affiche la liste des utilisateurs (UserVO) avec le nom du rôle (RoleVO). Si l'utilisateur n'a pas de rôle et qu'il y a un ContextFilterHook sur les rôles, la ligne ne s'affichera pas dans le tableau.<br/>" +
                    "Si on coche cette case, la ligne s'affichera quand même mais le champ rôle sera vide."
            },
            'table_widget_column_conf.is_nullable.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Figer la colonne du tableau pour qu'elle soit toujours visible au niveau du scroll." },
            'table_widget_column_conf.is_sticky_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': "Aggréger les données ManyToMany pour regrouper les données sur une seul ligne.<br/>" +
                    "Exemple: On affiche la liste des utilisateurs (UserVO) avec le nom des rôles (RoleVO). Si un utilisateur a plusieurs rôles, on va afficher sur une seule ligne avec un séparateur."
            },
            'table_widget_column_conf.many_to_many_aggregate.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher une popup sur les champs du tableau" },
            'table_widget_column_conf.show_tooltip.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtres" },
            'table_widget_column.show_if_any_filter_active.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher si 1 filtre actif" },
            'table_widget_column_conf.show_if_any_filter_active.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtres à ne pas utiliser" },
            'table_widget_column.do_not_user_filter_active_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtres à ne pas utiliser dans la création du param de la VAR" },
            'table_widget_column_conf.do_not_user_filter_active_ids.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "La colonne peut-être éditée directement dans le tableau" },
            'table_widget_column_conf.editable_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "La colonne est filtrable en cliquant directement sur la donnée" },
            'table_widget_column_conf.can_filter_by_column.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Supervision" },
            'dashboards.widgets.icons_tooltips.supervision.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Type de supervision (api_type_id)" },
            'dashboards.widgets.icons_tooltips.supervision_type.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le filtre sous forme de bouton" },
            'field_value_filter_widget_component.is_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Types de supervision" },
            'supervision_type_widget_component.supervision_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sélectionner les types de supervision" },
            'supervision_type_widget_component.supervision_api_type_ids_select.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Tout" },
            'supervision_widget_component.all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Dernière MAJ" },
            'supervision_widget_component.table.last_update.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Valeur" },
            'supervision_widget_component.table.last_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sonde" },
            'supervision_widget_component.table.name.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le détail" },
            'supervision_widget_component.table.show_detail.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Rechargement automatique" },
            'supervision_widget_options_component.auto_refresh.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'supervision_widget_options_component.auto_refresh.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'supervision_widget_options_component.auto_refresh.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Recharger toutes les (en secondes)" },
            'supervision_widget_options_component.auto_refresh_seconds.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nombre d'éléments à afficher" },
            'supervision_widget_options_component.limit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le bouton de rechargement manuel" },
            'supervision_widget_options_component.refresh_button.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Non" },
            'supervision_widget_options_component.refresh_button.hidden.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Oui" },
            'supervision_widget_options_component.refresh_button.visible.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Types de supervision" },
            'supervision_widget_options_component.supervision_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sélectionner les types de supervision" },
            'supervision_widget_options_component.supervision_api_type_ids_select.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nom" },
            'supervision_widget_options_component.widget_title.title_name_code_text.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Fermer" },
            'supervision.supervision_item_modal.close.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher le compteur par valeurs" },
            'field_value_filter_widget_component.show_count_value.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher / Masquer la modification du style des options" },
            'field_value_filter_widget_component.show_hide_enum_color_options.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Marquer comme lu" },
            'supervision_widget_component.mark_as_read.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Marquer comme non lu" },
            'supervision_widget_component.mark_as_unread.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Tout sélectionner" },
            'supervision_widget_component.select_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Tout déselectionner" },
            'supervision_widget_component.unselect_all.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Filtrer sur tous les types (pour la Supervision seulement)" },
            'field_value_filter_widget_component.force_filter_by_all_api_type_ids.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher Bulk Edit" },
            'supervision_widget_options_component.show_bulk_edit.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher Option Selectionner Tout" },
            'field_value_filter_widget_component.can_select_all_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Afficher Option Selectionner Aucun" },
            'field_value_filter_widget_component.can_select_none_option.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Utiliser cette table pour la comptage des valeurs dans les filtres (si activé)" },
            'table_widget_options_component.use_for_count.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Sauvegarder les requêtes en favoris" },
            'dashboards.widgets.icons_tooltips.savefavoritesfilters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Voir les requêtes favoris" },
            'dashboards.widgets.icons_tooltips.showfavoritesfilters.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nom du filtre" },
            'show_favorites_filters_widget_component.vo_field_ref.___LABEL___'
        ));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': "Nombre maximum d'éléments à afficher" },
            'show_favorites_filters_widget_component.max_visible_options.___LABEL___'
        ));

        let preCTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this, this.onCDashboardPageWidgetVO);
        preCTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.onCDashboardVO);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(
            ModuleDashboardBuilder.APINAME_START_EXPORT_DATATABLE_USING_FAVORITES_FILTERS,
            this.start_export_datatable_using_favorites_filters.bind(this)
        );
    }

    /**
     * Start Export Datatable Using Favorites Filters
     *
     * @return {Promise<void>}
     */
    public async start_export_datatable_using_favorites_filters(): Promise<void> {
        FavoritesFiltersVOService.getInstance().export_favorites_filters_datatable();
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDashboardBuilder.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Dashboards'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDashboardBuilder.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des Dashboards'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleDashboardBuilder.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            'fr-fr': 'Consultation des Dashboards'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = fo_access.id;
        front_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        front_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(weight) as max_weight from ' + VOsTypesManager.moduleTables_by_voType[DashboardVO.API_TYPE_ID].full_name);
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(weight) as max_weight from ' + VOsTypesManager.moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID].full_name);
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(i) as max_i from ' + VOsTypesManager.moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID].full_name);
        let max_i = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_i'] != 'undefined') && (query_res[0]['max_i'] !== null)) ? query_res[0]['max_i'] : null;
        max_i = max_i ? parseInt(max_i.toString()) : null;
        if (!max_i) {
            max_i = 1;
        }
        e.i = max_i + 1;

        return;
    }
}
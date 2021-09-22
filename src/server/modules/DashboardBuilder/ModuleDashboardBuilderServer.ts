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
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

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

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Activer le menu sur : {app_name}'
        }, 'dashboard_menu_conf.menu_switch.label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '3 - Menus'
        }, 'dashboard_builder.menu_conf.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Impossible de créer un nouveau Dashboard...'
        }, 'DashboardBuilderComponent.create_new_dashboard.ko.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur de chargement du Dashboard Builder'
        }, 'dashboard_builder.loading_failed.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner un Dashboard...'
        }, 'dashboard_builder.select_dashboard.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Onglet caché. Cliquer pour le rendre visible sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_show_navigation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Onglet visible. Cliquer pour le cacher sur le Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_click_to_hide_navigation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le premier onglet est obligatoirement visible.'
        }, 'dashboard_builder.pages.tooltip_cannot_hide_navigation.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cliquer pour sélectionner et afficher cette page du Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_select_page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cliquer pour revenir à la page précédente.'
        }, 'dashboard_builder.pages.tooltip_select_previous_page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cette page est actuellement sélectionnée et affichée.'
        }, 'dashboard_builder.pages.tooltip_selected_page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer cette page du Tableaud de bord. Attention tous les widgets inclus dans la page seront également supprimés.'
        }, 'dashboard_builder.pages.tooltip_delete_page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajouter une page au Tableau de bord.'
        }, 'dashboard_builder.pages.tooltip_create_dashboard_page.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Table de données. Permet de lister, modifier et supprimer des données de l\'application.'
        }, 'dashboards.widgets.icons_tooltips.datatable.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Table de valeurs. Pour aggréger les données (et variables) suivant les filtres sélectionnés et les colonnes affichées.'
        }, 'dashboards.widgets.icons_tooltips.valuetable.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filtre sur la valeur d\'un champs. Sélectionner un champs et les paramètres de filtrage. Le filtre est appliqué à toutes les pages du Tableau de bord.'
        }, 'dashboards.widgets.icons_tooltips.fieldvaluefilter.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'KPI. Sélectionner une variable et un format d\'affichage.'
        }, 'dashboards.widgets.icons_tooltips.var.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lien vers une autre page. Permet de naviguer vers une autre page du Tableau de bord, même si celle-ci est cachée par ailleurs du menu.'
        }, 'dashboards.widgets.icons_tooltips.pageswitch.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Au clic, ouvrir cette page'
        }, 'page_switch_widget_options_component.page_name.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Texte du lien'
        }, 'page_switch_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Avancé'
        }, 'vo_field_ref_advanced.advanced_filters.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Simple'
        }, 'vo_field_ref_advanced.advanced_filters.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Impossible de supprimer la page principale'
        }, 'DashboardBuilderComponent.delete_page.cannot_delete_master_page.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer la page ?'
        }, 'DashboardBuilderComponent.delete_page.confirmation.body.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression'
        }, 'DashboardBuilderComponent.delete_page.confirmation.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Page en cours de suppression...'
        }, 'DashboardBuilderComponent.delete_page.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Page supprimée'
        }, 'DashboardBuilderComponent.delete_page.ok.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Composants'
        }, 'dashboard_builder_widgets.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionnez un composant dans la page pour le configurer'
        }, 'dashboard_builder_widgets.first_select_a_widget.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur lors de l\'ajout du composant'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ko.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Composant ajouté'
        }, 'DashboardBuilderBoardComponent.add_widget_to_page.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dashboard Builder'
        }, 'dashboard_builder.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dashboard Builder'
        }, 'menu.menuelements.admin.DashboardBuilderAdminVueModule.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Impossible de supprimer le dernier Dashboard'
        }, 'DashboardBuilderComponent.delete_dashboard.cannot_delete_master_dashboard.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le Dashboard ?'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.body.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Confirmer'
        }, 'DashboardBuilderComponent.delete_dashboard.confirmation.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression en cours...'
        }, 'DashboardBuilderComponent.delete_dashboard.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supression terminée.'
        }, 'DashboardBuilderComponent.delete_dashboard.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Champs'
        }, 'field_value_filter_widget_component.vo_field_ref.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélection multiple ?'
        }, 'field_value_filter_widget_component.can_select_multiple.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Texte champs de sélection'
        }, 'field_value_filter_widget_component.placeholder_name_code_text.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Nombre max. valeurs visibles'
        }, 'field_value_filter_widget_component.max_visible_options.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filtrer'
        }, 'droppable_vo_fields.filter_by_field_id_or_api_type_id.placeholder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Champs'
        }, 'droppable_vo_fields.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajouter une colonne (champs ou variable)'
        }, 'table_widget_column.new_column_select_type_label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Glisser/déposer un champs'
        }, 'single_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner une Variable'
        }, 'table_widget_column.new_column_select_type_var_ref.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filter'
        }, 'FieldValueFilterWidget.filter_placeholder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le composant ?'
        }, 'DashboardBuilderBoardComponent.delete_widget.body.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression'
        }, 'DashboardBuilderBoardComponent.delete_widget.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression en cours...'
        }, 'DashboardBuilderBoardComponent.delete_widget.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression terminée'
        }, 'DashboardBuilderBoardComponent.delete_widget.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable'
        }, 'var_widget_component.var_name.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Titre'
        }, 'var_widget_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filter'
        }, 'droppable_vos.set_filter_by_api_type_id.placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tables'
        }, 'droppable_vos.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '1 - Tables'
        }, 'dashboard_builder.select_vos.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '2 - Widgets'
        }, 'dashboard_builder.build_page.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Editer'
        }, 'tables_graph_edit_form.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'tables_graph_edit_form.delete.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner un élément'
        }, 'tables_graph_edit_form.no_object_selected.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Confirmer la suppression ?'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression en cours...'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression terminée'
        }, 'TablesGraphEditFormComponent.confirm_delete_cell.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable'
        }, 'var_widget_options_component.var_name.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Titre'
        }, 'var_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Monnaie'
        }, 'amount_filter_options.currency.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Décimales'
        }, 'amount_filter_options.fractionalDigits.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Humaniser'
        }, 'amount_filter_options.humanize.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Pas de valeur négative'
        }, 'amount_filter_options.onlyPositive.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Montant'
        }, 'filters.names.__amount__.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filtre'
        }, 'var_widget_options_component.widget_filter_options.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Type de filtre'
        }, 'widget_filter_options.filter_type.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dashboards'
        }, 'menu.menuelements.admin.dashboard.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'GraphVORefs'
        }, 'menu.menuelements.admin.dashboard_graphvoref.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Pages'
        }, 'menu.menuelements.admin.dashboard_page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Widgets / pages'
        }, 'menu.menuelements.admin.dashboard_pwidget.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Widgets'
        }, 'menu.menuelements.admin.dashboard_widget.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Colonnes'
        }, 'table_widget_options_component.columns.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Activer la fonction CRUD'
        }, 'table_widget_options_component.crud_api_type_id.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Choisir type pour activer'
        }, 'table_widget_options_component.crud_api_type_id_select.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher un lien Vocus'
        }, 'table_widget_options_component.vocus_button.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Titre'
        }, 'table_widget_options_component.widget_title.title_name_code_text.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.vocus_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.vocus_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton pour supprimer la ligne ?'
        }, 'table_widget_options_component.delete_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.delete_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.delete_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton pour modifier la ligne ?'
        }, 'table_widget_options_component.update_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.update_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.update_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton pour ajouter une ligne ?'
        }, 'table_widget_options_component.create_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.create_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.create_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton pour rafraîchir les données ?'
        }, 'table_widget_options_component.refresh_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.refresh_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.refresh_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton pour exporter ?'
        }, 'table_widget_options_component.export_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.export_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.export_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Bouton "Tout supprimer"'
        }, 'table_widget_options_component.delete_all_button.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'table_widget_options_component.delete_all_button.visible.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'table_widget_options_component.delete_all_button.hidden.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Confirmer ?'
        }, 'TableWidgetComponent.confirm_delete.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'TableWidgetComponent.confirm_delete.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression en cours'
        }, 'TableWidgetComponent.confirm_delete.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression terminée'
        }, 'TableWidgetComponent.confirm_delete.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur lors de la suppression'
        }, 'TableWidgetComponent.confirm_delete.ko.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Contient' },
            'adv_str_fltr.contient'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Ne contient pas' },
            'adv_str_fltr.contient_pas'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Commence par' },
            'adv_str_fltr.commence'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Ne commence pas par' },
            'adv_str_fltr.commence_pas'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Est' },
            'adv_str_fltr.est'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'N\'est pas' },
            'adv_str_fltr.nest_pas'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Est vide' },
            'adv_str_fltr.est_vide'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'N\'est pas vide' },
            'adv_str_fltr.nest_pas_vide'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Est null' },
            'adv_str_fltr.est_null'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'N\'est pas null' },
            'adv_str_fltr.nest_pas_null'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Ajouter un filtre' },
            'advanced_filters.add.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Valider le filtre' },
            'advanced_filters.validate.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Choisir le type de liaison entre ce filtre et le suivant (ET ou OU)' },
            'advanced_filters.link_type.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Supprimer ce filtre' },
            'advanced_filters.delete.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'ET' },
            'adv_str_fltr.et'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'OU' },
            'adv_str_fltr.ou'));

        let preCTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this.onCDashboardPageWidgetVO);
        preCTrigger.registerHandler(DashboardVO.API_TYPE_ID, this.onCDashboardVO);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDashboardBuilder.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Dashboards'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDashboardBuilder.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des Dashboards'
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
            fr: 'Consultation des Dashboards'
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(weight) as max_weight from ' + VOsTypesManager.getInstance().moduleTables_by_voType[DashboardVO.API_TYPE_ID].full_name);
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(weight) as max_weight from ' + VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID].full_name);
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

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(i) as max_i from ' + VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID].full_name);
        let max_i = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_i'] != 'undefined') && (query_res[0]['max_i'] !== null)) ? query_res[0]['max_i'] : null;
        max_i = max_i ? parseInt(max_i.toString()) : null;
        if (!max_i) {
            max_i = 1;
        }
        e.i = max_i + 1;

        return;
    }
}
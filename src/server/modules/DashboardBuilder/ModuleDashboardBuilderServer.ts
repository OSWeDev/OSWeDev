import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';

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
            fr: 'Impossible de créer un nouveau Dashboard...'
        }, 'DashboardBuilderComponent.create_new_dashboard.ko.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur de chargement du Dashboard Builder'
        }, 'dashboard_builder.loading_failed.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner un Dashboard...'
        }, 'dashboard_builder.select_dashboard.___LABEL___'));


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
        }, 'menu.menuelements.DashboardBuilder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dashboard Builder'
        }, 'menu.menuelements.DashboardBuilderAdminVueModule.___LABEL___'));


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
            fr: 'Glisser/déposer un champs'
        }, 'single_vo_field_ref_holder.vo_ref_field_receiver_placeholder.___LABEL___'));

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
        }, 'droppable_vos.filter_by_field_id_or_api_type_id.placeholder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tables'
        }, 'droppable_vos.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '1 - Tables'
        }, 'dashboard_builder.select_vos.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '2 - Widgets'
        }, 'dashboard_builder.build_page.___LABEL___'));

        let preCTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this.onCDashboardPageWidgetVO);
        preCTrigger.registerHandler(DashboardVO.API_TYPE_ID, this.onCDashboardVO);
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
        e.weight = max_weight;

        return;
    }

    private async check_DashboardPageWidgetVO_i(e: DashboardPageWidgetVO) {
        if (e.i) {
            return;
        }

        let query_res = await ModuleDAOServer.getInstance().query('SELECT max(id) as max_i from ' + VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID].full_name);
        let max_i = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_i'] != 'undefined') && (query_res[0]['max_i'] !== null)) ? query_res[0]['max_i'] : null;
        max_i = max_i ? parseInt(max_i.toString()) : null;
        if (!max_i) {
            max_i = 1;
        }
        e.i = max_i;

        return;
    }
}
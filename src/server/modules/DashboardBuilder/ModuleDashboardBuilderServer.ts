import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleDashboardBuilder from '../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DBBConfVO from '../../../shared/modules/DashboardBuilder/vos/DBBConfVO';
import DashboardGraphVORefVO from '../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardViewportPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import DashboardBuilderCronWorkersHandler from './DashboardBuilderCronWorkersHandler';
import DashboardCycleChecker from './DashboardCycleChecker';
import ModuleDashboardBuilderDefaultTranslationsHolder from './ModuleDashboardBuilderDefaultTranslationsHolder';
import FavoritesFiltersServerController from './favorite_filters/FavoritesFiltersServerController';

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

        ModuleDashboardBuilderDefaultTranslationsHolder.init_default_translations();

        const preCTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCTrigger.registerHandler(DashboardViewportPageWidgetVO.API_TYPE_ID, this, this.onprec_DashboardViewportPageWidgetVO);

        preCTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.onpreC_DashboardVO);

        const preUTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUTrigger.registerHandler(DashboardViewportPageWidgetVO.API_TYPE_ID, this, this.onpreu_check_viewport_page_widget_is_not_intersecting_other_widgets);


        const postUTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUTrigger.registerHandler(DashboardGraphVORefVO.API_TYPE_ID, this, this.onUDashboardGraphVORefVO);
        postUTrigger.registerHandler(DashboardViewportVO.API_TYPE_ID, this, this.postUpdateDashboardViewport);
        postUTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.onpostu_DashboardVO_activated_viewport_id_ranges);

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(DashboardViewportVO.API_TYPE_ID, this, this.postCreateDashboardViewport);
        postCreateTrigger.registerHandler(DashboardPageWidgetVO.API_TYPE_ID, this, this.postCreate_DashboardPageWidgetVO);

        postCreateTrigger.registerHandler(DashboardVO.API_TYPE_ID, this, this.postCreate_DashboardVO);


        ModuleDAOServer.getInstance().registerContextAccessHook(
            DBBConfVO.API_TYPE_ID,
            this,
            this.filter_valid_dbb_confs_by_user_roles,
        );
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(
            ModuleDashboardBuilder.APINAME_START_EXPORT_FAVORITES_FILTERS_DATATABLE,
            this.start_export_favorites_filters_datatable.bind(this)
        );
        APIControllerWrapper.register_server_api_handler(
            this.name,
            reflect<this>().get_all_valid_api_type_ids,
            this.get_all_valid_api_type_ids.bind(this)
        );
        APIControllerWrapper.register_server_api_handler(
            this.name,
            reflect<this>().get_all_valid_widget_ids,
            this.get_all_valid_widget_ids.bind(this)
        );

    }

    /**
     * Start Export Datatable Using Favorites Filters
     *
     * @return {Promise<void>}
     */
    public async start_export_favorites_filters_datatable(): Promise<void> {
        FavoritesFiltersServerController.export_all_favorites_filters_datatable();
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDashboardBuilder.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Dashboards'
        }));

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
        admin_access_dependency.depends_on_pol_id = fo_access.id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_ACCESS_ONGLET_TABLE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_TABLE.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_TABLE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_TABLE.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE;
        POLICY_DBB_ACCESS_ONGLET_TABLE = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_TABLE, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Tables du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_TABLE_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_TABLE_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_TABLE_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_ACCESS_ONGLET_TABLE_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_TABLE_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_DBB_ACCESS_ONGLET_WIDGETS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_WIDGETS.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_WIDGETS;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_WIDGETS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Widgets du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_WIDGETS_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_WIDGETS_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_WIDGETS.id;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_WIDGETS_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_ACCESS_ONGLET_VIEWPORT: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_VIEWPORT;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_VIEWPORT, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Écrans du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_VIEWPORT_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_VIEWPORT.id;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_VIEWPORT_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_ACCESS_ONGLET_MENUS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_MENUS.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_MENUS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_MENUS.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_MENUS;
        POLICY_DBB_ACCESS_ONGLET_MENUS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_MENUS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Menus du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_MENUS_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_MENUS_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_MENUS_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_MENUS.id;
        POLICY_DBB_ACCESS_ONGLET_MENUS_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_MENUS_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Filtres Partagés du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES.id;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès au graphique des Tables dans l\'onglet Tables du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH.id;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_DBB_ACCESS_ONGLET_RIGHTS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_ACCESS_ONGLET_RIGHTS.group_id = group.id;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS.translatable_name = ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_RIGHTS;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_ACCESS_ONGLET_RIGHTS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à l\'onglet Droits d\'accès du DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_ACCESS_ONGLET_RIGHTS_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_ACCESS_ONGLET_RIGHTS_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS_bo_access_dependency.src_pol_id = POLICY_DBB_ACCESS_ONGLET_RIGHTS.id;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_ACCESS_ONGLET_RIGHTS_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_DBB_CAN_EXPORT_IMPORT_JSON: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON.group_id = group.id;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_EXPORT_IMPORT_JSON;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_EXPORT_IMPORT_JSON, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut exporter/importer des dashboards au format JSON'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_EXPORT_IMPORT_JSON_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_EXPORT_IMPORT_JSON.id;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_CAN_EXPORT_IMPORT_JSON_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_CREATE_NEW_DB: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_CREATE_NEW_DB.group_id = group.id;
        POLICY_DBB_CAN_CREATE_NEW_DB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_CREATE_NEW_DB.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_CREATE_NEW_DB;
        POLICY_DBB_CAN_CREATE_NEW_DB = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_CREATE_NEW_DB, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut créer un nouveau DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_CREATE_NEW_DB_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_CREATE_NEW_DB_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_CREATE_NEW_DB_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_CREATE_NEW_DB.id;
        POLICY_DBB_CAN_CREATE_NEW_DB_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_CAN_CREATE_NEW_DB_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_DELETE_DB: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_DELETE_DB.group_id = group.id;
        POLICY_DBB_CAN_DELETE_DB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_DELETE_DB.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_DELETE_DB;
        POLICY_DBB_CAN_DELETE_DB = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_DELETE_DB, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut supprimer un DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_DELETE_DB_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_DELETE_DB_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_DELETE_DB_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_DELETE_DB.id;
        POLICY_DBB_CAN_DELETE_DB_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_CAN_DELETE_DB_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_SWITCH_DB: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_SWITCH_DB.group_id = group.id;
        POLICY_DBB_CAN_SWITCH_DB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_SWITCH_DB.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_SWITCH_DB;
        POLICY_DBB_CAN_SWITCH_DB = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_SWITCH_DB, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut changer de DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_SWITCH_DB_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_SWITCH_DB_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_SWITCH_DB_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_SWITCH_DB.id;
        POLICY_DBB_CAN_SWITCH_DB_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_CAN_SWITCH_DB_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_EDIT_PAGES: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_EDIT_PAGES.group_id = group.id;
        POLICY_DBB_CAN_EDIT_PAGES.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_EDIT_PAGES.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_EDIT_PAGES;
        POLICY_DBB_CAN_EDIT_PAGES = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_EDIT_PAGES, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier les pages du DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_EDIT_PAGES_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_EDIT_PAGES_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_EDIT_PAGES_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_EDIT_PAGES.id;
        POLICY_DBB_CAN_EDIT_PAGES_bo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleDashboardBuilder.POLICY_BO_ACCESS).id;
        POLICY_DBB_CAN_EDIT_PAGES_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_UPDATE_CRUD_TYPE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE.group_id = group.id;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_CRUD_TYPE;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_UPDATE_CRUD_TYPE, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier le type de données lié au DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_UPDATE_CRUD_TYPE_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_UPDATE_CRUD_TYPE.id;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE_bo_access_dependency.depends_on_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_CAN_UPDATE_CRUD_TYPE_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);


        let POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE.group_id = group.id;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier l\'option formulaire du DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE.id;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE_bo_access_dependency.depends_on_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);



        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE.group_id = group.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier l\'option "est le template de création" du type de données lié au DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE_bo_access_dependency.depends_on_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ.group_id = group.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier l\'option "est le template de consultation" du type de données lié au DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ_bo_access_dependency.depends_on_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE: AccessPolicyVO = new AccessPolicyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE.group_id = group.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE.translatable_name = ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE, DefaultTranslationVO.create_new({
            'fr-fr': 'Peut modifier l\'option "est le template de modification" du type de données lié au DB dans le DBB'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE_bo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE_bo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE_bo_access_dependency.src_pol_id = POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE_bo_access_dependency.depends_on_pol_id = POLICY_DBB_ACCESS_ONGLET_TABLE.id;
        POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE_bo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    /**
     * ATTENTION ya quand même un truc un peu spécial avec ce fonctionnement :
     * Si on a le rôle A et que A a pas de conf, on a accès à tout
     * Si on a le rôle A et B et que A a pas de conf mais B oui, on a accès que aux éléments de la conf B, donc on a perdu des accès en ajoutant un rôle...
     * On pourrait tester tous les rôles individuellement, mais du coup on aurait un toujours a minima le rôle du compte + le rôle connecté, et faudrait toujours une conf sur le rôle
     * connecté, probablement vide, pour éviter que tous aient accès à tout... donc c'est pas fou non plus. Je pense que pour l'usage actuel c'est la bonne solution à voir dans le temps.
     */
    public async get_all_valid_api_type_ids(): Promise<string[]> {
        // On charge les confs de dbbs en lien avec les rôles du user
        const roles: RoleVO[] = await ModuleAccessPolicyServer.getInstance().getMyRoles();
        if (!roles || roles.length === 0) {
            return [];
        }

        const confs: DBBConfVO[] = await query(DBBConfVO.API_TYPE_ID)
            .exec_as_server()
            .filter_by_ids(roles.map((r: RoleVO) => r.id), RoleVO.API_TYPE_ID)
            .select_vos<DBBConfVO>();

        // Si ya pas de conf on active toutes les tables
        if (!confs || confs.length === 0) {
            return Object.keys(ModuleTableController.module_tables_by_vo_type);
        }

        // Sinon active les tables citées
        const valid_moduletable_id_ranges: NumRange[] = [];
        for (const conf of confs) {
            if (conf && conf.valid_moduletable_id_ranges && conf.valid_moduletable_id_ranges.length > 0) {
                valid_moduletable_id_ranges.push(...conf.valid_moduletable_id_ranges);
            }
        }

        // Puis on filtre les table en fonction des droits d'accès à chaque type de données
        const res: string[] = [];
        RangeHandler.foreach_ranges_sync(valid_moduletable_id_ranges, (moduletable_id: number) => {
            if (AccessPolicyServerController.checkAccessSync(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ModuleTableController.module_tables_by_vo_id[moduletable_id].vo_type), true)) {
                res.push(ModuleTableController.module_tables_by_vo_id[moduletable_id].vo_type);
            }
        });

        return res;
    }

    public async get_all_valid_widget_ids(): Promise<number[]> {
        // On charge les confs de dbbs en lien avec les rôles du user
        const roles: RoleVO[] = await ModuleAccessPolicyServer.getInstance().getMyRoles();
        if (!roles || roles.length === 0) {
            return [];
        }

        let confs: DBBConfVO[] = null;
        let all_widgets: DashboardWidgetVO[] = null;
        await all_promises([
            (async () => {
                confs = await query(DBBConfVO.API_TYPE_ID)
                    .exec_as_server()
                    .filter_by_ids(roles.map((r: RoleVO) => r.id), RoleVO.API_TYPE_ID)
                    .select_vos<DBBConfVO>();
            })(),
            (async () => {
                all_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
                    .exec_as_server()
                    .select_vos<DashboardWidgetVO>();
            })(),
        ]);

        // Si ya pas de conf on active tous les widgets
        if ((!confs) || (confs.length === 0)) {
            return all_widgets.map((w: DashboardWidgetVO) => w.id);
        }

        // Sinon active les widgets cités
        // Si une des confs n'a pas de limitation de widgets, on active tous les widgets
        const valid_widget_id_ranges: NumRange[] = [];
        for (const conf of confs) {
            if (!conf) {
                continue;
            }

            if (!conf.valid_widget_id_ranges) {
                // Si on a pas de contrainte de widget sur une conf, on active tous les widgets
                return all_widgets.map((w: DashboardWidgetVO) => w.id);
            }

            if (conf.valid_widget_id_ranges.length > 0) {
                valid_widget_id_ranges.push(...conf.valid_widget_id_ranges);
            }
        }

        return RangeHandler.get_array_from_ranges(valid_widget_id_ranges);
    }

    private async onpreC_DashboardVO(e: DashboardVO): Promise<boolean> {
        if (!e) {
            return false;
        }

        await ModuleDashboardBuilderServer.getInstance().check_DashboardVO_weight(e);

        // On doit activer le viewport par défaut à minima quand on crée le db
        if (RangeHandler.getCardinalFromArray(e.activated_viewport_id_ranges) <= 0) {
            const default_viewport = await query(DashboardViewportVO.API_TYPE_ID)
                .filter_is_true(field_names<DashboardViewportVO>().is_default)
                .exec_as_server()
                .select_vo<DashboardViewportVO>();

            if (!default_viewport) {
                throw new Error('Impossible de créer un Dashboard sans viewport par défaut actif.');
            }
            e.activated_viewport_id_ranges = [RangeHandler.create_single_elt_NumRange(default_viewport.id, NumSegment.TYPE_INT)];
        }

        return true;
    }

    private async check_DashboardVO_weight(e: DashboardVO) {
        if (e.weight) {
            return;
        }

        const query_res = await ModuleDAOServer.instance.query('SELECT max(weight) as max_weight from ' + ModuleTableController.module_tables_by_vo_type[DashboardVO.API_TYPE_ID].full_name, null, true);
        let max_weight = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_weight'] != 'undefined') && (query_res[0]['max_weight'] !== null)) ? query_res[0]['max_weight'] : null;
        max_weight = max_weight ? parseInt(max_weight.toString()) : null;
        if (!max_weight) {
            max_weight = 1;
        }
        e.weight = max_weight;

        return;
    }

    private async onprec_DashboardViewportPageWidgetVO(viewport_page_widget: DashboardViewportPageWidgetVO): Promise<boolean> {
        if (!viewport_page_widget) {
            return false;
        }

        await all_promises([
            ModuleDashboardBuilderServer.getInstance().check_DashboardViewportPageWidgetVO_i(viewport_page_widget),
            ModuleDashboardBuilderServer.getInstance().check_default_width_vs_viewport(viewport_page_widget),
            ModuleDashboardBuilderServer.getInstance().check_default_height(viewport_page_widget),
            ModuleDashboardBuilderServer.getInstance().check_DashboardViewportPageWidgetVO_y(viewport_page_widget),
        ]);

        return true;
    }

    private async check_default_height(viewport_page_widget: DashboardViewportPageWidgetVO) {
        if (viewport_page_widget.h != null) {
            return;
        }

        const widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_id(viewport_page_widget.page_widget_id, DashboardPageWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<DashboardWidgetVO>();

        if (!widget) {
            ConsoleHandler.error(`Impossible de vérifier la hauteur du DashboardViewportPageWidgetVO ${viewport_page_widget.id} car le widget ${viewport_page_widget.page_widget_id} n'existe pas.`);
            return;
        }

        viewport_page_widget.h = widget.default_height;

        return;
    }

    private async check_default_width_vs_viewport(viewport_page_widget: DashboardViewportPageWidgetVO) {

        const widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_id(viewport_page_widget.page_widget_id, DashboardPageWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<DashboardWidgetVO>();

        if (!widget) {
            ConsoleHandler.error(`Impossible de vérifier la largeur du DashboardViewportPageWidgetVO ${viewport_page_widget.id} car le widget ${viewport_page_widget.page_widget_id} n'existe pas.`);
            return;
        }

        const viewport = await query(DashboardViewportVO.API_TYPE_ID)
            .filter_by_id(viewport_page_widget.viewport_id)
            .exec_as_server()
            .select_vo<DashboardViewportVO>();
        if (!viewport) {
            ConsoleHandler.error(`Impossible de vérifier la largeur du DashboardViewportPageWidgetVO ${viewport_page_widget.id} car le viewport ${viewport_page_widget.viewport_id} n'existe pas.`);
            return;
        }

        if (viewport_page_widget.w != null) {
            viewport_page_widget.w = (viewport_page_widget.w > viewport.nb_columns) ? viewport.nb_columns : viewport_page_widget.w;
        } else {
            viewport_page_widget.w = (widget.default_width > viewport.nb_columns) ? viewport.nb_columns : widget.default_width;
        }

        return;
    }


    private async check_DashboardViewportPageWidgetVO_i(viewport_page_widget: DashboardViewportPageWidgetVO) {

        if (viewport_page_widget.i != null) {

            const this_viewport_page_widget_dashboard_page = await query(DashboardPageVO.API_TYPE_ID)
                .filter_by_id(viewport_page_widget.page_widget_id, DashboardPageWidgetVO.API_TYPE_ID)
                .exec_as_server()
                .select_vo<DashboardPageVO>();

            if (!this_viewport_page_widget_dashboard_page?.dashboard_id) {
                ConsoleHandler.error(`Impossible de vérifier la position i du DashboardViewportPageWidgetVO ${viewport_page_widget.id} car le DashboardPageWidgetVO ${viewport_page_widget.page_widget_id} n'existe pas ou n'a pas de dashboard associé.`);
                return;
            }

            // Si on a un i, on doit juste vérifier qu'il est unique au viewport/dashboard
            const existing = await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
                .filter_by_num_not_eq(field_names<DashboardViewportPageWidgetVO>().id, viewport_page_widget.id)

                .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().i, viewport_page_widget.i)
                .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().viewport_id, viewport_page_widget.viewport_id)
                .filter_by_num_eq(field_names<DashboardPageVO>().dashboard_id, this_viewport_page_widget_dashboard_page?.dashboard_id, DashboardPageVO.API_TYPE_ID).using(DashboardPageWidgetVO.API_TYPE_ID) // pour le lien avec le dashboard

                .exec_as_server()
                .select_vo<DashboardViewportPageWidgetVO>();

            if (!existing) {
                return;
            }

            // sinon on doit lui en trouver un nouveau
        }

        const query_res = await ModuleDAOServer.instance.query('SELECT max(i) as max_i from ' + ModuleTableController.module_tables_by_vo_type[DashboardViewportPageWidgetVO.API_TYPE_ID].full_name, null, true);
        let max_i = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_i'] != 'undefined') && (query_res[0]['max_i'] !== null)) ? query_res[0]['max_i'] : null;
        max_i = max_i ? parseInt(max_i.toString()) : null;
        if (!max_i) {
            max_i = 1;
        }
        viewport_page_widget.i = max_i + 1;

        return;
    }

    private async onpreu_check_viewport_page_widget_is_not_intersecting_other_widgets(vo_update_handler: DAOUpdateVOHolder<DashboardViewportPageWidgetVO>): Promise<boolean> {
        await this.check_viewport_page_widget_is_not_intersecting_other_widgets(vo_update_handler.post_update_vo);

        return true;
    }

    private async check_viewport_page_widget_is_not_intersecting_other_widgets(viewport_page_widget: DashboardViewportPageWidgetVO) {
        if (!viewport_page_widget) {
            return;
        }

        // Si le widget est pas activé, il ne chevauche rien
        if (!viewport_page_widget.activated) {
            return;
        }

        // on charge les autres widgets de la page
        const other_widgets: DashboardViewportPageWidgetVO[] = await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
            .filter_by_num_not_eq(field_names<DashboardViewportPageWidgetVO>().id, viewport_page_widget.id) // on exclut le widget en cours
            .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().viewport_id, viewport_page_widget.viewport_id) // on filtre par le viewport
            .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().page_id, viewport_page_widget.page_id) // on filtre par la page du widget
            .exec_as_server()
            .select_vos<DashboardViewportPageWidgetVO>();

        if (!other_widgets || other_widgets.length === 0) {
            // Pas d'autres widgets, on est tranquille
            return;
        }

        // On vérifie si le widget en cours chevauche un autre widget
        for (const other_widget of other_widgets) {
            if (!other_widget || !other_widget.activated) {
                continue; // on ignore les widgets désactivés
            }

            // On vérifie si les positions se chevauchent
            const is_overlapping = this.isOverlapping(viewport_page_widget, other_widget);
            if (is_overlapping) {
                // Si on overlap, on doit charger le max y pour ce viewport page widget
                const query_res = await ModuleDAOServer.instance.query(
                    'SELECT max(vpw.y + vpw.h) as max_y from ' + ModuleTableController.module_tables_by_vo_type[DashboardViewportPageWidgetVO.API_TYPE_ID].full_name + ' vpw ' +
                    ' join ' + ModuleTableController.module_tables_by_vo_type[DashboardPageWidgetVO.API_TYPE_ID].full_name + ' pw on vpw.page_widget_id = pw.id ' +
                    ' where ' +
                    (viewport_page_widget.id ? 'vpw.id != ' + viewport_page_widget.id + ' and ' : '') +
                    'vpw.page_id = ' + viewport_page_widget.page_id + ' and vpw.activated is true and vpw.viewport_id = ' + viewport_page_widget.viewport_id, // le max de y+h des widgets de cette page, dans ce viewport, parmis les widgets activés (hors widget en cours de vérification)
                    null, true);
                let max_y = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_y'] != 'undefined') && (query_res[0]['max_y'] !== null)) ? query_res[0]['max_y'] : null;
                max_y = max_y ? parseInt(max_y.toString()) : null;
                if (!max_y) {
                    max_y = 0;
                }
                viewport_page_widget.y = max_y;

                return;
            }
        }
    }

    private isOverlapping(widget1: DashboardViewportPageWidgetVO, widget2: DashboardViewportPageWidgetVO): boolean {
        if (!widget1 || !widget2) {
            return false; // Si l'un des widgets est invalide, pas de chevauchement
        }

        // Vérification des coordonnées
        const x1 = widget1.x;
        const y1 = widget1.y;
        const x2 = x1 + widget1.w; // x + largeur
        const y2 = y1 + widget1.h; // y + hauteur

        const x3 = widget2.x;
        const y3 = widget2.y;
        const x4 = x3 + widget2.w; // x + largeur
        const y4 = y3 + widget2.h; // y + hauteur

        // Vérification de l'overlap
        return !(x1 >= x4 || x3 >= x2 || y1 >= y4 || y3 >= y2);
    }

    private async check_DashboardViewportPageWidgetVO_y(viewport_page_widget: DashboardViewportPageWidgetVO) {
        if (viewport_page_widget.y != null) {

            // On doit vérifier que ça empiète pas sur un autre widget
            await this.check_viewport_page_widget_is_not_intersecting_other_widgets(viewport_page_widget);
            return;
        }

        const query_res = await ModuleDAOServer.instance.query(
            'SELECT max(vpw.y + vpw.h) as max_y from ' + ModuleTableController.module_tables_by_vo_type[DashboardViewportPageWidgetVO.API_TYPE_ID].full_name + ' vpw ' +
            ' join ' + ModuleTableController.module_tables_by_vo_type[DashboardPageWidgetVO.API_TYPE_ID].full_name + ' pw on vpw.page_widget_id = pw.id ' +
            ' where ' +
            (viewport_page_widget.id ? 'vpw.id != ' + viewport_page_widget.id + ' and ' : '') +
            'vpw.page_id = ' + viewport_page_widget.page_id + ' and vpw.activated is true and vpw.viewport_id = ' + viewport_page_widget.viewport_id, // le max de y+h des widgets de cette page, dans ce viewport, parmis les widgets activés (hors widget en cours de vérification)
            null, true);
        let max_y = (query_res && (query_res.length == 1) && (typeof query_res[0]['max_y'] != 'undefined') && (query_res[0]['max_y'] !== null)) ? query_res[0]['max_y'] : null;
        max_y = max_y ? parseInt(max_y.toString()) : null;
        if (!max_y) {
            max_y = 0;
        }
        viewport_page_widget.y = max_y;

        return;
    }

    private async onUDashboardGraphVORefVO(wrapper: DAOUpdateVOHolder<DashboardGraphVORefVO>) {

        // // Si la modif est justement un changement de cycles, on ne fait rien
        // if (DashboardCycleChecker.needs_update(wrapper.pre_update_vo, wrapper.post_update_vo.cycle_tables, wrapper.post_update_vo.cycle_fields, wrapper.post_update_vo.cycle_links)) {
        //     return;
        // }

        DashboardCycleChecker.detectCyclesForDashboards({ [wrapper.post_update_vo.dashboard_id]: true });
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

        // Si le nouveau devient le défaut, on désactive les autres
        if (viewport.is_default) {
            await this.viewportBecomeDefault(viewport);
        }
    }

    private async postCreate_DashboardPageWidgetVO(page_widget: DashboardPageWidgetVO) {
        /**
         * On doit init les DashboardViewportPageWidgetVO pour chaque viewport actif du Dashboard
         */
        if (!page_widget) {
            return;
        }

        // On doit le faire pour toutes les pages
        const pages: DashboardPageVO[] = await query(DashboardPageVO.API_TYPE_ID)
            .filter_by_ids(page_widget.page_id_ranges)
            .exec_as_server()
            .select_vos<DashboardPageVO>();

        const new_items = [];
        for (const page of pages) {
            const viewports: DashboardViewportVO[] = await query(DashboardViewportVO.API_TYPE_ID)
                .filter_by_id(page.id, DashboardPageVO.API_TYPE_ID)
                .using(DashboardVO.API_TYPE_ID) // ça va faire la ref via les id_ranges des viewports activés sur le dbs, et pour le db en lien avec la page du widget
                .exec_as_server()
                .select_vos<DashboardViewportVO>();

            for (const i in viewports) {
                const viewport: DashboardViewportVO = viewports[i];

                const viewport_page_widget: DashboardViewportPageWidgetVO = new DashboardViewportPageWidgetVO();
                viewport_page_widget.page_widget_id = page_widget.id;
                viewport_page_widget.page_id = page.id;
                viewport_page_widget.viewport_id = viewport.id;
                viewport_page_widget.activated = false; // On active pas par défaut le nouveau widget sur les autres viewports (le viewport de la création du widget sera passé actif côté client par le DBB)

                new_items.push(viewport_page_widget);
            }
        }

        if (new_items.length > 0) {
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(new_items);
        }
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

    /**
     * Le but c'est de créer ou supprimer les DashboardViewportPageWidgets en fonction des changement sur le champs activated_viewport_id_ranges
     */
    private async onpostu_DashboardVO_activated_viewport_id_ranges(update: DAOUpdateVOHolder<DashboardVO>) {

        if ((!update) || (!update.pre_update_vo) || (!update.post_update_vo)) {
            return;
        }

        const pre_update_activated_viewport_id_ranges = update.pre_update_vo.activated_viewport_id_ranges || [];
        const post_update_activated_viewport_id_ranges = update.post_update_vo.activated_viewport_id_ranges || [];

        const new_viewport_id_ranges = RangeHandler.cuts_ranges(pre_update_activated_viewport_id_ranges, post_update_activated_viewport_id_ranges)?.remaining_items;
        const removed_viewport_id_ranges = RangeHandler.cuts_ranges(post_update_activated_viewport_id_ranges, pre_update_activated_viewport_id_ranges)?.remaining_items;

        // On demande la suppression de tous les viewport pages widgets qui sont plus d'actualité
        if (removed_viewport_id_ranges && removed_viewport_id_ranges.length > 0) {
            await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<DashboardViewportPageWidgetVO>().viewport_id, removed_viewport_id_ranges)
                .filter_by_num_eq(field_names<DashboardPageVO>().dashboard_id, update.post_update_vo.id, DashboardPageVO.API_TYPE_ID)
                .using(DashboardPageWidgetVO.API_TYPE_ID)
                .exec_as_server()
                .delete_vos();
        }

        const all_page_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageVO>().dashboard_id, update.post_update_vo.id, DashboardPageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();

        const new_viewport_page_widgets = [];
        // On crée les DashboardViewportPageWidget pour les nouveaux viewports
        await RangeHandler.foreach_ranges(new_viewport_id_ranges, (new_viewport_id: number) => {


            for (const i in all_page_widgets) {
                const page_widget: DashboardPageWidgetVO = all_page_widgets[i];

                const new_viewport_page_widget = new DashboardViewportPageWidgetVO();

                new_viewport_page_widget.activated = false; // On active pas par défaut sur le nouveau viewport
                new_viewport_page_widget.page_widget_id = page_widget.id;
                new_viewport_page_widget.viewport_id = new_viewport_id;

                new_viewport_page_widget.x = page_widget.x;
                new_viewport_page_widget.y = page_widget.y;
                new_viewport_page_widget.w = page_widget.w;
                new_viewport_page_widget.h = page_widget.h;
                new_viewport_page_widget.i = page_widget.i; // On garde l'index du widget

                new_viewport_page_widgets.push(new_viewport_page_widget);
            }
        });

        if (new_viewport_page_widgets && new_viewport_page_widgets.length > 0) {
            await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(new_viewport_page_widgets);
        }
    }

    private async postCreate_DashboardVO(dashboard: DashboardVO) {
        // On doit créer une page immédiatement pour pas garder un db vide
        if (!dashboard) {
            return;
        }

        const page = new DashboardPageVO();
        page.dashboard_id = dashboard.id;
        page.weight = 0;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page);

        // On crée la trad par défaut pour, le titre
        const translation_code = new TranslatableTextVO();
        translation_code.code_text = dashboard.title;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(translation_code);

        if (!translation_code.id) {
            ConsoleHandler.error('Error creating translation code for dashboard title');
            return;
        }

        const user = await ModuleAccessPolicyServer.getSelfUser();
        if (!user || user.lang_id) {
            ConsoleHandler.error('User language ID not found');
            return;
        }

        const translation = new TranslationVO();
        translation.lang_id = user.lang_id;
        translation.text_id = translation_code.id;
        translation.translated = "Dashboard [" + dashboard.id + "]";
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(translation);
    }

    private async filter_valid_dbb_confs_by_user_roles(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (!uid) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        return query(DBBConfVO.API_TYPE_ID)
            .field(field_names<DBBConfVO>().id)
            .filter_by_num_x_ranges(field_names<DBBConfVO>().role_id_ranges, RangeHandler.get_ids_ranges_from_vos(user_roles))
            .exec_as_server();
    }
}
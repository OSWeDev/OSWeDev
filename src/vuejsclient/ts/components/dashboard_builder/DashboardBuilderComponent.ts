import Component from 'vue-class-component';
import { Prop, Provide } from 'vue-property-decorator';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import DashboardBuilderController from '../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import WidgetOptionsVOManager from '../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DBBConfVO from '../../../../shared/modules/DashboardBuilder/vos/DBBConfVO';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardViewportPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import SharedFiltersVO from '../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import ModuleDataExport from '../../../../shared/modules/DataExport/ModuleDataExport';
import ExportVOsToJSONConfVO from '../../../../shared/modules/DataExport/vos/ExportVOsToJSONConfVO';
import ExportVOsToJSONHistoricVO from '../../../../shared/modules/DataExport/vos/ExportVOsToJSONHistoricVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ObjectHandler, { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import { SyncVO } from '../../tools/annotations/SyncVO';
import { SyncVOs } from '../../tools/annotations/SyncVOs';
import { TestAccess } from '../../tools/annotations/TestAccess';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../VueComponentBase';
import ModuleTablesComponent from '../module_tables/ModuleTablesComponent';
import './DashboardBuilderComponent.scss';
import DashboardHistoryController from './DashboardHistoryController';
import DashboardBuilderBoardComponent from './board/DashboardBuilderBoardComponent';
import CrudDBLinkComponent from './crud_db_link/CrudDBLinkComponent';
import DroppableVoFieldsComponent from './droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDroppableVoFieldsAction } from './droppable_vo_fields/DroppableVoFieldsStore';
import DashboardMenuConfComponent from './menu_conf/DashboardMenuConfComponent';
import DashboardPageStore, { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from './page/DashboardPageStore';
import DashboardSharedFiltersComponent from './shared_filters/DashboardSharedFiltersComponent';
import DashboardViewportConfComponent from './viewport_conf/DashboardViewportConfComponent';
import DashboardBuilderWidgetsComponent from './widgets/DashboardBuilderWidgetsComponent';
import { SafeWatch } from '../../tools/annotations/SafeWatch';

@Component({
    template: require('./DashboardBuilderComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Droppablevofieldscomponent: DroppableVoFieldsComponent,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
        Dashboardmenuconfcomponent: DashboardMenuConfComponent,
        Dashboardsharedfilterscomponent: DashboardSharedFiltersComponent,
        Moduletablescomponent: ModuleTablesComponent,
        Cruddblinkcomponent: CrudDBLinkComponent,
        DashboardViewportConfComponent: DashboardViewportConfComponent,
    },
})
export default class DashboardBuilderComponent extends VueComponentBase implements IDashboardPageConsumer {

    public static DBB_ONGLET_TABLE: string = 'onglet_table';
    public static DBB_ONGLET_VIEWPORT: string = 'onglet_viewport';
    public static DBB_ONGLET_WIDGETS: string = 'onglet_widgets';
    public static DBB_ONGLET_MENUS: string = 'onglet_menus';
    public static DBB_ONGLET_FILTRES_PARTAGES: string = 'onglet_shared_filters';
    public static DBB_ONGLET_RIGHTS: string = 'onglet_rights';
    public static ALL_DBB_ONGLETS: string[] = [
        DashboardBuilderComponent.DBB_ONGLET_TABLE,
        DashboardBuilderComponent.DBB_ONGLET_VIEWPORT,
        DashboardBuilderComponent.DBB_ONGLET_WIDGETS,
        DashboardBuilderComponent.DBB_ONGLET_MENUS,
        DashboardBuilderComponent.DBB_ONGLET_FILTRES_PARTAGES,
        DashboardBuilderComponent.DBB_ONGLET_RIGHTS,
    ];


    @Prop({ default: null })
    public readonly dashboard_id: number;

    @Prop({ default: null })
    public readonly dashboard_vo_action: string;

    @Prop({ default: null })
    public readonly dashboard_vo_id: string;

    @Prop({ default: null })
    public readonly api_type_id_action: string;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    // namespace dynamique
    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Provide('storeNamespace')
    public readonly storeNamespace = `dashboardStore_${DashboardPageStore.__UID++}`;

    @SyncVOs(DashboardVO.API_TYPE_ID, { debug: true })
    public dashboards: DashboardVO[] = []; // All the dashboards available in the system, used to select a dashboard to edit

    @SyncVO(DashboardVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [reflect<DashboardBuilderComponent>().dashboard_id],
        id_factory: (self) => self.dashboard_id,
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public dashboard: DashboardVO = null; // The current dashboard

    @SyncVOs(DBBConfVO.API_TYPE_ID, { debug: true })
    public dbb_confs: DBBConfVO[] = []; // All the DBB configurations available in the system

    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE)
    public POLICY_DBB_ACCESS_ONGLET_TABLE: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_VIEWPORT)
    public POLICY_DBB_ACCESS_ONGLET_VIEWPORT: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_WIDGETS)
    public POLICY_DBB_ACCESS_ONGLET_WIDGETS: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_MENUS)
    public POLICY_DBB_ACCESS_ONGLET_MENUS: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES)
    public POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH)
    public POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_RIGHTS)
    public POLICY_DBB_ACCESS_ONGLET_RIGHTS: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_EXPORT_IMPORT_JSON)
    public POLICY_DBB_CAN_EXPORT_IMPORT_JSON: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_CREATE_NEW_DB)
    public POLICY_DBB_CAN_CREATE_NEW_DB: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_DELETE_DB)
    public POLICY_DBB_CAN_DELETE_DB: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_SWITCH_DB)
    public POLICY_DBB_CAN_SWITCH_DB: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_EDIT_PAGES)
    public POLICY_DBB_CAN_EDIT_PAGES: boolean = false;

    public show_shared_filters: boolean = false;
    public show_build_page: boolean = false;
    public show_select_vos: boolean = true;
    public show_menu_conf: boolean = false;

    public collapsed_fields_wrapper: boolean = true;
    public collapsed_fields_wrapper_2: boolean = true;

    public can_use_clipboard: boolean = false;

    public selected_onglet: string = DashboardBuilderComponent.DBB_ONGLET_TABLE;

    public export_vos_to_json_conf: ExportVOsToJSONConfVO = null;

    public all_tables_by_table_name: { [table_name: string]: ModuleTableVO } = {};

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_dashboard_current_viewport);
    }

    get get_current_dbb_conf(): DBBConfVO {
        return this.vuexGet(reflect<this>().get_current_dbb_conf);
    }

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_page_history);
    }

    get validite_onglets(): { [onglet: string]: boolean } {
        const validite_onglets: { [onglet: string]: boolean } = {};

        for (const i in DashboardBuilderComponent.ALL_DBB_ONGLETS) {
            const onglet = DashboardBuilderComponent.ALL_DBB_ONGLETS[i];

            switch (onglet) {
                case DashboardBuilderComponent.DBB_ONGLET_TABLE:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_TABLE && this.get_current_dbb_conf.has_access_to_tables_tab;
                    break;
                case DashboardBuilderComponent.DBB_ONGLET_VIEWPORT:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_VIEWPORT && this.get_current_dbb_conf.has_access_to_viewport_tab;
                    break;
                case DashboardBuilderComponent.DBB_ONGLET_WIDGETS:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_WIDGETS && this.get_current_dbb_conf.has_access_to_widgets_tab;
                    break;
                case DashboardBuilderComponent.DBB_ONGLET_MENUS:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_MENUS && this.get_current_dbb_conf.has_access_to_menus_tab;
                    break;
                case DashboardBuilderComponent.DBB_ONGLET_FILTRES_PARTAGES:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES && this.get_current_dbb_conf.has_access_to_shared_filters_tab;
                    break;
                case DashboardBuilderComponent.DBB_ONGLET_RIGHTS:
                    validite_onglets[onglet] = this.POLICY_DBB_ACCESS_ONGLET_RIGHTS && this.get_current_dbb_conf.has_access_to_rights_tab;
                    break;
                default:
                    validite_onglets[onglet] = false;
                    break;
            }
        }
        return validite_onglets;
    }

    get fields_by_table_name_and_field_name(): { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } } {
        const res: { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } } = {};

        for (const i in this.tables_by_table_name) {
            const table = this.tables_by_table_name[i];

            res[table.vo_type] = {};

            for (const j in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type]) {
                const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type][j];

                res[table.vo_type][field.field_name] = field;
            }
        }
        return res;
    }

    get tables_by_table_name(): { [table_name: string]: ModuleTableVO } {
        const res: { [table_name: string]: ModuleTableVO } = {};

        for (const i in this.get_dashboard_api_type_ids) {
            const api_type_id = this.get_dashboard_api_type_ids[i];

            res[api_type_id] = ModuleTableController.module_tables_by_vo_type[api_type_id];
        }

        return res;
    }

    get can_build_page() {
        return !!(this.get_dashboard_api_type_ids && this.get_dashboard_api_type_ids.length);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet(reflect<this>().get_selected_widget);
    }

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet(reflect<this>().get_dashboard_navigation_history);
    }

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }

    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_pages);
    }

    get get_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_page_widgets);
    }

    get get_selected_page_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_selected_page_page_widgets);
    }

    get get_dashboard_viewport_page_widgets(): DashboardViewportPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_viewport_page_widgets);
    }

    get get_widgets_by_id(): { [widget_id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    @SafeWatch(reflect<DashboardBuilderComponent>().get_dashboard_page)
    public onchange_page() {
        this.set_selected_widget(null);
    }

    @SafeWatch(reflect<DashboardBuilderComponent>().dashboard_id, { immediate: true })
    public async onchange_dashboard_id() {
        this.set_dashboard_id(this.dashboard_id);
    }

    @SafeWatch(reflect<DashboardBuilderComponent>().dashboard)
    public async on_change_dashboard() {
        this.init_dashboard_tab();
    }

    @SafeWatch(reflect<DashboardBuilderComponent>().dashboards)
    public async onchange_dashboards(): Promise<void> {

        // On vérifie simplement que si on a pas de db actuellement sélectionné, on sélectionne le premier dispo
        if (!(this.dashboards?.length > 0)) {
            return;
        }

        if (!this.dashboard_id) {
            this.goto_dashboard_id(this.dashboards[0].id);
        }
    }

    @SafeWatch(reflect<DashboardBuilderComponent>().get_page_widgets)
    public async onchange_on_pages_page_widgets() {
        if (this.get_page_widgets?.length > 0) {
            const custom_filters: { [name: string]: boolean } = {};

            for (const i in this.get_page_widgets) {
                const page_widget = this.get_page_widgets[i];
                if (page_widget.json_options) {
                    const options = JSON.parse(page_widget.json_options);
                    if (options && options['custom_filter_name']) {
                        custom_filters[options['custom_filter_name']] = true;
                    }
                }
            }

            if (custom_filters && ObjectHandler.hasAtLeastOneAttribute(custom_filters)) {
                this.set_custom_filters(Object.keys(custom_filters));
            }
        }
    }

    public set_selected_widget(selected_widget: DashboardPageWidgetVO): void {
        this.vuexAct(reflect<this>().set_selected_widget, selected_widget);
    }

    public set_selected_page_page_widgets(page_widgets: DashboardPageWidgetVO[]): void {
        this.vuexAct(reflect<this>().set_selected_page_page_widgets, page_widgets);
    }

    public set_dashboard_current_viewport(dashboard_current_viewport: DashboardViewportVO): void {
        this.vuexAct(reflect<this>().set_dashboard_current_viewport, dashboard_current_viewport);
    }

    public add_page_history(page_history: DashboardPageVO): void {
        this.vuexAct(reflect<this>().add_page_history, page_history);
    }


    public set_page_history(page_history: DashboardPageVO[]): void {
        this.vuexAct(reflect<this>().set_page_history, page_history);
    }

    public set_dashboard_navigation_history(dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }): void {
        this.vuexAct(reflect<this>().set_dashboard_navigation_history, dashboard_navigation_history);
    }

    public pop_page_history(fk): void {
        this.vuexAct(reflect<this>().pop_page_history, fk);
    }


    public set_custom_filters(custom_filters: string[]): void {
        this.vuexAct(reflect<this>().set_custom_filters, custom_filters);
    }


    public add_shared_filters_to_map(shared_filters: SharedFiltersVO[]): void {
        this.vuexAct(reflect<this>().add_shared_filters_to_map, shared_filters);
    }

    public set_callback_for_set_selected_widget(callback: (page_widget: DashboardPageWidgetVO) => void): void {
        this.vuexAct(reflect<this>().set_callback_for_set_selected_widget, callback);
    }

    public beforeDestroy() {
        const body = document.getElementById('page-top');

        if (body) {
            body.classList.remove("sidenav-toggled");
        }

        this.$store.unregisterModule(this.storeNamespace);
    }

    // registre/déréf module
    public async created() {

        const instance = new DashboardPageStore();
        this.$store.registerModule(this.storeNamespace, instance);

        this.set_callback_for_set_selected_widget((page_widget) => {

            if (!this.get_selected_widget) {
                this.set_selected_fields({});
                return;
            }

            const name = this.get_widgets_by_id[this.get_selected_widget.widget_id].name;
            const get_selected_fields = WidgetOptionsVOManager.widgets_get_selected_fields[name];
            this.set_selected_fields(get_selected_fields ? get_selected_fields(page_widget) : {});
        });

        await this.init_all_valid_tables();

        // Ne pas mettre en immediate true, le storeNamespace n'est pas encore créé
        this.onchange_dashboard_id();
    }

    public set_dashboard_id(dashboard_id: number): void {
        this.vuexAct(reflect<this>().set_dashboard_id, dashboard_id);
    }

    public on_dashboard_selection(dashboard: DashboardVO): void {
        this.goto_dashboard_id(dashboard.id);
    }

    public goto_dashboard_id(dashboard_id: number): void {

        if (this.dashboard_id === dashboard_id) {
            return;
        }

        if (!dashboard_id) {
            ConsoleHandler.error('goto_dashboard_id called with null or undefined dashboard_id');
            return;
        }

        // Update the dashboard navigation history
        DashboardVOManager.update_dashboard_navigation_history(
            this.dashboard.id,
            this.get_dashboard_navigation_history,
            this.set_dashboard_navigation_history,
        );

        this.$router.push({
            name: 'DashboardBuilder_id',
            params: {
                dashboard_id: dashboard_id.toString(),
            },
        });
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public dashboard_label(dashboard: DashboardVO): string {
        if ((dashboard == null) || (typeof dashboard == 'undefined')) {
            return '';
        }

        return dashboard.id + ' | ' + this.t(dashboard.title);
    }

    public async paste_dashboard(import_on_vo: DashboardVO = null) {

        const self = this;
        self.snotify.async(self.label('paste_dashboard.start'), () =>
            new Promise(async (resolve, reject) => {

                try {

                    /**
                     * On récupère le contenu du presse-papier, et on checke qu'on a bien un db dedans
                     *  si oui on insère tous les éléments et on garde la trace des liaisons
                     *  si on se retrouve dans une impasse on invalide tout l'import
                     */
                    const text = await navigator.clipboard.readText();
                    if ((!text) || (!JSON.parse(text))) {
                        throw new Error('Invalid paste');
                    }


                    // if (this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS == null) {
                    //     this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS = await ModuleAccessPolicy.getInstance().testAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS);
                    // }

                    // if (this.use_new_export_vos_to_json_confs_for_dbb == null) {
                    //     this.use_new_export_vos_to_json_confs_for_dbb = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS ? await ModuleEnvParam.getInstance().get_env_param_value_as_boolean(field_names<EnvParamsVO>().use_new_export_vos_to_json_confs_for_dbb) : false;
                    // }

                    // const use_new_export_system: boolean = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS && this.use_new_export_vos_to_json_confs_for_dbb;

                    // if (use_new_export_system) {

                    if (!this.export_vos_to_json_conf) {
                        this.export_vos_to_json_conf = await query(ExportVOsToJSONConfVO.API_TYPE_ID)
                            .filter_by_text_eq(field_names<ExportVOsToJSONConfVO>().name, DashboardBuilderController.DASHBOARD_EXPORT_TO_JSON_CONF_NAME)
                            .select_vo<ExportVOsToJSONConfVO>();
                    }

                    if (!this.export_vos_to_json_conf) {
                        ConsoleHandler.error('No export_vos_to_json_conf found for DashboardBuilderComponent');
                        this.snotify.error(this.label('do_copy_dashboard.no_export_vos_to_json_conf_found'));
                        return;
                    }

                    const export_historic: ExportVOsToJSONHistoricVO = JSON.parse(text) as ExportVOsToJSONHistoricVO;
                    if (!export_historic.exported_data) {
                        throw new Error('No exported data found for DashboardBuilderComponent');
                    }

                    const new_db = await ModuleDataExport.getInstance().import_vos_from_json(export_historic, import_on_vo?.id);

                    if (!new_db) {
                        throw new Error('No new dashboard found after import');
                    }

                    // On crée des trads, on les recharge
                    await LocaleManager.get_all_flat_locale_translations(true);

                    if ((!import_on_vo) && new_db) {
                        // on récupère le nouveau db
                        this.goto_dashboard_id(new_db.id);
                    }

                    resolve({
                        body: self.label('paste_dashboard.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('paste_dashboard.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            }),
        );
    }

    public async copy_dashboard() {

        const self = this;
        self.snotify.async(self.label('copy_dashboard.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    await this.do_copy_dashboard();

                    resolve({
                        body: self.label('copy_dashboard.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('copy_dashboard.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            }),
        );
    }

    public async move_page_left(page: DashboardPageVO, page_i: number): Promise<void> {
        if ((!this.get_dashboard_pages) || (!page_i) || (!this.get_dashboard_pages[page_i - 1])) {
            return;
        }

        const new_dashboard_pages = this.get_dashboard_pages.slice(0);
        new_dashboard_pages[page_i] = this.get_dashboard_pages[page_i - 1];
        new_dashboard_pages[page_i - 1] = page;

        for (const i in new_dashboard_pages) {
            new_dashboard_pages[i].weight = parseInt(i);
        }

        await this.save_page_move(new_dashboard_pages);
    }

    public async move_page_right(page: DashboardPageVO, page_i: number): Promise<void> {
        if ((!this.get_dashboard_pages) || (page_i >= (this.get_dashboard_pages.length - 1)) || (!this.get_dashboard_pages[page_i + 1])) {
            return;
        }

        const new_dashboard_pages = this.get_dashboard_pages.slice(0);
        new_dashboard_pages[page_i] = this.get_dashboard_pages[page_i + 1];
        new_dashboard_pages[page_i + 1] = page;

        for (const i in new_dashboard_pages) {
            new_dashboard_pages[i].weight = parseInt(i);
        }

        await this.save_page_move(new_dashboard_pages);
    }

    public async save_page_move(new_dashboard_pages: DashboardPageVO[]) {
        const self = this;
        self.snotify.async(self.label('move_page.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    await ModuleDAO.instance.insertOrUpdateVOs(new_dashboard_pages);

                    resolve({
                        body: self.label('move_page.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('move_page.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            }),
        );
    }

    public async do_copy_dashboard() {

        if (!this.dashboard) {
            return null;
        }

        /**
         * On exporte le DB, les pages, les widgets, DashboardGraphVORefVO et les trads associées (dont TableWidgetOptionsComponent et VOFieldRefVO)
         */
        if (!this.export_vos_to_json_conf) {
            this.export_vos_to_json_conf = await query(ExportVOsToJSONConfVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<ExportVOsToJSONConfVO>().name, DashboardBuilderController.DASHBOARD_EXPORT_TO_JSON_CONF_NAME)
                .select_vo<ExportVOsToJSONConfVO>();
        }

        if (!this.export_vos_to_json_conf) {
            ConsoleHandler.error('No export_vos_to_json_conf found for DashboardBuilderComponent');
            this.snotify.error(this.label('do_copy_dashboard.no_export_vos_to_json_conf_found'));
            return;
        }
        const export_historic = await ModuleDataExport.getInstance().export_vos_to_json([this.dashboard], this.export_vos_to_json_conf);

        if (!export_historic || !export_historic.exported_data) {
            ConsoleHandler.error('No exported data found for DashboardBuilderComponent');
            this.snotify.error(this.label('do_copy_dashboard.no_exported_data_found'));
            return;
        }

        await navigator.clipboard.writeText(export_historic.exported_data);
    }

    public async switch_hide_navigation(page: DashboardPageVO) {
        page.hide_navigation = !page.hide_navigation;
        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    public select_page(page: DashboardPageVO) {
        DashboardHistoryController.select_page(
            this.get_dashboard_page,
            page,
            this.add_page_history,
            this.set_dashboard_page,
        );
    }

    public set_dashboard_page(page: DashboardPageVO) {
        this.vuexAct(reflect<this>().set_dashboard_page, page);
    }

    public select_previous_page() {
        DashboardHistoryController.select_previous_page(
            this.get_page_history,
            this.set_dashboard_page,
            this.pop_page_history,
        );
    }

    // public select_page_clear_navigation(page: DashboardPageVO) {
    //     this.set_page_history([]);
    //     this.set_dashboard_page(page);
    // }


    /**
     * init_dashboard_tab
     *  - Initialize the dashboard tab to show in case when the dashboard is loaded or changed
     */
    public init_dashboard_tab() {

        // On doit d'abord mettre à jour les droits d'accès aux onglets en fonction des droits et de la configuration du DBB
        if (this.validite_onglets[this.selected_onglet]) {
            return; // Si l'onglet sélectionné est valide, on ne change rien
        }

        // Sinon si on a un dashboard, on cherche le premier onglet valide
        if (!this.dashboard) {
            return;
        }

        // On cherche le premier onglet valide
        for (const onglet of DashboardBuilderComponent.ALL_DBB_ONGLETS) {
            if (this.validite_onglets[onglet]) {
                this.selected_onglet = onglet;
                break;
            }
        }
    }

    public async create_new_dashboard() {
        const new_db = new (ModuleTableController.vo_constructor_by_vo_type[DashboardVO.API_TYPE_ID])() as DashboardVO; // On passe par le moduletablecontroller comme ça on a les inits par défaut des champs aussi

        await ModuleDAO.instance.insertOrUpdateVO(new_db);

        if (!new_db.id) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            return;
        }

        this.goto_dashboard_id(new_db.id);
    }

    public async switch_group_filters(page: DashboardPageVO) {
        page.group_filters = !page.group_filters;

        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    public async switch_collapse_filters(page: DashboardPageVO) {
        page.collapse_filters = !page.collapse_filters;

        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    public async confirm_delete_dashboard() {
        if (!this.dashboard) {
            return;
        }

        const self = this;
        if (this.dashboards.length <= 1) {
            self.snotify.error(self.label('DashboardBuilderComponent.delete_dashboard.cannot_delete_master_dashboard'));
            return;
        }

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DashboardBuilderComponent.delete_dashboard.confirmation.body'), self.label('DashboardBuilderComponent.delete_dashboard.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('DashboardBuilderComponent.delete_dashboard.start'));

                        await ModuleDAO.instance.deleteVOs([self.dashboard]);
                        self.dashboards = self.dashboards.filter((p) => p.id != self.dashboard.id);
                        self.dashboard = self.dashboards[0];

                        self.snotify.success(self.label('DashboardBuilderComponent.delete_dashboard.ok'));
                    },
                    bold: false,
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    },
                },
            ],
        });
    }

    public async confirm_delete_page(page: DashboardPageVO) {

        if ((!page) || (!this.get_dashboard_page) || (!this.dashboard) || (!this.get_dashboard_pages) || (!this.get_dashboard_pages.length)) {
            return;
        }

        const self = this;
        if (this.get_dashboard_pages.length <= 1) {
            self.snotify.error(self.label('DashboardBuilderComponent.delete_page.cannot_delete_master_page'));
            return;
        }

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DashboardBuilderComponent.delete_page.confirmation.body'), self.label('DashboardBuilderComponent.delete_page.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('DashboardBuilderComponent.delete_page.start'));

                        await ModuleDAO.instance.deleteVOs([page]);

                        self.snotify.success(self.label('DashboardBuilderComponent.delete_page.ok'));
                    },
                    bold: false,
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    },
                },
            ],
        });
    }

    /**
     * select_configuration_tab
     * - Set the active tab by the given tab name
     *
     * @param {string} activate_tab
     * @returns {void}
     */
    public select_configuration_tab(activate_tab: string): void {

        if (!activate_tab) {
            return;
        }

        this.show_shared_filters = false;
        this.show_select_vos = false;
        this.show_build_page = false;
        this.show_menu_conf = false;

        switch (activate_tab) {
            case 'shared_filters':
                this.show_shared_filters = true;
                break;
            case 'select_vos':
                this.show_select_vos = true;
                break;
            case 'menu_conf':
                this.show_menu_conf = true;
                break;
            case 'build_page':
                this.show_build_page = true;
                break;
        }
    }

    public select_vos() {
        this.select_configuration_tab('select_vos');
    }

    public build_page() {
        this.select_configuration_tab('build_page');
    }

    public menu_conf() {
        this.select_configuration_tab('menu_conf');
    }

    public select_shared_filters() {
        this.select_configuration_tab('shared_filters');
    }

    public async mounted() {
        const self = this;
        await navigator.permissions.query({ name: "clipboard-write" as any }).then((result) => {
            if (result.state == "granted" || result.state == "prompt") {
                self.can_use_clipboard = true;
            }
        });

        const body = document.getElementById('page-top');

        if (body) {
            body.classList.add("sidenav-toggled");
        }
    }


    public reverse_collapse_fields_wrapper() {
        this.collapsed_fields_wrapper = !this.collapsed_fields_wrapper;
    }
    public reverse_collapse_fields_2_wrapper() {
        this.collapsed_fields_wrapper_2 = !this.collapsed_fields_wrapper_2;
    }

    public async init_all_valid_tables() {

        // On charge la conf pour les rôles du user
        const valid_vo_types: string[] = await ModuleDashboardBuilder.getInstance().get_all_valid_api_type_ids();

        if (!valid_vo_types || !valid_vo_types.length) {
            this.all_tables_by_table_name = {};
        }

        const all_tables_by_table_name = {};
        for (const i in valid_vo_types) {
            const table_name = valid_vo_types[i];
            all_tables_by_table_name[table_name] = ModuleTableController.module_tables_by_vo_type[table_name];
        }
        this.all_tables_by_table_name = all_tables_by_table_name;
    }
}
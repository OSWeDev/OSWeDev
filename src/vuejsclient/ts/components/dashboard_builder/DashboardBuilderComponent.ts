import Component from 'vue-class-component';
import { Prop, Provide, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import DashboardBuilderController from '../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardBuilderBoardManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardBuilderBoardManager';
import DashboardPageVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardPageWidgetVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import DashboardVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardGraphVORefVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SharedFiltersVO from '../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import ModuleDataExport from '../../../../shared/modules/DataExport/ModuleDataExport';
import ExportVOsToJSONConfVO from '../../../../shared/modules/DataExport/vos/ExportVOsToJSONConfVO';
import ExportVOsToJSONHistoricVO from '../../../../shared/modules/DataExport/vos/ExportVOsToJSONHistoricVO';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import ModuleEnvParam from '../../../../shared/modules/EnvParam/ModuleEnvParam';
import EnvParamsVO from '../../../../shared/modules/EnvParam/vos/EnvParamsVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ObjectHandler, { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueAppController from '../../../VueAppController';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../VueComponentBase';
import ModuleTablesComponent from '../module_tables/ModuleTablesComponent';
import './DashboardBuilderComponent.scss';
import DashboardBuilderBoardComponent from './board/DashboardBuilderBoardComponent';
import CrudDBLinkComponent from './crud_db_link/CrudDBLinkComponent';
import DroppableVoFieldsComponent from './droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDroppableVoFieldsAction } from './droppable_vo_fields/DroppableVoFieldsStore';
import DashboardMenuConfComponent from './menu_conf/DashboardMenuConfComponent';
import DashboardPageStore from './page/DashboardPageStore';
import DashboardSharedFiltersComponent from './shared_filters/DashboardSharedFiltersComponent';
import TablesGraphComponent from './tables_graph/TablesGraphComponent';
import MaxGraphMapper from './tables_graph/graph_mapper/MaxGraphMapper';
import DashboardBuilderWidgetsComponent from './widgets/DashboardBuilderWidgetsComponent';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';
import IExportableWidgetOptions from './widgets/IExportableWidgetOptions';

@Component({
    template: require('./DashboardBuilderComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Droppablevofieldscomponent: DroppableVoFieldsComponent,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
        Tablesgraphcomponent: TablesGraphComponent,
        Dashboardmenuconfcomponent: DashboardMenuConfComponent,
        Dashboardsharedfilterscomponent: DashboardSharedFiltersComponent,
        Moduletablescomponent: ModuleTablesComponent,
        Cruddblinkcomponent: CrudDBLinkComponent,
    },
})
export default class DashboardBuilderComponent extends VueComponentBase {


    @Prop({ default: null })
    private readonly dashboard_id: string;

    @Prop({ default: null })
    private readonly dashboard_vo_action: string;

    @Prop({ default: null })
    private readonly dashboard_vo_id: string;

    @Prop({ default: null })
    private readonly api_type_id_action: string;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    // namespace dynamique
    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Provide('storeNamespace')
    private readonly storeNamespace = `dashboardStore_${DashboardPageStore.__UID++}`;

    private dashboards: DashboardVO[] = [];
    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null; // The current page

    private show_shared_filters: boolean = false;
    private show_build_page: boolean = false;
    private show_select_vos: boolean = true;
    private show_menu_conf: boolean = false;

    private POLICY_DBB_ACCESS_ONGLET_TABLE: boolean = false;
    private POLICY_DBB_ACCESS_ONGLET_WIDGETS: boolean = false;
    private POLICY_DBB_ACCESS_ONGLET_MENUS: boolean = false;
    private POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES: boolean = false;
    private POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH: boolean = false;
    private POLICY_DBB_CAN_EXPORT_IMPORT_JSON: boolean = false;
    private POLICY_DBB_CAN_CREATE_NEW_DB: boolean = false;
    private POLICY_DBB_CAN_DELETE_DB: boolean = false;
    private POLICY_DBB_CAN_SWITCH_DB: boolean = false;
    private POLICY_DBB_CAN_EDIT_PAGES: boolean = false;

    private selected_widget: DashboardPageWidgetVO = null;

    private collapsed_fields_wrapper: boolean = true;
    private collapsed_fields_wrapper_2: boolean = true;

    private can_use_clipboard: boolean = false;

    private export_vos_to_json_conf: ExportVOsToJSONConfVO = null;

    private all_tables_by_table_name: { [table_name: string]: ModuleTableVO } = {};

    private has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS: boolean = null;
    private use_new_export_vos_to_json_confs_for_dbb: boolean = null;

    private throttle_on_dashboard_loaded = ThrottleHelper.declare_throttle_without_args(
        'DashboardBuilderComponent.throttle_on_dashboard_loaded',
        this.on_dashboard_loaded, 50);

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

    // get fields_by_table_name_and_field_name(): { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } } {
    //     return ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name;
    // }

    // get tables_by_table_name(): { [table_name: string]: ModuleTableVO } {
    //     return ModuleTableController.module_tables_by_vo_type;
    // }

    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }


    get can_build_page() {
        return !!(this.get_dashboard_api_type_ids && this.get_dashboard_api_type_ids.length);
    }
    get dashboards_options() {

        if (!this.dashboards) {
            return [];
        }

        return this.dashboards;
    }

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet<DashboardPageVO[]>(reflect<this>().get_page_history);
    }

    get get_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet<{ [vo_type: string]: { [field_id: string]: boolean } }>(reflect<this>().get_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet<{ current_dashboard_id: number, previous_dashboard_id: number }>(reflect<this>().get_dashboard_navigation_history);
    }


    @Watch('page')
    private onchange_page() {
        this.select_widget(null);

        if (!this.page) {
            return;
        }

        this.loading = false;
    }

    @Watch("dashboard_id")
    private async onchange_dashboard_id() {
        this.loading = true;

        // Load all the dashboards
        this.dashboards = await this.load_all_dashboards();

        if (!this.dashboard_id) {
            await this.init_dashboard();
            await this.init_api_type_ids_and_discarded_field_paths();
            this.init_dashboard_tab();
            return;
        }

        // The current dashboard (should have been loaded in cache previously)
        this.dashboard = await DashboardVOManager.find_dashboard_by_id(
            parseInt(this.dashboard_id),
        );
        this.throttle_on_dashboard_loaded();
    }

    @Watch('dashboard')
    private async onchange_dashboard() {
        this.loading = true;

        if (this.dashboard?.id) {
            // Update the dashboard navigation history
            DashboardVOManager.update_dashboard_navigation_history(
                this.dashboard.id,
                this.get_dashboard_navigation_history,
                this.set_dashboard_navigation_history,
            );

            this.$router.push({
                name: 'DashboardBuilder_id',
                params: {
                    dashboard_id: this.dashboard.id.toString(),
                },
            });
        }

        this.throttle_on_dashboard_loaded();
    }

    public set_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }): void {
        this.vuexAct(reflect<this>().set_discarded_field_paths, discarded_field_paths);
    }


    public set_dashboard_api_type_ids(dashboard_api_type_ids: string[]): void {
        this.vuexAct(reflect<this>().set_dashboard_api_type_ids, dashboard_api_type_ids);
    }


    public set_page_widgets_components_by_pwid(page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }): void {
        this.vuexAct(reflect<this>().set_page_widgets_components_by_pwid, page_widgets_components_by_pwid);
    }


    public set_page_widgets(page_widgets: DashboardPageWidgetVO[]): void {
        this.vuexAct(reflect<this>().set_page_widgets, page_widgets);
    }


    public set_page_widget(page_widget: DashboardPageWidgetVO): void {
        this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }


    public delete_page_widget(page_widget: DashboardPageWidgetVO): void {
        this.vuexAct(reflect<this>().delete_page_widget, page_widget);
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

    // registre/déréf module
    public async created() {
        const instance = new DashboardPageStore();
        this.$store.registerModule(this.storeNamespace, instance);

        await all_promises([
            (async () => {
                this.POLICY_DBB_ACCESS_ONGLET_TABLE = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE);
            })(),
            (async () => {
                this.POLICY_DBB_ACCESS_ONGLET_WIDGETS = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_WIDGETS);
            })(),
            (async () => {
                this.POLICY_DBB_ACCESS_ONGLET_MENUS = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_MENUS);
            })(),
            (async () => {
                this.POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_FILTRES_PARTAGES);
            })(),
            (async () => {
                this.POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_ACCESS_ONGLET_TABLE_TABLES_GRAPH);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_EXPORT_IMPORT_JSON = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_EXPORT_IMPORT_JSON);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_CREATE_NEW_DB = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_CREATE_NEW_DB);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_DELETE_DB = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_DELETE_DB);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_SWITCH_DB = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_SWITCH_DB);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_EDIT_PAGES = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_EDIT_PAGES);
            })(),
            this.init_all_valid_tables(),
        ]);

        // Ne pas mettre en immediate true, le storeNamespace n'est pas encore créé
        this.onchange_dashboard_id();
    }

    // Accès dynamiques Vuex
    private vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    private vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    private dashboard_label(dashboard: DashboardVO): string {
        if ((dashboard == null) || (typeof dashboard == 'undefined')) {
            return '';
        }

        return dashboard.id + ' | ' + this.t(dashboard.title);
    }

    private async update_layout_widget(widget: DashboardPageWidgetVO) {
        if ((!this.$refs) || (!this.$refs['Dashboardbuilderboardcomponent'])) {
            return;
        }

        await ((this.$refs['Dashboardbuilderboardcomponent']) as DashboardBuilderBoardComponent).update_layout_widget(widget);
    }

    private async paste_dashboard(import_on_vo: DashboardVO = null) {

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


                    if (this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS == null) {
                        this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS = await ModuleAccessPolicy.getInstance().testAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS);
                    }

                    if (this.use_new_export_vos_to_json_confs_for_dbb == null) {
                        this.use_new_export_vos_to_json_confs_for_dbb = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS ? await ModuleEnvParam.getInstance().get_env_param_value_as_boolean(field_names<EnvParamsVO>().use_new_export_vos_to_json_confs_for_dbb) : false;
                    }

                    const use_new_export_system: boolean = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS && this.use_new_export_vos_to_json_confs_for_dbb;

                    if (use_new_export_system) {

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

                        self.loading = true;

                        self.dashboards = await self.load_all_dashboards(
                            { refresh: true },
                        );

                        self.throttle_on_dashboard_loaded();

                        // On crée des trads, on les recharge
                        await LocaleManager.get_all_flat_locale_translations(true);

                        if ((!import_on_vo) && new_db) {
                            // on récupère le nouveau db
                            self.dashboard = new_db as DashboardVO;
                        }
                        self.loading = false;

                    } else {

                        if ((!!import_on_vo) && (import_on_vo.id)) {
                            const old_pages = self.pages = await this.load_dashboard_pages_by_dashboard_id(
                                self.dashboard.id,
                                { refresh: true },
                            );

                            await ModuleDAO.instance.deleteVOs(
                                old_pages,
                            );
                        }

                        const imported_datas = await ModuleDataImport.getInstance().importJSON(text, import_on_vo);

                        self.loading = true;

                        self.dashboards = await self.load_all_dashboards(
                            { refresh: true },
                        );

                        self.throttle_on_dashboard_loaded();

                        // On crée des trads, on les recharge
                        await LocaleManager.get_all_flat_locale_translations(true);

                        if ((!import_on_vo) && imported_datas && imported_datas.length) {
                            // on récupère le nouveau db
                            const new_db = imported_datas.find((i) => i._type == DashboardVO.API_TYPE_ID);
                            self.dashboard = new_db ? new_db as DashboardVO : self.dashboard;
                        }
                        self.loading = false;
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

    private async copy_dashboard() {

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

    private async move_page_left(page: DashboardPageVO, page_i: number): Promise<void> {
        if ((!this.pages) || (!page_i) || (!this.pages[page_i - 1])) {
            return;
        }

        this.pages[page_i] = this.pages[page_i - 1];
        this.pages[page_i - 1] = page;

        for (const i in this.pages) {
            this.pages[i].weight = parseInt(i);
        }

        await this.save_page_move();
    }

    private async move_page_right(page: DashboardPageVO, page_i: number): Promise<void> {
        if ((!this.pages) || (page_i >= (this.pages.length - 1)) || (!this.pages[page_i + 1])) {
            return;
        }

        this.pages[page_i] = this.pages[page_i + 1];
        this.pages[page_i + 1] = page;

        for (const i in this.pages) {
            this.pages[i].weight = parseInt(i);
        }

        await this.save_page_move();
    }

    private async save_page_move() {
        const self = this;
        self.snotify.async(self.label('move_page.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    await ModuleDAO.instance.insertOrUpdateVOs(self.pages);

                    self.pages = await this.load_dashboard_pages_by_dashboard_id(
                        self.dashboard.id,
                        { refresh: true },
                    );

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


    private sort_pages(page_a: DashboardPageVO, page_b: DashboardPageVO): number {
        return (page_a.weight == page_b.weight) ? page_a.id - page_b.id : page_a.weight - page_b.weight;
    }

    private async do_copy_dashboard() {

        if (!this.dashboard) {
            return null;
        }

        /**
         * On exporte le DB, les pages, les widgets, DashboardGraphVORefVO et les trads associées (dont TableWidgetOptionsComponent et VOFieldRefVO)
         */

        // TEMP DELETE me quand migration de la copy de DB terminée :
        // On testaccess avant de demander l'env param, sinon on se fait déco

        if (this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS == null) {
            this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS = await ModuleAccessPolicy.getInstance().testAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS);
        }

        if (this.use_new_export_vos_to_json_confs_for_dbb == null) {
            this.use_new_export_vos_to_json_confs_for_dbb = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS ? await ModuleEnvParam.getInstance().get_env_param_value_as_boolean(field_names<EnvParamsVO>().use_new_export_vos_to_json_confs_for_dbb) : false;
        }

        const use_new_export_system: boolean = this.has_access_to_POLICY_BO_MODULES_MANAGMENT_ACCESS && this.use_new_export_vos_to_json_confs_for_dbb;

        if (use_new_export_system) {

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
        } else {
            /**
             * On exporte le DB, les pages, les widgets, DashboardGraphVORefVO et les trads associées (dont TableWidgetOptionsComponent et VOFieldRefVO)
             *  attention sur les trads on colle des codes de remplacement pour les ids qui auront été insérés après import
             */
            let export_vos: IDistantVOBase[] = [];
            const db = this.dashboard;

            export_vos.push(ModuleTableController.translate_vos_to_api(db));

            /**
             * TODO FIXME
             * On doit généraliser l'export import de datas sur la base suivante :
             *  - On prend un VO à exporter, et on exporte tous ses champs
             *      - en particulier, si un champs est de type translatable_string, on exporte pas le code_text qui sera déduit à la reconstruction, mais on exporte les trads dans toutes les langues de l'appli :
             *          {[code_langue:string]:translation:string}
             *          à la reconstruction si la langue existe pas osef
             *      - en particulier si un champs est une foreign key, on exporte l'id + les champs uniques, de manière à pouvoir faire un double check sur la nouvelle appli, et si on retrouve pas les correspondances de champs uniques, on peut chercher et si on trouve, on corrige l'id
             *          par contre si pas de champs unique c'est l'id point barre.
             *          On peut aussi définir lors de l'export que ce type de données doit aussi être exporté, par ce qu'il sera alors créé en même temps, et donc on l'exporte et on garde une ref interne à l'export (un id qui se mettra à jour à la création)
             *          Pour définir les liaisons qu'on exporte en plus du VO de base, on sélectionne les fields, et on les met dans un tableau de conf. si on tombe sur un champs du tableau, on exporte la cible aussi
             *          Valable pour les num ref ranges
             *      - en particulier, si on a des vos qui références ce vo, alors puisqu'il s'agit d'une création dans le nouvel environnement, par défaut, on exporte aussi ces vos et on stocke la ref id en mode dynamique
             *          exemple des pages de db sur les dbs. on veut aussi exporter les pages, et les page_widgets qui font référence à la page.
             *          On peut vouloir ignorer peut-etre un type de contenu lié qui fait référence. on rajoute le champs de ref dans les champs ignoré,
             * et donc en param on a le vo à exporter, les fields qu'on veut suivre (quelle que soit la profondeur) et les fields qu'on veut pas suivre.
             * idéalement faudrait un outil de visualisation des vos qui sont dans l'export pour être sûr de ce qu'on embarque (au moins des stats, X vos de ce types, X trads, ...)
             *
             */

            const pages = await this.load_dashboard_pages_by_dashboard_id(
                this.dashboard.id,
                { refresh: true },
            );

            if (pages && pages.length) {
                export_vos = export_vos.concat(pages.map((p) => ModuleTableController.translate_vos_to_api(p)));
            }

            const graphvorefs = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq(field_names<DashboardGraphVORefVO>().dashboard_id, this.dashboard.id).select_vos<DashboardGraphVORefVO>();
            if (graphvorefs && graphvorefs.length) {
                export_vos = export_vos.concat(graphvorefs.map((p) => ModuleTableController.translate_vos_to_api(p)));
            }

            let page_widgets: DashboardPageWidgetVO[] = null;
            for (const i in pages) {
                const page = pages[i];

                const this_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_num_eq(field_names<DashboardPageWidgetVO>().page_id, page.id).select_vos<DashboardPageWidgetVO>();
                if (this_page_widgets && this_page_widgets.length) {
                    export_vos = export_vos.concat(this_page_widgets.map((p) => ModuleTableController.translate_vos_to_api(p)));
                    page_widgets = page_widgets ? page_widgets.concat(this_page_widgets) : this_page_widgets;
                }
            }

            const page_widgets_options: { [page_widget_id: number]: IExportableWidgetOptions } = {};
            for (const i in page_widgets) {
                const page_widget = page_widgets[i];

                if (DashboardBuilderWidgetsController.getInstance().widgets_options_constructor_by_widget_id[page_widget.widget_id]) {
                    const options = Object.assign(
                        DashboardBuilderWidgetsController.getInstance().widgets_options_constructor_by_widget_id[page_widget.widget_id](),
                        ObjectHandler.try_get_json(page_widget.json_options),
                    );
                    if (options) {
                        page_widgets_options[page_widget.id] = options as IExportableWidgetOptions;
                    }
                }
            }

            const translation_codes: TranslatableTextVO[] = [];
            const translations: TranslationVO[] = [];
            await this.get_exportable_translations(
                translation_codes,
                translations,
                db,
                pages,
                page_widgets,
                page_widgets_options,
            );
            if (translation_codes && translation_codes.length) {
                export_vos = export_vos.concat(translation_codes.map((p) => ModuleTableController.translate_vos_to_api(p)));
            }
            if (translations && translations.length) {
                export_vos = export_vos.concat(translations.map((p) => ModuleTableController.translate_vos_to_api(p)));
            }

            const text: string = JSON.stringify(export_vos);
            await navigator.clipboard.writeText(text);
        }
    }

    private async get_exportable_translations(
        translation_codes: TranslatableTextVO[],
        translations: TranslationVO[],
        db: DashboardVO,
        pages: DashboardPageVO[],
        page_widgets: DashboardPageWidgetVO[],
        page_widgets_options: { [page_widget_id: number]: IExportableWidgetOptions },
    ) {
        const langs: LangVO[] = await ModuleTranslation.getInstance().getLangs();

        const promises = [];

        // trad du db
        if (db && db.title) {
            promises.push(this.get_exportable_translation(
                langs,
                translation_codes,
                translations,
                db.title, DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + '{{IMPORT:' + db._type + ':' + db.id + '}}' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION),
            );
        }

        // trads des pages
        for (const i in pages) {
            const page = pages[i];

            if (page && page.titre_page) {
                promises.push(this.get_exportable_translation(
                    langs,
                    translation_codes,
                    translations,
                    page.titre_page,
                    DashboardBuilderController.PAGE_NAME_CODE_PREFIX + '{{IMPORT:' + page._type + ':' + page.id + '}}' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION));
            }
        }

        // widgets
        for (const i in page_widgets) {
            const page_widget = page_widgets[i];

            if (page_widget && page_widget.translatable_name_code_text) {
                promises.push(this.get_exportable_translation(
                    langs,
                    translation_codes,
                    translations,
                    page_widget.translatable_name_code_text,
                    DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + '{{IMPORT:' + page_widget._type + ':' + page_widget.id + '}}'));
            }

            if (page_widgets_options && page_widgets_options[page_widget.id]) {
                const exportable_translations = await page_widgets_options[page_widget.id].get_all_exportable_name_code_and_translation(page_widget.page_id, page_widget.id);
                for (const current_code_text in exportable_translations) {
                    const exportable_code_text = exportable_translations[current_code_text];
                    promises.push(this.get_exportable_translation(
                        langs,
                        translation_codes,
                        translations,
                        current_code_text,
                        exportable_code_text));
                }
            }

            /**
             * TableColumnDescVO, VOFieldRefVO
             */
            const page_widget_trads: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', [
                DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget.id + '.',
                DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget.id + '.',
            ]).select_vos<TranslatableTextVO>();

            for (const j in page_widget_trads) {
                const page_widget_trad = page_widget_trads[j];

                let code = page_widget_trad.code_text;
                if (code.indexOf(DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget.id) == 0) {
                    code =
                        DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX +
                        '{{IMPORT:' + page_widget._type + ':' + page_widget.id + '}}' +
                        code.substring((DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget.id).length, code.length);
                } else if (code.indexOf(DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget.id) == 0) {
                    code =
                        DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX +
                        '{{IMPORT:' + page_widget._type + ':' + page_widget.id + '}}' +
                        code.substring((DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget.id).length, code.length);
                }

                promises.push(this.get_exportable_translation(
                    langs,
                    translation_codes,
                    translations,
                    page_widget_trad.code_text,
                    code));
            }
        }

        await all_promises(promises);
    }

    private async get_exportable_translation(
        langs: LangVO[],
        translation_codes: TranslatableTextVO[],
        translations: TranslationVO[],
        initial_code: string,
        exportable_code: string,
    ) {
        const translatable_db = await ModuleTranslation.getInstance().getTranslatableText(initial_code);
        if (translatable_db) {
            translatable_db.code_text = exportable_code;
            translation_codes.push(translatable_db);

            for (const i in langs) {
                const lang = langs[i];

                const translation_db = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable_db.id);
                if (translation_db) {
                    translations.push(translation_db);
                }
            }
        }
    }

    private select_widget(page_widget) {
        this.selected_widget = page_widget;

        if (!this.selected_widget) {
            this.set_selected_fields({});
            return;
        }

        const name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.selected_widget.widget_id].name;
        const get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(page_widget) : {});
    }

    private async switch_hide_navigation(page: DashboardPageVO) {
        page.hide_navigation = !page.hide_navigation;
        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    /**
     * load_all_dashboards
     * - Load all the dashboards and sort them by weight
     *
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    private async load_all_dashboards(
        options?: { refresh?: boolean },
    ): Promise<DashboardVO[]> {

        const dashboards = await DashboardVOManager.find_all_dashboards(
            null,
            {
                sorts: [
                    new SortByVO(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().weight, true),
                    new SortByVO(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().id, true),
                ],
            },
            options,
        );

        return dashboards;
    }

    /**
     * load_dashboard_pages_by_dashboard_id
     * - Load the dashboard pages by dashboard id and sort them by weight
     *
     * @param {number} [dashboard_id]
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    private async load_dashboard_pages_by_dashboard_id(
        dashboard_id: number,
        options?: { refresh?: boolean },
    ): Promise<DashboardPageVO[]> {

        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_id(
            dashboard_id,
            {
                sorts: [
                    new SortByVO(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().weight, true),
                    new SortByVO(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().id, true),
                ],
            },
            options,
        );

        return dashboard_pages;
    }

    private async on_dashboard_loaded() {

        if (!this.dashboard) {
            await this.init_dashboard();
            await this.init_api_type_ids_and_discarded_field_paths();
            this.init_dashboard_tab();
            return;
        }

        this.set_page_widgets_components_by_pwid({});
        await all_promises([
            this.init_api_type_ids_and_discarded_field_paths(),
            (async () => {
                this.pages = await this.load_dashboard_pages_by_dashboard_id(
                    this.dashboard.id,
                );
            })(),
        ]);
        this.init_dashboard_tab();

        if (!this.pages) {
            await this.create_dashboard_page();
        }

        const page_widgets: DashboardPageWidgetVO[] = await this.load_page_widgets_by_page_ids(
            this.pages.map((p) => p.id),
        );

        this.set_page_widgets(page_widgets);

        const shared_filters: SharedFiltersVO[] = await DashboardVOManager.load_shared_filters_with_dashboard_id(
            this.dashboard.id,
        );

        this.add_shared_filters_to_map(shared_filters);

        if (page_widgets?.length > 0) {
            const custom_filters: { [name: string]: boolean } = {};

            for (const i in page_widgets) {
                const page_widget = page_widgets[i];
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

        WeightHandler.getInstance().sortByWeight(this.pages);

        this.page = this.pages[0];
    }

    private removed_widget_from_page(page_widget: DashboardPageWidgetVO) {
        this.delete_page_widget(page_widget);
    }

    private added_widget_to_page(page_widget: DashboardPageWidgetVO) {
        this.set_page_widget(page_widget);
    }

    private close_widget_options() {
        this.select_widget(null);
    }

    private select_page(page: DashboardPageVO) {
        this.add_page_history(this.page);
        this.page = page;
    }

    private select_previous_page() {
        this.page = this.get_page_history[this.get_page_history.length - 1];
        this.pop_page_history(null);
    }

    private select_page_clear_navigation(page: DashboardPageVO) {
        this.set_page_history([]);


        this.page = page;
    }

    /**
     * load_page_widgets_by_page_ids
     *
     * @param {number[]} page_ids
     * @returns {Promise<DashboardPageWidgetVO[]>}
     */
    private async load_page_widgets_by_page_ids(page_ids: number[]): Promise<DashboardPageWidgetVO[]> {

        if (!(page_ids?.length > 0)) {
            return;
        }

        const page_widgets: DashboardPageWidgetVO[] = await DashboardPageWidgetVOManager.find_page_widgets_by_page_ids(
            page_ids,
        );

        this.set_page_widgets(page_widgets);

        return page_widgets;
    }


    private async create_dashboard_page() {

        if (!this.dashboard) {
            return;
        }

        const page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;
        page.weight = 0;
        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(page);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        page.id = insertOrDeleteQueryResult.id;

        this.pages = await this.load_dashboard_pages_by_dashboard_id(
            this.dashboard.id,
            { refresh: true },
        );

        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = page;
    }

    /**
     * init_dashboard
     * - Initialize the dashboard
     * - Create a new dashboard if none exists
     * - Create a new page if none exists
     *
     * @returns {Promise<void>}
     */
    private async init_dashboard(): Promise<void> {

        if (!(this.dashboards?.length > 0)) {
            this.dashboards = [];
            await this.create_new_dashboard();
            return;
        }

        this.dashboard = this.dashboards[0];

        this.pages = await this.load_dashboard_pages_by_dashboard_id(
            this.dashboard.id,
        );

        if (!this.pages) {
            await this.create_dashboard_page();
        } else {
            WeightHandler.getInstance().sortByWeight(this.pages);
            this.page = this.pages[0];
        }
    }

    private async init_api_type_ids_and_discarded_field_paths() {
        const { api_type_ids, discarded_field_paths } = await DashboardBuilderBoardManager.get_api_type_ids_and_discarded_field_paths(this.dashboard.id);
        this.set_dashboard_api_type_ids(api_type_ids);
        this.set_discarded_field_paths(discarded_field_paths);
    }

    /**
     * init_dashboard_tab
     *  - Initialize the dashboard tab to show in case when the dashboard is loaded or changed
     */
    private init_dashboard_tab() {
        this.show_build_page = this.can_build_page;
        this.show_select_vos = !this.show_build_page;
        this.show_shared_filters = false;
        this.show_menu_conf = false;
    }

    private async create_new_dashboard() {
        this.dashboard = new (ModuleTableController.vo_constructor_by_vo_type[DashboardVO.API_TYPE_ID])() as DashboardVO; // On passe par le moduletablecontroller comme ça on a les inits par défaut des champs aussi
        this.set_dashboard_api_type_ids([]);

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(
            this.dashboard,
        );

        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        this.dashboard = await DashboardVOManager.find_dashboard_by_id(
            insertOrDeleteQueryResult.id,
        );

        if ((!this.dashboard) || (!this.dashboard.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        // On crée la trad
        // dans la création par défaut on a un nouveau code, reste à enrigistrer la nouvelle trad
        const translation_code = new TranslatableTextVO();
        translation_code.code_text = this.dashboard.title;
        await ModuleDAO.getInstance().insertOrUpdateVO(translation_code);

        if (!translation_code.id) {
            ConsoleHandler.error('Error creating translation code for dashboard title');
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        if (!VueAppController.getInstance().data_user_lang?.id) {
            ConsoleHandler.error('User language ID not found');
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        const translation = new TranslationVO();
        translation.lang_id = VueAppController.getInstance().data_user_lang?.id;
        translation.text_id = translation_code.id;
        translation.translated = "Dashboard [" + this.dashboard.id + "]";
        await ModuleDAO.getInstance().insertOrUpdateVO(translation);

        // On crée la première page du dashboard
        await this.create_dashboard_page();
        const page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;

        this.dashboards.push(this.dashboard);
    }

    private async switch_group_filters(page: DashboardPageVO) {
        page.group_filters = !page.group_filters;

        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    private async switch_collapse_filters(page: DashboardPageVO) {
        page.collapse_filters = !page.collapse_filters;

        await ModuleDAO.instance.insertOrUpdateVO(page);
    }

    private async confirm_delete_dashboard() {
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

    private async confirm_delete_page(page: DashboardPageVO) {

        if ((!page) || (!this.page) || (!this.dashboard) || (!this.pages) || (!this.pages.length)) {
            return;
        }

        const self = this;
        if (this.pages.length <= 1) {
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
                        self.pages = self.pages.filter((p) => p.id != page.id);
                        if (self.page.id == page.id) {
                            self.page = self.pages[0];
                        }

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
    private select_configuration_tab(activate_tab: string): void {

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

    private select_vos() {
        this.select_configuration_tab('select_vos');
    }

    private build_page() {
        this.select_configuration_tab('build_page');
    }

    private menu_conf() {
        this.select_configuration_tab('menu_conf');
    }

    private select_shared_filters() {
        this.select_configuration_tab('shared_filters');
    }

    private async add_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            this.set_dashboard_api_type_ids([]);
        }
        if (this.get_dashboard_api_type_ids.indexOf(api_type_id) >= 0) {
            return;
        }
        const tmp = Array.from(this.get_dashboard_api_type_ids);
        tmp.push(api_type_id);
        this.set_dashboard_api_type_ids(tmp);
    }

    private async del_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            return;
        }
        this.set_dashboard_api_type_ids(this.get_dashboard_api_type_ids.filter((ati) => ati != api_type_id));
    }

    private async update_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
        this.set_discarded_field_paths(discarded_field_paths);
    }

    private async mounted() {
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

    private beforeDestroy() {
        const body = document.getElementById('page-top');

        if (body) {
            body.classList.remove("sidenav-toggled");
        }

        this.$store.unregisterModule(this.storeNamespace);
    }

    private reverse_collapse_fields_wrapper() {
        this.collapsed_fields_wrapper = !this.collapsed_fields_wrapper;
    }
    private reverse_collapse_fields_2_wrapper() {
        this.collapsed_fields_wrapper_2 = !this.collapsed_fields_wrapper_2;
    }

    private async setDiscardedField(table: string, field: string, new_discard: boolean) {

        // On utilise le add pour récupérer la table en base de données
        const table_vo_ref = await this.addTable(table);
        if (!table_vo_ref) {
            return;
        }

        if (!table_vo_ref.values_to_exclude) {
            table_vo_ref.values_to_exclude = [];
        }

        if (!table_vo_ref.values_to_exclude.find((e) => e == field)) {
            table_vo_ref.values_to_exclude.push(field);
        } else {
            table_vo_ref.values_to_exclude = table_vo_ref.values_to_exclude.filter((e) => e != field);
        }
        const update_res = await ModuleDAO.instance.insertOrUpdateVO(table_vo_ref);
        if (!update_res || !update_res.id) {
            ConsoleHandler.error('Impossible de mettre à jour le graphvoref');
            this.$snotify.error(this.label('TablesGraphEditFormComponent.switch_edge_acceptance.error'));
            return;
        }

        const new_descarded_field_paths = Object.assign({}, this.get_discarded_field_paths);
        if (new_discard) {
            if (!new_descarded_field_paths[table]) {
                new_descarded_field_paths[table] = {};
            }
            new_descarded_field_paths[table][field] = true;
        } else {
            if (new_descarded_field_paths[table]) {
                delete new_descarded_field_paths[table][field];
            }
        }
        this.set_discarded_field_paths(new_descarded_field_paths);
    }

    private async removeTable(table_name: string) {

        if ((!this.dashboard) || (!this.dashboard.id)) {
            return;
        }

        if (!table_name) {
            return;
        }

        try {
            await query(DashboardGraphVORefVO.API_TYPE_ID)
                .filter_by_id(this.dashboard.id, DashboardVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, table_name)
                .delete_vos();
        } catch (error) {
            ConsoleHandler.error('DashboardBuilderComponent.removeTable:' + error);
        }

        this.del_api_type_id(table_name);
    }

    private async addTable(table_name: string) {

        if ((!this.dashboard) || (!this.dashboard.id)) {
            return;
        }

        if (!table_name) {
            return;
        }

        let ref: DashboardGraphVORefVO = null;
        try {
            ref = await query(DashboardGraphVORefVO.API_TYPE_ID)
                .filter_by_id(this.dashboard.id, DashboardVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardGraphVORefVO>().vo_type, table_name)
                .select_vo<DashboardGraphVORefVO>();
            if (!!ref) {
                return ref;
            }

            ref = new DashboardGraphVORefVO();

            ref.x = 800;
            ref.y = 80;
            ref.width = MaxGraphMapper.default_width;
            ref.height = MaxGraphMapper.default_height;
            ref.vo_type = table_name;
            ref.dashboard_id = this.dashboard.id;
            await ModuleDAO.instance.insertOrUpdateVO(ref);

        } catch (error) {
            ConsoleHandler.error('DashboardBuilderComponent.addTable:' + error);
        }

        this.add_api_type_id(table_name);

        return ref;
    }

    private async init_all_valid_tables() {

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
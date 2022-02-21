import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardGraphVORefVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import TranslatableTextController from '../InlineTranslatableText/TranslatableTextController';
import VueComponentBase from '../VueComponentBase';
import DashboardBuilderBoardComponent from './board/DashboardBuilderBoardComponent';
import './DashboardBuilderComponent.scss';
import DroppableVosComponent from './droppable_vos/DroppableVosComponent';
import DroppableVoFieldsComponent from './droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDroppableVoFieldsAction } from './droppable_vo_fields/DroppableVoFieldsStore';
import DashboardMenuConfComponent from './menu_conf/DashboardMenuConfComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from './page/DashboardPageStore';
import TablesGraphComponent from './tables_graph/TablesGraphComponent';
import DashboardBuilderWidgetsComponent from './widgets/DashboardBuilderWidgetsComponent';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';

@Component({
    template: require('./DashboardBuilderComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Droppablevofieldscomponent: DroppableVoFieldsComponent,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
        Tablesgraphcomponent: TablesGraphComponent,
        Dashboardmenuconfcomponent: DashboardMenuConfComponent
    }
})
export default class DashboardBuilderComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard_id: number;

    @ModuleDashboardPageGetter
    private get_page_history: DashboardPageVO[];

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageAction
    private add_page_history: (page_history: DashboardPageVO) => void;
    @ModuleDashboardPageAction
    private set_page_history: (page_history: DashboardPageVO[]) => void;
    @ModuleDashboardPageAction
    private pop_page_history: (fk) => void;

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private dashboards: DashboardVO[] = [];
    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    private show_build_page: boolean = false;
    private show_select_vos: boolean = true;
    private show_menu_conf: boolean = false;

    private can_build_page: boolean = false;

    private selected_widget: DashboardPageWidgetVO = null;

    private collapsed_fields_wrapper: boolean = false;

    private can_use_clipboard: boolean = false;

    private async paste_dashboard(import_on_vo: DashboardVO = null) {
        /**
         * On récupère le contenu du presse-papier, et on checke qu'on a bien un db dedans
         *  si oui on insère tous les éléments et on garde la trace des liaisons
         *  si on se retrouve dans une impasse on invalide tout l'import
         */
        navigator.clipboard.readText().then(async (text: string) => {
            await ModuleDataImport.getInstance().importJSON(text, import_on_vo);
        });
    }

    private async copy_dashboard() {

        if (!this.dashboard) {
            return null;
        }

        /**
         * On exporte le DB, les pages, les widgets, DashboardGraphVORefVO, VOFieldRefVO
         */
        let export_vos: IDistantVOBase[] = [];
        let db_table = VOsTypesManager.getInstance().moduleTables_by_voType[DashboardVO.API_TYPE_ID];
        export_vos.push(db_table.get_api_version(this.dashboard));

        let pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        let page_table = VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageVO.API_TYPE_ID];
        if (pages && pages.length) {
            export_vos = export_vos.concat(pages.map((p) => page_table.get_api_version(p)));
        }

        let graphvorefs = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardGraphVORefVO>(DashboardGraphVORefVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        let graphvoref_table = VOsTypesManager.getInstance().moduleTables_by_voType[DashboardGraphVORefVO.API_TYPE_ID];
        if (graphvorefs && graphvorefs.length) {
            export_vos = export_vos.concat(graphvorefs.map((p) => graphvoref_table.get_api_version(p)));
        }

        let pagewidget_table = VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageWidgetVO.API_TYPE_ID];
        for (let i in pages) {
            let page = pages[i];

            let page_widgets = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageWidgetVO>(DashboardPageWidgetVO.API_TYPE_ID, 'page_id', [page.id]);
            if (page_widgets && page_widgets.length) {
                export_vos = export_vos.concat(page_widgets.map((p) => pagewidget_table.get_api_version(p)));
            }
        }

        let api_vos: IDistantVOBase[] = [];

        let text: string = JSON.stringify(api_vos);
        navigator.clipboard.writeText(newClip).then(function () {
            /* clipboard successfully set */
        }, function () {
            /* clipboard write failed */
        });

        /**
         * On récupère le contenu du presse-papier, et on checke qu'on a bien un db dedans
         *  si oui on insère tous les éléments et on garde la trace des liaisons
         *  si on se retrouve dans une impasse on invalide tout l'import
         */
        navigator.clipboard.readText().then(async (text: string) => {
            await ModuleDataImport.getInstance().importJSON(text, import_on_vo);
        });
    }

    private select_widget(page_widget) {
        this.selected_widget = page_widget;

        if (!this.selected_widget) {
            this.set_selected_fields({});
            return;
        }

        let name = VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.selected_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(page_widget) : {});
    }

    private async switch_hide_navigation(page: DashboardPageVO) {
        page.hide_navigation = !page.hide_navigation;
        await ModuleDAO.getInstance().insertOrUpdateVO(page);
    }

    @Watch("dashboard_id", { immediate: true })
    private async onchange_dashboard_id() {
        this.loading = true;

        this.dashboards = await ModuleDAO.getInstance().getVos<DashboardVO>(DashboardVO.API_TYPE_ID);
        if (!this.dashboard_id) {
            await this.init_dashboard();
            this.can_build_page = !!(this.dashboard.api_type_ids && this.dashboard.api_type_ids.length);
            this.show_build_page = this.can_build_page;
            this.show_select_vos = !this.show_build_page;
            this.show_menu_conf = false;
            this.loading = false;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);
        await this.on_load_dashboard();

        this.loading = false;
    }

    @Watch('dashboard')
    private async onchange_dashboard() {
        this.loading = true;
        await this.on_load_dashboard();
        this.loading = false;
    }

    private async on_load_dashboard() {
        if (!this.dashboard) {
            await this.init_dashboard();
            this.can_build_page = !!(this.dashboard.api_type_ids && this.dashboard.api_type_ids.length);
            this.show_build_page = this.can_build_page;
            this.show_select_vos = !this.show_build_page;
            this.show_menu_conf = false;
            this.loading = false;
            return;
        }

        this.can_build_page = !!(this.dashboard.api_type_ids && this.dashboard.api_type_ids.length);
        this.show_build_page = this.can_build_page;
        this.show_select_vos = !this.show_build_page;
        this.show_menu_conf = false;

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            await this.create_dashboard_page();
        }
        let page_widgets = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageWidgetVO>(DashboardPageWidgetVO.API_TYPE_ID, 'page_id', this.pages.map((p) => p.id));
        if (page_widgets && page_widgets.length) {
            let custom_filters: { [name: string]: boolean } = {};
            for (let i in page_widgets) {
                let page_widget = page_widgets[i];
                if (page_widget.json_options) {
                    let options = JSON.parse(page_widget.json_options);
                    if (options && options['custom_filter_name']) {
                        custom_filters[options['custom_filter_name']] = true;
                    }
                }
            }

            if (custom_filters && ObjectHandler.getInstance().hasAtLeastOneAttribute(custom_filters)) {
                this.set_custom_filters(Object.keys(custom_filters));
            }
        }
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];
    }

    private added_widget_to_page(page_widget: DashboardPageWidgetVO) {
        this.set_page_widget(page_widget);
    }

    private select_page(page: DashboardPageVO) {
        this.add_page_history(this.page);
        this.page = page;
    }

    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }

    private select_previous_page() {
        this.page = this.get_page_history[this.get_page_history.length - 1];
        this.pop_page_history(null);
    }

    private select_page_clear_navigation(page: DashboardPageVO) {
        this.set_page_history([]);
        this.page = page;
    }

    private async create_dashboard_page() {

        if (!this.dashboard) {
            return;
        }

        let page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;
        page.weight = 0;
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        page.id = insertOrDeleteQueryResult.id;

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = page;
    }

    private async init_dashboard() {

        if ((!this.dashboards) || (!this.dashboards.length)) {
            this.dashboards = [];
            await this.create_new_dashboard();
            return;
        }

        this.dashboard = this.dashboards[0];

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            await this.create_dashboard_page();
        } else {
            WeightHandler.getInstance().sortByWeight(this.pages);
            this.page = this.pages[0];
        }
    }

    get dashboard_name_code_text(): string {
        if (!this.dashboard) {
            return null;
        }

        return this.dashboard.translatable_name_code_text ? this.dashboard.translatable_name_code_text : null;
    }

    private async create_new_dashboard() {
        this.dashboard = new DashboardVO();
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.dashboard);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }
        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, insertOrDeleteQueryResult.id);
        if ((!this.dashboard) || (!this.dashboard.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        // On crée la trad
        let code_lang = LocaleManager.getInstance().getDefaultLocale();
        let code_text = this.dashboard.translatable_name_code_text;
        let translation = "Dashboard [" + this.dashboard.id + "]";
        await TranslatableTextController.getInstance().save_translation(code_lang, code_text, translation);

        // On crée la première page du dashboard
        await this.create_dashboard_page();
        let page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;

        this.dashboards.push(this.dashboard);
    }

    get dashboards_options() {

        if (!this.dashboards) {
            return [];
        }

        return this.dashboards;
    }

    private dashboard_label(dashboard: DashboardVO): string {
        if ((dashboard == null) || (typeof dashboard == 'undefined')) {
            return '';
        }

        return dashboard.id + ' | ' + this.t(dashboard.translatable_name_code_text);
    }

    get pages_name_code_text(): string[] {
        let res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (let i in this.pages) {
            let page = this.pages[i];

            res.push(page.translatable_name_code_text ? page.translatable_name_code_text : null);
        }

        return res;
    }

    private async confirm_delete_dashboard() {
        if (!this.dashboard) {
            return;
        }

        let self = this;
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

                        await ModuleDAO.getInstance().deleteVOs([self.dashboard]);
                        self.dashboards = self.dashboards.filter((p) => p.id != self.dashboard.id);
                        self.dashboard = self.dashboards[0];

                        self.snotify.success(self.label('DashboardBuilderComponent.delete_dashboard.ok'));
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    @Watch('page')
    private onchange_page() {
        this.select_widget(null);
    }

    private async confirm_delete_page(page: DashboardPageVO) {

        if ((!page) || (!this.page) || (!this.dashboard) || (!this.pages) || (!this.pages.length)) {
            return;
        }

        let self = this;
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

                        await ModuleDAO.getInstance().deleteVOs([page]);
                        self.pages = self.pages.filter((p) => p.id != page.id);
                        if (self.page.id == page.id) {
                            self.page = self.pages[0];
                        }

                        self.snotify.success(self.label('DashboardBuilderComponent.delete_page.ok'));
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private select_vos() {
        this.show_build_page = false;
        this.show_select_vos = true;
        this.show_menu_conf = false;
    }

    private build_page() {
        this.show_build_page = true;
        this.show_select_vos = false;
        this.show_menu_conf = false;
    }

    private menu_conf() {
        this.show_build_page = false;
        this.show_select_vos = false;
        this.show_menu_conf = true;
    }

    private async add_api_type_id(api_type_id: string) {
        if (!this.dashboard.api_type_ids) {
            this.dashboard.api_type_ids = [];
        }
        if (this.dashboard.api_type_ids.indexOf(api_type_id) >= 0) {
            return;
        }
        this.dashboard.api_type_ids.push(api_type_id);
        this.can_build_page = !!(this.dashboard.api_type_ids && this.dashboard.api_type_ids.length);
        await ModuleDAO.getInstance().insertOrUpdateVO(this.dashboard);
    }

    private async del_api_type_id(api_type_id: string) {
        if (!this.dashboard.api_type_ids) {
            return;
        }
        this.dashboard.api_type_ids = this.dashboard.api_type_ids.filter((ati) => ati != api_type_id);
        this.can_build_page = !!(this.dashboard.api_type_ids && this.dashboard.api_type_ids.length);
        await ModuleDAO.getInstance().insertOrUpdateVO(this.dashboard);
    }

    private mounted() {

        let self = this;
        navigator.permissions.query({ name: "clipboard-write" as any }).then((result) => {
            if (result.state == "granted" || result.state == "prompt") {
                self.can_use_clipboard = true;
            }
        });

        let body = document.getElementById('page-top');
        body.classList.add("sidenav-toggled");
    }

    private beforeDestroy() {
        let body = document.getElementById('page-top');
        body.classList.remove("sidenav-toggled");
    }

    private reverse_collapse_fields_wrapper() {
        this.collapsed_fields_wrapper = !this.collapsed_fields_wrapper;
    }
}
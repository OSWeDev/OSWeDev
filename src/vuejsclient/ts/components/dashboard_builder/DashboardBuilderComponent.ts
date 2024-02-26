import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardBuilderBoardManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardBuilderBoardManager';
import DashboardPageVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardPageWidgetVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import DashboardVOManager from '../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardGraphVORefVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SharedFiltersVO from '../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleTableVO from '../../../../shared/modules/ModuleTableVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueAppController from '../../../VueAppController';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import TranslatableTextController from '../InlineTranslatableText/TranslatableTextController';
import { ModuleTranslatableTextAction } from '../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../VueComponentBase';
import './DashboardBuilderComponent.scss';
import DashboardBuilderBoardComponent from './board/DashboardBuilderBoardComponent';
import DroppableVoFieldsComponent from './droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDroppableVoFieldsAction } from './droppable_vo_fields/DroppableVoFieldsStore';
import DashboardMenuConfComponent from './menu_conf/DashboardMenuConfComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from './page/DashboardPageStore';
import DashboardSharedFiltersComponent from './shared_filters/DashboardSharedFiltersComponent';
import TablesGraphComponent from './tables_graph/TablesGraphComponent';
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
    }
})
export default class DashboardBuilderComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_discarded_field_paths: (discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_dashboard_api_type_ids: (dashboard_api_type_ids: string[]) => void;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private dashboard_id: string;

    @Prop({ default: null })
    private dashboard_vo_action: string;

    @Prop({ default: null })
    private dashboard_vo_id: string;

    @Prop({ default: null })
    private api_type_id_action: string;

    @ModuleDashboardPageAction
    private set_page_widgets_components_by_pwid: (page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) => void;

    @ModuleDashboardPageGetter
    private get_page_history: DashboardPageVO[];

    @ModuleDashboardPageAction
    private set_page_widgets: (page_widgets: DashboardPageWidgetVO[]) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageAction
    private delete_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleTranslatableTextAction
    private set_flat_locale_translations: (translations: { [code_text: string]: string }) => void;

    @ModuleDashboardPageAction
    private add_page_history: (page_history: DashboardPageVO) => void;

    @ModuleDashboardPageAction
    private set_page_history: (page_history: DashboardPageVO[]) => void;

    @ModuleDashboardPageAction
    private set_dashboard_navigation_history: (
        dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }
    ) => void;

    @ModuleDashboardPageGetter
    private get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number };

    @ModuleDashboardPageAction
    private pop_page_history: (fk) => void;

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    @ModuleDashboardPageAction
    private add_shared_filters_to_map: (shared_filters: SharedFiltersVO[]) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private dashboards: DashboardVO[] = [];
    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null; // The current page

    private show_shared_filters: boolean = false;
    private show_build_page: boolean = false;
    private show_select_vos: boolean = true;
    private show_menu_conf: boolean = false;

    private selected_widget: DashboardPageWidgetVO = null;

    private collapsed_fields_wrapper: boolean = true;

    private can_use_clipboard: boolean = false;

    private throttle_on_dashboard_loaded = ThrottleHelper.declare_throttle_without_args(this.on_dashboard_loaded, 50);

    private async update_layout_widget(widget: DashboardPageWidgetVO) {
        if ((!this.$refs) || (!this.$refs['Dashboardbuilderboardcomponent'])) {
            return;
        }

        await ((this.$refs['Dashboardbuilderboardcomponent']) as DashboardBuilderBoardComponent).update_layout_widget(widget);
    }

    private async paste_dashboard(import_on_vo: DashboardVO = null) {

        let self = this;
        self.snotify.async(self.label('paste_dashboard.start'), () =>
            new Promise(async (resolve, reject) => {

                try {

                    /**
                     * On récupère le contenu du presse-papier, et on checke qu'on a bien un db dedans
                     *  si oui on insère tous les éléments et on garde la trace des liaisons
                     *  si on se retrouve dans une impasse on invalide tout l'import
                     */
                    let text = await navigator.clipboard.readText();
                    if ((!text) || (!JSON.parse(text))) {
                        throw new Error('Invalid paste');
                    }

                    if ((!!import_on_vo) && (import_on_vo.id)) {
                        let old_pages = self.pages = await this.load_dashboard_pages_by_dashboard_id(
                            self.dashboard.id,
                            { refresh: true }
                        );

                        await ModuleDAO.getInstance().deleteVOs(
                            old_pages
                        );
                    }

                    let imported_datas = await ModuleDataImport.getInstance().importJSON(text, import_on_vo);

                    self.loading = true;

                    self.dashboards = await self.load_all_dashboards(
                        { refresh: true }
                    );

                    self.throttle_on_dashboard_loaded();

                    // On crée des trads, on les recharge
                    await VueAppController.getInstance().initializeFlatLocales();
                    self.set_flat_locale_translations(VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS);

                    if ((!import_on_vo) && imported_datas && imported_datas.length) {
                        // on récupère le nouveau db
                        let new_db = imported_datas.find((i) => i._type == DashboardVO.API_TYPE_ID);
                        self.dashboard = new_db ? new_db as DashboardVO : self.dashboard;
                    }
                    self.loading = false;

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
            })
        );
    }

    private async copy_dashboard() {

        let self = this;
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
            })
        );
    }

    private async move_page_left(page: DashboardPageVO, page_i: number): Promise<void> {
        if ((!this.pages) || (!page_i) || (!this.pages[page_i - 1])) {
            return;
        }

        this.pages[page_i] = this.pages[page_i - 1];
        this.pages[page_i - 1] = page;

        for (let i in this.pages) {
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

        for (let i in this.pages) {
            this.pages[i].weight = parseInt(i);
        }

        await this.save_page_move();
    }

    private async save_page_move() {
        let self = this;
        self.snotify.async(self.label('move_page.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    await ModuleDAO.getInstance().insertOrUpdateVOs(self.pages);

                    self.pages = await this.load_dashboard_pages_by_dashboard_id(
                        self.dashboard.id,
                        { refresh: true }
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
            })
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
         *  attention sur les trads on colle des codes de remplacement pour les ids qui auront été insérés après import
         */
        let export_vos: IDistantVOBase[] = [];
        let db = this.dashboard;
        export_vos.push(ModuleTableVO.default_get_api_version(db));

        let pages = await this.load_dashboard_pages_by_dashboard_id(
            this.dashboard.id,
            { refresh: true }
        );

        if (pages && pages.length) {
            export_vos = export_vos.concat(pages.map((p) => ModuleTableVO.default_get_api_version(p)));
        }

        let graphvorefs = await query(DashboardGraphVORefVO.API_TYPE_ID).filter_by_num_eq('dashboard_id', this.dashboard.id).select_vos<DashboardGraphVORefVO>();
        if (graphvorefs && graphvorefs.length) {
            export_vos = export_vos.concat(graphvorefs.map((p) => ModuleTableVO.default_get_api_version(p)));
        }

        let page_widgets: DashboardPageWidgetVO[] = null;
        for (let i in pages) {
            let page = pages[i];

            let this_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_num_eq('page_id', page.id).select_vos<DashboardPageWidgetVO>();
            if (this_page_widgets && this_page_widgets.length) {
                export_vos = export_vos.concat(this_page_widgets.map((p) => ModuleTableVO.default_get_api_version(p)));
                page_widgets = page_widgets ? page_widgets.concat(this_page_widgets) : this_page_widgets;
            }
        }

        let page_widgets_options: { [page_widget_id: number]: IExportableWidgetOptions } = {};
        for (let i in page_widgets) {
            let page_widget = page_widgets[i];

            if (DashboardBuilderWidgetsController.getInstance().widgets_options_constructor_by_widget_id[page_widget.widget_id]) {
                let options = Object.assign(
                    DashboardBuilderWidgetsController.getInstance().widgets_options_constructor_by_widget_id[page_widget.widget_id](),
                    ObjectHandler.try_get_json(page_widget.json_options)
                );
                if (options) {
                    page_widgets_options[page_widget.id] = options as IExportableWidgetOptions;
                }
            }
        }

        let translation_codes: TranslatableTextVO[] = [];
        let translations: TranslationVO[] = [];
        await this.get_exportable_translations(
            translation_codes,
            translations,
            db,
            pages,
            page_widgets,
            page_widgets_options
        );
        if (translation_codes && translation_codes.length) {
            export_vos = export_vos.concat(translation_codes.map((p) => ModuleTableVO.default_get_api_version(p)));
        }
        if (translations && translations.length) {
            export_vos = export_vos.concat(translations.map((p) => ModuleTableVO.default_get_api_version(p)));
        }

        let text: string = JSON.stringify(export_vos);
        await navigator.clipboard.writeText(text);
    }

    private async get_exportable_translations(
        translation_codes: TranslatableTextVO[],
        translations: TranslationVO[],
        db: DashboardVO,
        pages: DashboardPageVO[],
        page_widgets: DashboardPageWidgetVO[],
        page_widgets_options: { [page_widget_id: number]: IExportableWidgetOptions }
    ) {
        let langs: LangVO[] = await ModuleTranslation.getInstance().getLangs();

        let promises = [];

        // trad du db
        if (db && db.translatable_name_code_text) {
            promises.push(this.get_exportable_translation(
                langs,
                translation_codes,
                translations,
                db.translatable_name_code_text, DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + '{{IMPORT:' + db._type + ':' + db.id + '}}' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)
            );
        }

        // trads des pages
        for (let i in pages) {
            let page = pages[i];

            if (page && page.translatable_name_code_text) {
                promises.push(this.get_exportable_translation(
                    langs,
                    translation_codes,
                    translations,
                    page.translatable_name_code_text,
                    DashboardBuilderController.PAGE_NAME_CODE_PREFIX + '{{IMPORT:' + page._type + ':' + page.id + '}}' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION));
            }
        }

        // widgets
        for (let i in page_widgets) {
            let page_widget = page_widgets[i];

            if (page_widget && page_widget.translatable_name_code_text) {
                promises.push(this.get_exportable_translation(
                    langs,
                    translation_codes,
                    translations,
                    page_widget.translatable_name_code_text,
                    DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + '{{IMPORT:' + page_widget._type + ':' + page_widget.id + '}}'));
            }

            if (page_widgets_options && page_widgets_options[page_widget.id]) {
                let exportable_translations = await page_widgets_options[page_widget.id].get_all_exportable_name_code_and_translation(page_widget.page_id, page_widget.id);
                for (let current_code_text in exportable_translations) {
                    let exportable_code_text = exportable_translations[current_code_text];
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
            let page_widget_trads: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', [
                DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget.id + '.',
                DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget.id + '.'
            ]).select_vos<TranslatableTextVO>();

            for (let j in page_widget_trads) {
                let page_widget_trad = page_widget_trads[j];

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
        exportable_code: string
    ) {
        let translatable_db = await ModuleTranslation.getInstance().getTranslatableText(initial_code);
        if (!!translatable_db) {
            translatable_db.code_text = exportable_code;
            translation_codes.push(translatable_db);

            for (let i in langs) {
                let lang = langs[i];

                let translation_db = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable_db.id);
                if (!!translation_db) {
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

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.selected_widget.widget_id].name;
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
            parseInt(this.dashboard_id)
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
                this.set_dashboard_navigation_history
            );

            this.$router.push({
                name: 'DashboardBuilder_id',
                params: {
                    dashboard_id: this.dashboard.id.toString()
                }
            });
        }

        this.throttle_on_dashboard_loaded();
    }

    /**
     * load_all_dashboards
     * - Load all the dashboards and sort them by weight
     *
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    private async load_all_dashboards(
        options?: { refresh?: boolean }
    ): Promise<DashboardVO[]> {

        const dashboards = await DashboardVOManager.find_all_dashboards(
            null,
            {
                sorts: [
                    new SortByVO(DashboardVO.API_TYPE_ID, 'weight', true),
                    new SortByVO(DashboardVO.API_TYPE_ID, 'id', true)
                ]
            },
            options
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
        options?: { refresh?: boolean }
    ): Promise<DashboardPageVO[]> {

        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_id(
            dashboard_id,
            {
                sorts: [
                    new SortByVO(DashboardPageVO.API_TYPE_ID, 'weight', true),
                    new SortByVO(DashboardPageVO.API_TYPE_ID, 'id', true)
                ]
            },
            options
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
            })()
        ]);
        this.init_dashboard_tab();

        if (!this.pages) {
            await this.create_dashboard_page();
        }

        const page_widgets: DashboardPageWidgetVO[] = await this.load_page_widgets_by_page_ids(
            this.pages.map((p) => p.id)
        );

        this.set_page_widgets(page_widgets);

        const shared_filters: SharedFiltersVO[] = await DashboardVOManager.load_shared_filters_with_dashboard_id(
            this.dashboard.id,
        );

        this.add_shared_filters_to_map(shared_filters);

        if (page_widgets?.length > 0) {
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
            page_ids
        );

        this.set_page_widgets(page_widgets);

        return page_widgets;
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

        this.pages = await this.load_dashboard_pages_by_dashboard_id(
            this.dashboard.id,
            { refresh: true }
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

    get can_build_page() {
        return !!(this.get_dashboard_api_type_ids && this.get_dashboard_api_type_ids.length);
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

    get dashboard_name_code_text(): string {
        if (!this.dashboard) {
            return null;
        }

        return this.dashboard.translatable_name_code_text ? this.dashboard.translatable_name_code_text : null;
    }

    private async create_new_dashboard() {
        this.dashboard = new DashboardVO();
        this.set_dashboard_api_type_ids([]);

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(
            this.dashboard
        );

        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        this.dashboard = await DashboardVOManager.find_dashboard_by_id(
            insertOrDeleteQueryResult.id
        );

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

    private async switch_group_filters(page: DashboardPageVO) {
        page.group_filters = !page.group_filters;

        await ModuleDAO.getInstance().insertOrUpdateVO(page);
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

        if (!this.page) {
            return;
        }

        this.loading = false;
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
        let tmp = Array.from(this.get_dashboard_api_type_ids);
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
        let self = this;
        await navigator.permissions.query({ name: "clipboard-write" as any }).then((result) => {
            if (result.state == "granted" || result.state == "prompt") {
                self.can_use_clipboard = true;
            }
        });

        let body = document.getElementById('page-top');

        if (body) {
            body.classList.add("sidenav-toggled");
        }
    }

    private beforeDestroy() {
        let body = document.getElementById('page-top');

        if (body) {
            body.classList.remove("sidenav-toggled");
        }
    }

    private reverse_collapse_fields_wrapper() {
        this.collapsed_fields_wrapper = !this.collapsed_fields_wrapper;
    }
}
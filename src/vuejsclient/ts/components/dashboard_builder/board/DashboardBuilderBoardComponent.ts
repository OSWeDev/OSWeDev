import Component from 'vue-class-component';
import { GridItem, GridLayout } from "vue-grid-layout";
import { Prop, Vue, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IEditableDashboardPage from '../../../../../shared/modules/DashboardBuilder/interfaces/IEditableDashboardPage';
import DashboardPageWidgetVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardCopyWidgetComponent from '../copy_widget/DashboardCopyWidgetComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../widgets/DashboardBuilderWidgetsController';
import ChecklistItemModalComponent from '../widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent';
import FavoritesFiltersModalComponent from '../widgets/favorites_filters_widget/modal/FavoritesFiltersModalComponent';
import SupervisionItemModalComponent from '../widgets/supervision_widget/supervision_item_modal/SupervisionItemModalComponent';
import CRUDCreateModalComponent from '../widgets/table_widget/crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from '../widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent';
import './DashboardBuilderBoardComponent.scss';
import DashboardBuilderBoardItemComponent from './item/DashboardBuilderBoardItemComponent';

@Component({
    template: require('./DashboardBuilderBoardComponent.pug'),
    components: {
        Gridlayout: GridLayout,
        Griditem: GridItem,
        Dashboardbuilderboarditemcomponent: DashboardBuilderBoardItemComponent,
        Crudupdatemodalcomponent: CRUDUpdateModalComponent,
        Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent,
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
        Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent,
        Checklistitemmodalcomponent: ChecklistItemModalComponent,
        Supervisionitemmodal: SupervisionItemModalComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardBuilderBoardComponent extends VueComponentBase {

    public static GridLayout_TOTAL_HEIGHT: number = 720;
    public static GridLayout_TOTAL_ROWS: number = 72;
    public static GridLayout_ELT_HEIGHT: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_HEIGHT / DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    public static GridLayout_TOTAL_WIDTH: number = 1280;
    public static GridLayout_TOTAL_COLUMNS: number = 128;
    public static GridLayout_ELT_WIDTH: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_WIDTH / DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageAction
    private delete_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageAction
    private set_Checklistitemmodalcomponent: (Checklistitemmodalcomponent: ChecklistItemModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Supervisionitemmodal: (Supervisionitemmodal: SupervisionItemModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Favoritesfiltersmodalcomponent: (Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Crudupdatemodalcomponent: (Crudupdatemodalcomponent: CRUDUpdateModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Crudcreatemodalcomponent: (Crudcreatemodalcomponent: CRUDCreateModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Dashboardcopywidgetcomponent: (Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) => void;

    @ModuleDashboardPageGetter
    private get_widgets_invisibility: { [w_id: number]: boolean };

    @ModuleDashboardPageGetter
    private get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filters: (param: FieldFiltersVO) => void;

    @Prop()
    private dashboard_page: DashboardPageVO;

    @Prop()
    private dashboard_pages: DashboardPageVO[];

    @Prop()
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private selected_widget: DashboardPageWidgetVO;

    @Prop({ default: true })
    private editable: boolean;

    private elt_height: number = DashboardBuilderBoardComponent.GridLayout_ELT_HEIGHT;
    private col_num: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;
    private max_rows: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    private item_key: { [item_id: number]: number } = {};

    private widgets: DashboardPageWidgetVO[] = [];

    private editable_dashboard_page: IEditableDashboardPage = null;

    private is_filtres_deplie: boolean = false;

    private dragged = null;

    private throttled_rebuild_page_layout = ThrottleHelper.declare_throttle_without_args(this.rebuild_page_layout.bind(this), 200);

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        const sorted_widgets = DashboardBuilderWidgetsController.getInstance().sorted_widgets;
        return VOsTypesManager.vosArray_to_vosByIds(sorted_widgets);
    }

    get draggable(): boolean {
        return this.editable;
    }

    get resizable(): boolean {
        return this.editable;
    }

    public async update_layout_widget(widget: DashboardPageWidgetVO) {
        if ((!this.editable_dashboard_page?.layout)) {
            await this.rebuild_page_layout();
            return;
        }

        const i = this.editable_dashboard_page.layout.findIndex((w) => w['id'] == widget.id);
        if (i < 0) {
            await this.rebuild_page_layout();
            return;
        }

        const has_diff_json_options: boolean = (this.editable_dashboard_page.layout[i]['json_options'] != widget.json_options) ? true : false;

        this.editable_dashboard_page.layout[i] = widget;

        // On va forcer le rechargement que si on modifie réellement les options
        if (has_diff_json_options) {
            let res_key: number = -1;

            if (this.item_key[widget.id] != null) {
                res_key = this.item_key[widget.id];
            }

            res_key++;

            Vue.set(this.item_key, widget.id, res_key);
        }
    }

    @Watch("dashboard", { immediate: true })
    private async onchange_dashboard() {
        // We should load the shared_filters with the current dashboard
        await DashboardVOManager.load_shared_filters_with_dashboard(
            this.dashboard,
            this.get_dashboard_navigation_history,
            this.get_active_field_filters,
            this.set_active_field_filters
        );
    }

    @Watch("dashboard_page", { immediate: true })
    private async onchange_dbdashboard() {
        if (!this.dashboard_page) {
            this.editable_dashboard_page = null;
            return;
        }

        if ((!this.editable_dashboard_page) || (this.editable_dashboard_page.id != this.dashboard_page.id)) {

            await this.throttled_rebuild_page_layout();
        }
    }

    private mounted() {
        DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler = this.add_widget_to_page.bind(this);
        this.set_Checklistitemmodalcomponent(this.$refs['Checklistitemmodalcomponent'] as ChecklistItemModalComponent);
        this.set_Supervisionitemmodal(this.$refs['Supervisionitemmodal'] as SupervisionItemModalComponent);
        this.set_Favoritesfiltersmodalcomponent(this.$refs['Favoritesfiltersmodalcomponent'] as FavoritesFiltersModalComponent);
        this.set_Crudupdatemodalcomponent(this.$refs['Crudupdatemodalcomponent'] as CRUDUpdateModalComponent);
        this.set_Crudcreatemodalcomponent(this.$refs['Crudcreatemodalcomponent'] as CRUDCreateModalComponent);
        this.set_Dashboardcopywidgetcomponent(this.$refs['Dashboardcopywidgetcomponent'] as DashboardCopyWidgetComponent);
    }

    @Watch('get_widgets_invisibility', { deep: true })
    private async onchange_get_widgets_invisibility() {

        this.throttled_rebuild_page_layout();
    }

    private async rebuild_page_layout() {

        await all_promises([
            this.load_widgets()
        ]);

        /**
         * Si on a une sélection qui correpond au widget qu'on est en train de recharger, on modifie aussi le lien
         */
        if (this.selected_widget && this.selected_widget.id) {
            const page_widget = this.widgets.find(
                (w) => w.id == this.selected_widget.id
            );

            this.set_page_widget(page_widget);
            this.select_widget(page_widget);
        }

        this.editable_dashboard_page = Object.assign({
            layout: this.widgets
        }, this.dashboard_page);
    }

    private async load_widgets() {
        let widgets = await DashboardPageWidgetVOManager.find_page_widgets_by_page_id(
            this.dashboard_page.id
        );

        widgets = widgets ? widgets.filter((w) =>
            !this.get_widgets_invisibility[w.id]
        ) : null;

        this.widgets = widgets;
    }


    private async add_widget_to_page(widget: DashboardWidgetVO): Promise<DashboardPageWidgetVO> {

        if (!this.dashboard_page) {
            return null;
        }

        return new Promise((resolvef, rejectf) => {
            const self = this;
            self.snotify.async(
                self.label('DashboardBuilderBoardComponent.add_widget_to_page.start'), () =>
                new Promise(async (resolve, reject) => {

                    let page_widget = new DashboardPageWidgetVO();

                    page_widget.page_id = self.dashboard_page.id;
                    page_widget.widget_id = widget.id;

                    let max_weight: number = 0;
                    self.widgets.forEach((w) => {
                        if (w.weight >= max_weight) {
                            max_weight = w.weight + 1;
                        }
                    });
                    page_widget.weight = max_weight;

                    page_widget.w = widget.default_width;
                    page_widget.h = widget.default_height;

                    let max_y = 0;
                    if (self.editable_dashboard_page.layout && self.editable_dashboard_page.layout.length) {
                        self.editable_dashboard_page.layout.forEach((item) => max_y = Math.max(max_y, item.y + item.h));
                    }
                    page_widget.x = 0;
                    page_widget.y = max_y;

                    page_widget.background = widget.default_background;

                    try {
                        if (DashboardBuilderWidgetsController.getInstance().widgets_options_constructor[widget?.name]) {
                            const options = DashboardBuilderWidgetsController.getInstance().widgets_options_constructor[widget?.name]();
                            page_widget.json_options = JSON.stringify(options);
                        }
                    } catch (error) {
                        ConsoleHandler.error(error);
                    }

                    const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget);
                    if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                        reject({
                            body: self.label('DashboardBuilderBoardComponent.add_widget_to_page.ko'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        resolvef(null);
                        return null;
                    }

                    // On reload les widgets
                    self.widgets = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_num_eq('page_id', self.dashboard_page.id).select_vos<DashboardPageWidgetVO>();
                    page_widget = self.widgets.find((w) => w.id == insertOrDeleteQueryResult.id);

                    self.editable_dashboard_page = Object.assign({
                        layout: self.widgets
                    }, self.dashboard_page);

                    self.set_page_widget(page_widget);
                    self.select_widget(page_widget);

                    resolve({
                        body: self.label('DashboardBuilderBoardComponent.add_widget_to_page.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    resolvef(page_widget);
                })
            );
        });
    }


    private async resizedEvent(i, newH, newW, newHPx, newWPx) {
        if (!this.widgets) {
            return;
        }
        const widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.error("resizedEvent:on ne retrouve pas le widget");
            return;
        }

        widget.h = newH;
        widget.w = newW;
        await ModuleDAO.getInstance().insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }


    private async movedEvent(i, newX, newY) {
        /*
       S'active lorsque le widget est lâché, event donne alors la nouvelle position du widget.
       C'est une fenêtre de tir pour obtenir la position d'un widget si celui-ci sort du tableau !
       */


        if (!this.widgets) {
            return;
        }
        const widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.error("movedEvent:on ne retrouve pas le widget");
            return;
        }


        widget.x = newX;
        widget.y = newY;
        await ModuleDAO.getInstance().insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }

    private async delete_widget(page_widget: DashboardPageWidgetVO) {
        const self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DashboardBuilderBoardComponent.delete_widget.body'), self.label('DashboardBuilderBoardComponent.delete_widget.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(
                            self.label('DashboardBuilderBoardComponent.delete_widget.start'),
                            () => new Promise(async (resolve, reject) => {

                                try {

                                    await ModuleDAO.getInstance().deleteVOs([page_widget]);
                                    let i = 0;
                                    for (; i < self.widgets.length; i++) {
                                        const w = self.widgets[i];

                                        if (w.i == page_widget.i) {
                                            break;
                                        }
                                    }
                                    self.widgets.splice(i, 1);
                                    self.delete_page_widget(page_widget);
                                    self.select_widget(null);

                                    self.$emit('removed_widget_from_page', page_widget);

                                    // On reload les widgets
                                    await self.throttled_rebuild_page_layout();

                                    resolve({
                                        body: self.label('DashboardBuilderBoardComponent.delete_widget.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } catch (error) {
                                    reject({
                                        body: error,
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

    private select_widget(page_widget) {
        this.$emit('select_widget', page_widget);
    }

    private select_page(page) {
        this.$emit('select_page', page);
    }

    private async reload_widgets() {
        const self = this;

        // On reload les widgets
        await self.throttled_rebuild_page_layout();
        self.select_widget(null);
    }
    private isHide(item: DashboardPageWidgetVO): boolean {
        if (!item || !item.json_options) {
            return false;
        }

        try {
            const json_options: any = JSON.parse(item.json_options);

            if (json_options && json_options.hide_filter) {
                return true;
            }
        } catch { }

        return false;
    }

    private change_is_filtres_deplie() {
        this.is_filtres_deplie = !this.is_filtres_deplie;
        // on ajoute la classe filtre_deplie au body si le bloc des filtres est déplié
        if (this.is_filtres_deplie === true) {

            $("body").addClass('filtre_deplie');
        } else {

            $("body").removeClass('filtre_deplie');
        }
    }

    // private select_widget_and_stop(event, page_widget) {
    //     event.stopPropagation();

    //     this.$emit('select_widget', page_widget);
    // }
}
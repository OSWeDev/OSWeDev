import Component from 'vue-class-component';
import { GridItem, GridLayout } from "vue-grid-layout";
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IEditableDashboardPage from '../../../../../shared/modules/DashboardBuilder/interfaces/IEditableDashboardPage';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDashboardPageAction } from '../page/DashboardPageStore';
import ChecklistItemModalComponent from '../widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent';
import DashboardBuilderWidgetsController from '../widgets/DashboardBuilderWidgetsController';
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
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
        Checklistitemmodalcomponent: ChecklistItemModalComponent
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
    private set_Crudupdatemodalcomponent: (Crudupdatemodalcomponent: CRUDUpdateModalComponent) => void;

    @ModuleDashboardPageAction
    private set_Crudcreatemodalcomponent: (Crudcreatemodalcomponent: CRUDCreateModalComponent) => void;

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

    private editable_dashboard_page: IEditableDashboardPage = null;

    private widgets: DashboardPageWidgetVO[] = [];

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    get draggable(): boolean {
        return this.editable;
    }

    get resizable(): boolean {
        return this.editable;
    }

    @Watch("dashboard_page", { immediate: true })
    private async onchange_dbdashboard() {
        if (!this.dashboard_page) {
            this.editable_dashboard_page = null;
            return;
        }

        if ((!this.editable_dashboard_page) || (this.editable_dashboard_page.id != this.dashboard_page.id)) {

            this.widgets = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageWidgetVO>(
                DashboardPageWidgetVO.API_TYPE_ID, 'page_id', [this.dashboard_page.id]);

            this.editable_dashboard_page = Object.assign({
                layout: this.widgets
            }, this.dashboard_page);
        }
    }

    private mounted() {
        DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler = this.add_widget_to_page.bind(this);
        this.set_Checklistitemmodalcomponent(this.$refs['Checklistitemmodalcomponent'] as ChecklistItemModalComponent);
        this.set_Crudupdatemodalcomponent(this.$refs['Crudupdatemodalcomponent'] as CRUDUpdateModalComponent);
        this.set_Crudcreatemodalcomponent(this.$refs['Crudcreatemodalcomponent'] as CRUDCreateModalComponent);
    }

    private async add_widget_to_page(widget: DashboardWidgetVO) {

        if (!this.dashboard_page) {
            return;
        }

        let page_widget = new DashboardPageWidgetVO();

        page_widget.page_id = this.dashboard_page.id;
        page_widget.widget_id = widget.id;

        let max_weight: number = 0;
        this.widgets.forEach((w) => {
            if (w.weight >= max_weight) {
                max_weight = w.weight + 1;
            }
        });
        page_widget.weight = max_weight;

        page_widget.w = widget.default_width;
        page_widget.h = widget.default_height;

        page_widget.background = widget.default_background;

        try {
            if (DashboardBuilderWidgetsController.getInstance().widgets_options_constructor[widget.name]) {
                let options = DashboardBuilderWidgetsController.getInstance().widgets_options_constructor[widget.name]();
                page_widget.json_options = JSON.stringify(options);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderBoardComponent.add_widget_to_page.ko'));
            return;
        }
        page_widget = await ModuleDAO.getInstance().getVoById<DashboardPageWidgetVO>(DashboardPageWidgetVO.API_TYPE_ID, insertOrDeleteQueryResult.id);

        /**
         * On ajoute le widget dans les items du layout
         */
        this.editable_dashboard_page.layout.push(page_widget);
        this.set_page_widget(page_widget);
        this.select_widget(page_widget);

        this.snotify.success(this.label('DashboardBuilderBoardComponent.add_widget_to_page.ok'));
    }

    private async resizedEvent(i, newH, newW, newHPx, newWPx) {
        if (!this.widgets) {
            return;
        }
        let widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.getInstance().error("resizedEvent:on ne retrouve pas le widget");
            return;
        }

        widget.h = newH;
        widget.w = newW;
        await ModuleDAO.getInstance().insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }

    private async movedEvent(i, newX, newY) {
        if (!this.widgets) {
            return;
        }
        let widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.getInstance().error("movedEvent:on ne retrouve pas le widget");
            return;
        }

        widget.x = newX;
        widget.y = newY;
        await ModuleDAO.getInstance().insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }

    private async delete_widget(page_widget: DashboardPageWidgetVO) {
        let self = this;

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
                        self.snotify.info(self.label('DashboardBuilderBoardComponent.delete_widget.start'));

                        await ModuleDAO.getInstance().deleteVOs([page_widget]);
                        let i = 0;
                        for (; i < self.widgets.length; i++) {
                            let w = self.widgets[i];

                            if (w.i == page_widget.i) {
                                break;
                            }
                        }
                        self.widgets.splice(i, 1);
                        this.delete_page_widget(page_widget);
                        this.select_widget(null);

                        self.snotify.success(self.label('DashboardBuilderBoardComponent.delete_widget.ok'));
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

    // private select_widget_and_stop(event, page_widget) {
    //     event.stopPropagation();

    //     this.$emit('select_widget', page_widget);
    // }
}
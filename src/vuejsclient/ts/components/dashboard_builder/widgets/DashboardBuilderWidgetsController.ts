import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import InsertOrDeleteQueryResult from "../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult";
import DashboardPageWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import WeightHandler from "../../../../../shared/tools/WeightHandler";

export default class DashboardBuilderWidgetsController {

    public static getInstance(): DashboardBuilderWidgetsController {
        if (!DashboardBuilderWidgetsController.instance) {
            DashboardBuilderWidgetsController.instance = new DashboardBuilderWidgetsController();
        }
        return DashboardBuilderWidgetsController.instance;
    }

    private static instance: DashboardBuilderWidgetsController;

    public add_widget_to_page_handler: (widget: DashboardWidgetVO) => Promise<DashboardPageWidgetVO> = null;
    public sorted_widgets: DashboardWidgetVO[] = [];
    public widgets_options_constructor_by_widget_id: { [widget_id: number]: () => any } = {};
    public widgets_options_constructor: { [name: string]: () => any } = {};
    public widgets_get_selected_fields: { [name: string]: (page_widget: DashboardPageWidgetVO) => { [api_type_id: string]: { [field_id: string]: boolean } } } = {};
    public initialized: boolean = false;

    protected constructor() {
    }

    public async initialize() {

        if (this.initialized) {
            return;
        }

        this.sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID).select_vos<DashboardWidgetVO>();
        if (!this.sorted_widgets) {
            this.sorted_widgets = [];
        }

        WeightHandler.getInstance().sortByWeight(this.sorted_widgets);
        this.initialized = true;
    }

    public async registerWidget(widget: DashboardWidgetVO, options_constructor: () => any, get_selected_fields: (page_widget: DashboardPageWidgetVO) => { [api_type_id: string]: { [field_id: string]: boolean } }) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!!options_constructor) {
            this.widgets_options_constructor[widget.name] = options_constructor;
            this.widgets_options_constructor_by_widget_id[widget.id] = options_constructor;
        }

        if (!!get_selected_fields) {
            this.widgets_get_selected_fields[widget.name] = get_selected_fields;
        }

        if (this.sorted_widgets.find((w) => w.name == widget.name)) {
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(widget);

        if ((!insertOrDeleteQueryResult) || !insertOrDeleteQueryResult.id) {
            ConsoleHandler.error("Impossible de créer le widget");
            return;
        }

        widget.id = insertOrDeleteQueryResult.id;
    }
}
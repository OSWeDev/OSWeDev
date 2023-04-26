import ConsoleHandler from "../../../tools/ConsoleHandler";
import WeightHandler from "../../../tools/WeightHandler";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import InsertOrDeleteQueryResult from "../../DAO/vos/InsertOrDeleteQueryResult";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";

/**
 * @class DashboardWidgetVOManager
 *  - Widgets manager for the dashboard builder
 *  - Is actually DashboardWidgetTypeVOManager
 */
export default class DashboardWidgetVOManager {

    public static async registerWidgetType(
        widget_type: DashboardWidgetVO,
        options_constructor: () => any,
        get_selected_fields: (page_widget: DashboardPageWidgetVO) => {
            [api_type_id: string]: { [field_id: string]: boolean }
        }
    ) {

        const self = DashboardWidgetVOManager.getInstance();

        if (!self.initialized) {
            await self.initialize();
        }

        if (!!options_constructor) {
            self.widgets_options_constructor[widget_type.name] = options_constructor;
            self.widgets_options_constructor_by_widget_id[widget_type.id] = options_constructor;
        }

        if (!!get_selected_fields) {
            self.widgets_get_selected_fields[widget_type.name] = get_selected_fields;
        }

        if (self.sorted_widgets.find((w) => w.name == widget_type.name)) {
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(widget_type);

        if ((!insertOrDeleteQueryResult) || !insertOrDeleteQueryResult.id) {
            ConsoleHandler.error("Impossible de créer le widget");
            return;
        }

        widget_type.id = insertOrDeleteQueryResult.id;
    }

    public static getInstance(): DashboardWidgetVOManager {
        if (!DashboardWidgetVOManager.instance) {
            DashboardWidgetVOManager.instance = new DashboardWidgetVOManager();
        }

        return DashboardWidgetVOManager.instance;
    }

    protected static instance: DashboardWidgetVOManager;

    public add_widget_to_page_handler: (widget: DashboardWidgetVO) => Promise<DashboardPageWidgetVO> = null;
    public widgets_options_constructor_by_widget_id: { [widget_id: number]: () => any } = {};
    public widgets_options_constructor: { [name: string]: () => any } = {};
    public widgets_get_selected_fields: { [name: string]: (page_widget: DashboardPageWidgetVO) => { [api_type_id: string]: { [field_id: string]: boolean } } } = {};
    public initialized: boolean = false;
    public sorted_widgets_types: DashboardWidgetVO[] = []; // sorted_widgets_types

    /**
     * @deprecated use sorted_widgets_types instead
     */
    public sorted_widgets: DashboardWidgetVO[] = []; // sorted_widgets_types

    protected constructor() {
    }

    public async initialize() {

        if (this.initialized) {
            return;
        }

        this.sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .select_vos<DashboardWidgetVO>();

        // keep the same reference on sorted_widgets
        this.sorted_widgets_types = this.sorted_widgets;

        if (!this.sorted_widgets) {
            this.sorted_widgets = [];
        }

        WeightHandler.getInstance().sortByWeight(this.sorted_widgets);

        this.initialized = true;
    }

    /**
     * @deprecated use registerWidgetType instead
     */
    public async registerWidget(
        widget_type: DashboardWidgetVO,
        options_constructor: () => any,
        get_selected_fields: (page_widget: DashboardPageWidgetVO) => {
            [api_type_id: string]: { [field_id: string]: boolean }
        }
    ) {
        return DashboardWidgetVOManager.registerWidgetType(widget_type, options_constructor, get_selected_fields);
    }
}
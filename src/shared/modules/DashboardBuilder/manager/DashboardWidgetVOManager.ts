import ConsoleHandler from "../../../tools/ConsoleHandler";
import WeightHandler from "../../../tools/WeightHandler";
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import InsertOrDeleteQueryResult from "../../DAO/vos/InsertOrDeleteQueryResult";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * DashboardWidgetVOManager
 *  - Widgets manager for the dashboard builder
 *  - Is actually DashboardWidgetTypeVOManager
 */
export default class DashboardWidgetVOManager {

    /**
     * check_dashboard_widget_access
     * - Check if user has access to dashboard_widget vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_dashboard_widget_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
            access_type,
            DashboardWidgetVO.API_TYPE_ID
        );

        const has_access = await ModuleAccessPolicy.getInstance().testAccess(
            access_policy_name
        );

        if (!has_access) {
            return false;
        }

        return true;
    }

    /**
     * create_widget_options_vo_by_name
     * - This method is responsible for creating the widget options vo by name
     *
     * TODO: Maybe create AbstractWidgetOptionsVO and use it as return type
     *
     * @param {string} name
     * @param {any} props
     * @returns {any}
     */
    public static create_widget_options_vo_by_name(name: string, props?: any): any {
        switch (name) {
            case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                return new FieldValueFilterWidgetOptionsVO().from(props);
            case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                return new MonthFilterWidgetOptionsVO().from(props);
            case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                return new YearFilterWidgetOptionsVO().from(props);
            default:
                throw new Error(
                    `Factory for the given WidgetOptionsVO ` +
                    `name: "${name}" is not implemented yet!`
                );
        }
    }

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

    /**
     * find_all_sorted_widgets_types
     * - This method is responsible for loading all sorted widgets types
     *
     * @returns {Promise<DashboardWidgetVO[]>}
     */
    public static async find_all_sorted_widgets_types(
        options?: {
            refresh?: boolean,
            check_access?: boolean,
        }
    ): Promise<DashboardWidgetVO[]> {
        const self = DashboardWidgetVOManager.getInstance();

        // Return sorted_widgets_types if already loaded
        if (!options?.refresh && self.sorted_widgets_types?.length > 0) {
            return self.sorted_widgets_types;
        }

        // Check access
        // We should always check access to the dashboard_widget vo
        // unless options.check_access is explicitly false
        if (options?.check_access !== false) {
            const has_access = await DashboardWidgetVOManager.check_dashboard_widget_access();
            if (!has_access) {
                return;
            }
        }

        const sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .select_vos<DashboardWidgetVO>();

        WeightHandler.getInstance().sortByWeight(
            sorted_widgets
        );

        // keep the same reference on sorted_widgets
        self.sorted_widgets_types = sorted_widgets;
        self.sorted_widgets = sorted_widgets;

        if (!(sorted_widgets?.length > 0)) {
            self.sorted_widgets = [];
        }

        return sorted_widgets;
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
    public checked_access: { [access_type: string]: boolean } = {};

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

        // Check access
        const has_access = await DashboardWidgetVOManager.check_dashboard_widget_access();
        if (!has_access) {
            this.initialized = true;
            return;
        }

        await DashboardWidgetVOManager.find_all_sorted_widgets_types({ check_access: false });

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
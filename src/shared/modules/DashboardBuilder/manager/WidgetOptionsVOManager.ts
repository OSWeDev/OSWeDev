import ConsoleHandler from "../../../tools/ConsoleHandler";
import WeightHandler from "../../../tools/WeightHandler";
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import InsertOrDeleteQueryResult from "../../DAO/vos/InsertOrDeleteQueryResult";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import FieldValueFilterWidgetManager from "./FieldValueFilterWidgetManager";
import MonthFilterWidgetManager from "./MonthFilterWidgetManager";
import YearFilterWidgetManager from "./YearFilterWidgetManager";

/**
 * WidgetOptionsVOManager
 *  - Widgets manager for the dashboard builder
 *  - Is actually DashboardWidgetTypeVOManager
 */
export default class WidgetOptionsVOManager {

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
     * create_context_filter_from_widget_options
     *  - This method is responsible for creating the context filter from the given widget options
     *
     * @param {string} [widget_name]
     * @param {any} [widget_options] TODO: we must create a AbstractWidgetOptionsVO
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(widget_name: string, widget_options: any): ContextFilterVO {
        switch (widget_name) {
            case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                return FieldValueFilterWidgetManager.create_context_filter_from_widget_options(
                    widget_options
                );
            case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                return MonthFilterWidgetManager.create_context_filter_from_widget_options(
                    widget_options
                );
            case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                return YearFilterWidgetManager.create_context_filter_from_widget_options(
                    widget_options
                );
            default:
                throw new Error(
                    `ContextFilter for the given WidgetOptionsVO ` +
                    `name: "${widget_name}" is not implemented yet!`
                );
        }
    }

    /**
     * create_widget_options_vo_by_name
     * - This method is responsible for creating the widget options vo by name
     *
     * TODO: Maybe create AbstractWidgetOptionsVO and use it as return type
     *
     * @param {string} widget_name
     * @param {string | Object} json_options
     * @returns {any}
     */
    public static create_widget_options_vo_by_name(widget_name: string, json_options?: any): any {

        if (typeof json_options === 'string') {
            json_options = JSON.parse(json_options);
        }

        switch (widget_name) {
            case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                return new FieldValueFilterWidgetOptionsVO().from(json_options);
            case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                return new MonthFilterWidgetOptionsVO().from(json_options);
            case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                return new YearFilterWidgetOptionsVO().from(json_options);
            default:
                throw new Error(
                    `Factory for the given WidgetOptionsVO ` +
                    `widget_name: "${widget_name}" is not implemented yet!`
                );
        }
    }

    /**
     * register_widget_type
     * - This method is responsible for registering the given widget type
     *
     * @deprecated TODO: Shall be in the DashboardWidgetVOManager
     *
     * @param {DashboardWidgetVO} widget_type
     * @param {Function} options_constructor
     * @param {Function} get_selected_fields
     * @returns {Promise<void>}
     */
    public static async register_widget_type(
        widget_type: DashboardWidgetVO,
        options_constructor: () => any,
        get_selected_fields: (page_widget: DashboardPageWidgetVO) => {
            [api_type_id: string]: { [field_id: string]: boolean }
        }
    ): Promise<void> {

        const self = WidgetOptionsVOManager.getInstance();

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

        if (self.sorted_widgets_types.find((w) => w.name == widget_type.name)) {
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
     * @deprecated TODO: Shall be in the DashboardWidgetVOManager
     *
     * @returns {Promise<DashboardWidgetVO[]>}
     */
    public static async find_all_sorted_widgets_types(
        options?: {
            refresh?: boolean,
            check_access?: boolean,
        }
    ): Promise<DashboardWidgetVO[]> {
        const self = WidgetOptionsVOManager.getInstance();

        // Return sorted_widgets_types if already loaded
        if (!options?.refresh && self.sorted_widgets_types?.length > 0) {
            return self.sorted_widgets_types;
        }

        // Check access
        // We should always check access to the dashboard_widget vo
        // unless options.check_access is explicitly false
        if (options?.check_access !== false) {
            const has_access = await WidgetOptionsVOManager.check_dashboard_widget_access();
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

    // istanbul ignore next: nothing to test
    public static getInstance(): WidgetOptionsVOManager {
        if (!WidgetOptionsVOManager.instance) {
            WidgetOptionsVOManager.instance = new WidgetOptionsVOManager();
        }

        return WidgetOptionsVOManager.instance;
    }

    protected static instance: WidgetOptionsVOManager;

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
        const has_access = await WidgetOptionsVOManager.check_dashboard_widget_access();
        if (!has_access) {
            this.initialized = true;
            return;
        }

        await WidgetOptionsVOManager.find_all_sorted_widgets_types({ check_access: false });

        this.initialized = true;
    }

    /**
     * @deprecated use register_widget_type instead
     */
    public async registerWidget(
        widget_type: DashboardWidgetVO,
        options_constructor: () => any,
        get_selected_fields: (page_widget: DashboardPageWidgetVO) => {
            [api_type_id: string]: { [field_id: string]: boolean }
        }
    ) {
        return WidgetOptionsVOManager.register_widget_type(widget_type, options_constructor, get_selected_fields);
    }
}
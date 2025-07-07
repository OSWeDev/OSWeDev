import ConsoleHandler from "../../../tools/ConsoleHandler";
import { field_names } from "../../../tools/ObjectHandler";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import InsertOrDeleteQueryResult from "../../DAO/vos/InsertOrDeleteQueryResult";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import FieldValueFilterWidgetManager from "./FieldValueFilterWidgetManager";
import MonthFilterWidgetManager from "./MonthFilterWidgetManager";
import YearFilterWidgetManager from "./YearFilterWidgetManager";

/**
 * WidgetOptionsVOManager
 *  - Widgets manager for the dashboard builder
 *  - Is actually DashboardWidgetTypeVOManager
 */
export default class WidgetOptionsVOManager {



    public static widgets_options_constructor_by_widget_id: { [widget_id: number]: () => any } = {};
    public static widgets_options_constructor: { [name: string]: () => any } = {};
    public static widgets_get_selected_fields: { [name: string]: (page_widget: DashboardPageWidgetVO) => { [api_type_id: string]: { [field_id: string]: boolean } } } = {};

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
    public static create_widget_options_vo_by_name(widget_name: string, is_filter: boolean, json_options?: any): any {

        if (!is_filter) {
            // not a filter, osef
            return null;
        }

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
                ConsoleHandler.error('WidgetOptionsVOManager: create_widget_options_vo_by_name: widget_name not implemented: ', widget_name);
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

        const sorted_widgets_types = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        if (options_constructor) {
            WidgetOptionsVOManager.widgets_options_constructor[widget_type.name] = options_constructor;
            WidgetOptionsVOManager.widgets_options_constructor_by_widget_id[widget_type.id] = options_constructor;
        }

        if (get_selected_fields) {
            WidgetOptionsVOManager.widgets_get_selected_fields[widget_type.name] = get_selected_fields;
        }

        if (sorted_widgets_types.find((w) => w.name == widget_type.name)) {
            return;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(widget_type);

        if ((!insertOrDeleteQueryResult) || !insertOrDeleteQueryResult.id) {
            ConsoleHandler.error("Impossible de créer le widget");
            return;
        }

        widget_type.id = insertOrDeleteQueryResult.id;
    }

    /**
     * get_all_sorted_widgets_types
     * - This method is responsible for loading all sorted widgets types
     *
     * @returns {Promise<DashboardWidgetVO[]>}
     */
    public static async get_all_sorted_widgets_types(): Promise<DashboardWidgetVO[]> {

        const sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .set_sort(new SortByVO(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().weight, true))
            .set_max_age_ms(120000) // 2 minutes pas vraiment de raison de rafraîchir les types de widgets
            .select_vos<DashboardWidgetVO>();


        return sorted_widgets;
    }
}
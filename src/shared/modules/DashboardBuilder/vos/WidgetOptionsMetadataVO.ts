import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import FieldValueFilterWidgetOptionsVO from "./FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "./MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "./YearFilterWidgetOptionsVO";

/**
 * WidgetOptionsMetadataVO
 *  - All metadata related to a widget_options
 */
export default class WidgetOptionsMetadataVO extends AbstractVO {

    public widget_options: any | FieldValueFilterWidgetOptionsVO | YearFilterWidgetOptionsVO | MonthFilterWidgetOptionsVO;

    public widget_name: string;

    public page_widget_id: number;

    public page_widget: DashboardPageWidgetVO;
}
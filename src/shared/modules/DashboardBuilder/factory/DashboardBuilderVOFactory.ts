import { FieldValueFilterWidgetOptionsVO } from "../vos/FieldValueFilterWidgetOptionsVO";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";

/**
 * DashboardBuilderVOFactory
 */
export class DashboardBuilderVOFactory {

    public static create_widget_vo() {

    }

    public static create_widget_options_vo_by_name(name: string, props?: any) {
        switch (name) {
            case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                return new FieldValueFilterWidgetOptionsVO().from(props);
            case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                return new MonthFilterWidgetOptionsVO().from(props);
            case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                return new YearFilterWidgetOptionsVO().from(props);
            default:
                throw new Error(`Factory for the given WidgetOptionsVO ` +
                    `name: "${name}" is not implemented yet!`);
        }
    }
}
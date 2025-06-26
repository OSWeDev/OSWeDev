
import { Scale } from "chart.js";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";

/**
 * The VarChartOptionsVO
 *
 * - To be able to configure a chart widget
 */
export default class VarChartScalesOptionsVO extends AbstractVO {
    public static TITLE_CODE_PREFIX: string = "VarChartScalesOptions.title.";

    public constructor(
        public chart_id?: number,
        public scale_options?: Partial<Scale>,
        public filter_type?: string,
        public filter_additional_params?: string,
        public show_scale_title?: boolean,
        public page_widget_id?: number,
        public selected_position?: string,
        public fill?: boolean,
        public stacked?: boolean
    ) {
        super();
    }
}
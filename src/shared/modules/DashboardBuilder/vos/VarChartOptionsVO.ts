
import AbstractVO from "../../VO/abstract/AbstractVO";
/**
 * The VarChartOptionsVO
 *
 * - To be able to configure a chart widget
 */
export default class VarChartOptionsVO extends AbstractVO {

    constructor(
        public chart_id?: number,
        public var_id?: number, // May have many chart with the same var_id

        public custom_filter_names?: { [field_id: string]: string },
        public selected_filter_id?: number,
        public selected_filter_name?: string,
        public type?: string,  // The type of the graph (line, bar, radar)
        public bg_color?: string,
        public border_color?: string,
        public border_width?: number,
        public has_gradient?: boolean,
        public show_values?: boolean,
        public show_zeros?: boolean,
        public filter_type?: string,
        public color_palette?: string[],
        public filter_additional_params?: string,
        public stacked?: boolean,
        public fill?: boolean
    ) {
        super();
    }
}
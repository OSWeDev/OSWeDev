
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

        public type?: string,  // The type of the graph (line, bar, radar)
        public bg_color?: string,
        public border_color?: string,
        public border_width?: number,
    ) {
        super();
    }
}
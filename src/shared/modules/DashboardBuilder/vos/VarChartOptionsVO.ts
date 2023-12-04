
import { Scale } from "chart.js";
import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * The VarChartOptionsVO
 *
 * - To be able to configure a chart widget
 */
export default class VarChartOptionsVO extends AbstractVO {

    constructor(
        public var_id?: number,

        public filter_custom_field_filters?: { [field_id: string]: string },

        public bg_color?: string,
        public border_color?: string,
        public border_width?: number,
        public scale_options_x?: Partial<Scale>,
        public scale_options_y?: Partial<Scale>,
        public scale_options_r?: Partial<Scale>,
    ) {
        super();
    }
}
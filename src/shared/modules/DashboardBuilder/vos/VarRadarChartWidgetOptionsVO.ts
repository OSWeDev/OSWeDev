import TimeSegment from "../../DataRender/vos/TimeSegment";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * Radar chart widget options
 *  - To be able to configure a radar chart widget
 *  - We may configure 2 vars with the same dimension
 */
export default class VarRadarChartWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarRadarChartWidgetOptions.title.";


    public constructor(

        /**
         * Paramètres du widget
         */
        public bg_color?: string,

        /**
         * Paramètres du graph
         */
        public legend_display?: boolean,
        public legend_position?: string,
        public legend_font_color?: string,
        public legend_font_size?: number,
        public legend_box_width?: number,
        public legend_padding?: number,
        public legend_use_point_style?: boolean,

        public title_display?: boolean,
        public title_font_color?: string,
        public title_font_size?: number,
        public title_padding?: number,

        // --- Specify the field tu customize the RadarChart ---

        public has_dimension?: boolean,
        public max_dimension_values?: number, // Permet de limiter le nombre de vars affichées (par défaut 10)
        public sort_dimension_by_vo_field_ref?: VOFieldRefVO,
        public sort_dimension_by_asc?: boolean,

        /**
         * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
         */
        public dimension_is_vo_field_ref?: boolean,
        public dimension_vo_field_ref?: VOFieldRefVO,
        public dimension_custom_filter_name?: string,
        public dimension_custom_filter_segment_type?: number,

        /**
         * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
         *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
         */
        public filter_type?: string,
        public filter_additional_params?: string,

        /**
         * Var 1
         */
        public var_id_1?: number,

        public filter_custom_field_filters_1?: { [field_id: string]: string },

        public bg_color_1?: string,
        public border_color_1?: string,
        public border_width_1?: number,
        /**
         * Var 2 si pas de dimension
         */
        public var_id_2?: number,

        public filter_custom_field_filters_2?: { [field_id: string]: string },

        public bg_color_2?: string,
        public border_color_2?: string,
        public border_width_2?: number,

        public max_is_sum_of_var_1_and_2?: boolean, // Si on a pas de dimension, on peut choisir de comparer la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)

        public multiple_dataset_vo_field_ref?: VOFieldRefVO,
        public max_dataset_values?: number,  // Permet de limiter le nombre de datasets affichés (par défaut 10)
        public hide_filter?: boolean,
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            let options = JSON.parse(page_widget.json_options) as VarRadarChartWidgetOptionsVO;

            if (options && options.has_dimension && options.dimension_is_vo_field_ref && options.dimension_vo_field_ref) {
                return {
                    [options.dimension_vo_field_ref.api_type_id]: {
                        [options.dimension_vo_field_ref.field_id]: true
                    }
                };
            }
        }
        return {};
    }

    public static createDefault() {
        return new VarRadarChartWidgetOptionsVO(

            /**
             * Paramètres du widget
             */
            null,

            /**
             * Paramètres du graph
             */
            true,
            'top',
            '#666',
            12,
            40,
            10,
            false,

            false,
            '#666',
            16,
            10,

            // 50, // 0-100 - exemples : donut 50, camembert 0
            // 270, // 0-360 - exemples : donut 270, camembert 0
            // 180, // 0-180 - exemples : donut 180, camembert 0

            true,
            10, // Permet de limiter le nombre de vars affichées (par défaut 10)
            null,
            true,

            /**
             * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
             */
            true,
            null,
            null,
            TimeSegment.TYPE_YEAR,

            /**
             * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
             *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
             */
            null,
            null,

            /**
             * Var 1
             */
            null,

            {},

            "#ff1a1a",
            null,
            null,

            /**
             * Var 2 si pas de dimension
             */
            null,

            {},

            null,
            '#666',
            null,

            false,
            null,
            10,
            false
        );
    }
}
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VarConfVO from "../../Var/vos/VarConfVO";
import VOFieldRefVO from "./VOFieldRefVO";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import VarChartOptionsVO from "./VarChartOptionsVO";

/**
 * Line chart widget options
 *  - To be able to configure a line chart widget
 *  - We may configure 2 vars with the same dimension
 */
export default class VarMixedChartWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarMixedChartWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            let options = JSON.parse(page_widget.json_options) as VarMixedChartWidgetOptionsVO;

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
        return new VarMixedChartWidgetOptionsVO(

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

            false,
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
             * VarChartOptionsVO
             */
            [],
        );
    }


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

        // --- Specify the field tu customize the LineChart ---

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

        // --- Var Options We should be able to add as many vars as we can ---
        public var_charts_options?: VarChartOptionsVO[],
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_var_name_code_text(page_widget_id: number, var_id: number): string {

        if ((!page_widget_id) || (!var_id)) {
            return null;
        }

        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        for (const key in this.var_charts_options) {
            const var_chart_options = this.var_charts_options[key];

            const placeholder_name_code_text_var_id: string = this.get_var_name_code_text(
                page_widget_id,
                var_chart_options.var_id
            );

            if (placeholder_name_code_text_var_id) {
                res[placeholder_name_code_text_var_id] =
                    VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX +
                    '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + var_chart_options.var_id + '}}' +
                    '.' +
                    '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                    DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            }
        }

        return res;
    }
}
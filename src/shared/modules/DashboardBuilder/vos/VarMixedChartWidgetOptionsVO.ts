import { Scale } from "chart.js";
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VarChartOptionsVO from "./VarChartOptionsVO";
import VarConfVO from "../../Var/vos/VarConfVO";
import VOFieldRefVO from "./VOFieldRefVO";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import VarChartScalesOptionsVO from "./VarChartScalesOptionsVO";

/**
 * Line chart widget options
 */
export default class VarMixedChartWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarMixedChartWidgetOptions.title.";

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
        public detailed?: boolean,
        public title_font_color?: string,
        public title_font_size?: number,
        public title_padding?: number,

        // --- Specify the field tu customize the LineChart ---

        public has_dimension?: boolean,
        public max_dimension_values?: number, // Permet de limiter le nombre de vars affichées (par défaut 10)
        public sort_dimension_by_vo_field_ref?: VOFieldRefVO,
        public sort_dimension_by_asc?: boolean,
        public sort_dimension_by_vo_field_ref_label?: VOFieldRefVO,

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
        public var_chart_scales_options?: VarChartScalesOptionsVO[],

        public scale_x_title?: string,
        public scale_y_title?: string,
        public show_scale_x?: boolean,
        public show_scale_y?: boolean,
        public scale_options_x?: Partial<Scale>,
        public scale_options_y?: Partial<Scale>,
        public scale_options_r?: Partial<Scale>,
        public hide_filter?: boolean,
        public multiple_dataset_vo_field_ref?: VOFieldRefVO,
        public max_dataset_values?: number,  // Permet de limiter le nombre de datasets affichés (par défaut 10)
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            const options = JSON.parse(page_widget.json_options) as VarMixedChartWidgetOptionsVO;
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
            true,
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
            null,
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
            [],
            '',
            '',
            false,
            false,
            null,
            null,
            null,
            false,
            null,
            10,
        );
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_scale_x_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        this.scale_x_title = VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + '.scale_x' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + '.scale_x' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_scale_y_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + '.scale_y' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_var_name_code_text(page_widget_id: number, var_id: number, chart_id?: number): string {

        if ((!page_widget_id) || (!var_id) || (!chart_id)) {
            return null;
        }

        return VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + '.' + chart_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
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
                    DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            }
        }

        return res;
    }
}
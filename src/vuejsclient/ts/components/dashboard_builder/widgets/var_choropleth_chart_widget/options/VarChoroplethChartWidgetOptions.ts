import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import TimeSegment from "../../../../../../../shared/modules/DataRender/vos/TimeSegment";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../../../../../shared/modules/Var/vos/VarConfVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

/**
 * On va gérer 2 types de paramétrages :
 *  - soit 1 var et une dimension :
 *      - exemple var_id 15 et sur cette var on a un ts_ranges, on le propose en dimension et on doit choisir le segment_type (dont la segmentation minimale
 *          est le segment_type du ts_ranges)
 *  - Soit 2 vars sans dimension :
 *      - exemple on veut un donut à 50% de circonférence et on compare la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
 */
export default class VarChoroplethChartWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarChoroplethChartWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            const options = JSON.parse(page_widget.json_options) as VarChoroplethChartWidgetOptions;

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

    public constructor(

        /**
         * Paramètres du widget
         */
        public bg_color: string,

        /**
         * Paramètres du graph
         */
        public legend_display: boolean,
        public label_display: boolean,
        public legend_position: string,
        public legend_font_color: string,
        public legend_font_size: number,
        public legend_box_width: number,
        public legend_padding: number,
        public legend_use_point_style: boolean,

        public title_display: boolean,
        public title_font_color: string,
        public title_font_size: number,
        public title_padding: number,

        public has_dimension: boolean,
        public max_dimension_values: number, // Permet de limiter le nombre de vars affichées (par défaut 10)
        public sort_dimension_by_vo_field_ref: VOFieldRefVO,
        public sort_dimension_by_asc: boolean,

        /**
         * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
         */
        public dimension_is_vo_field_ref: boolean,
        public dimension_vo_field_ref: VOFieldRefVO,
        public dimension_custom_filter_name: string,
        public dimension_custom_filter_segment_type: number,

        public filter_type: string,
        public filter_additional_params: string,
        /**
         * Var 1
         */
        public var_id_1: number,

        public filter_custom_field_filters_1: { [field_id: string]: string },

        public color_palette: string[],
        public bg_colors: string[],
        public bg_gradient: boolean,
        public bg_color_1: string,
        public border_color_1: string,
        public border_width_1: number,

    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return VarChoroplethChartWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_var_name_code_text(page_widget_id: number, var_id: number): string {

        if ((!page_widget_id) || (!var_id)) {
            return null;
        }
        return VarChoroplethChartWidgetOptions.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarChoroplethChartWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }

        if (this.var_id_1) {

            const placeholder_name_code_text_var_id_1: string = this.get_var_name_code_text(page_widget_id, this.var_id_1);
            if (placeholder_name_code_text_var_id_1) {

                res[placeholder_name_code_text_var_id_1] =
                    VarChoroplethChartWidgetOptions.TITLE_CODE_PREFIX +
                    '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id_1 + '}}' +
                    '.' +
                    '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                    DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
            }
        }
        return res;
    }

    public static createDefault() {
        return new VarChoroplethChartWidgetOptions(

            /**
             * Paramètres du widget
             */
            '#f00',

            /**
             * Paramètres du graph
             */
            true,
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
            null,
            null,

            /**
             * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
             *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
             */
            null,


            {},
            [],
            [],
            false,
            null,

            null,
            0
        );
    }
}
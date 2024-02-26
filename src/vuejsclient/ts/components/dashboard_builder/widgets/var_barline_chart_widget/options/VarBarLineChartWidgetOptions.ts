import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../../../../../shared/modules/Var/vos/VarConfVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";
import VarBarLineDatasetChartWidgetOptions from "./dataset/VarBarLineDatasetChartWidgetOptions";

/**
 * On va gérer 2 types de paramétrages :
 *  - soit 1 var et une dimension :
 *      - exemple var_id 15 et sur cette var on a un ts_ranges, on le propose en dimension et on doit choisir le segment_type (dont la segmentation minimale
 *          est le segment_type du ts_ranges)
 *  - Soit 2 vars sans dimension :
 *      - exemple on veut un donut à 50% de circonférence et on compare la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
 */
export default class VarBarLineChartWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarBarLineChartWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            let options = JSON.parse(page_widget.json_options) as VarBarLineChartWidgetOptions;

            if (options && options.dimension_is_vo_field_ref && options.dimension_vo_field_ref) {
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

        /**
         * Axis confs
         */
        public show_x_axis: boolean,
        public x_axis_color: string,
        public x_axis_drawTicks: boolean,
        public x_axis_font_color: string,
        public x_axis_font_size: number,
        public show_y_axis: boolean, // pour le moment on ne gère pas plusieurs axes y
        public y_axis_color: string,
        public y_axis_drawTicks: boolean,
        public y_axis_font_color: string,
        public y_axis_font_size: number,
        public y_axis_stacked: boolean, // Stacker les datasets sur cet axe

        /**
         * Configuration de l'axe des X
         */
        public max_dimension_values: number, // Permet de limiter le nombre de vars affichées (par défaut 20)
        public sort_dimension_by_vo_field_ref: VOFieldRefVO,
        public sort_dimension_by_asc: boolean,

        /**
         * on défini le champ ref ou le custom filter, et le segment_type
         */
        public dimension_is_vo_field_ref: boolean,
        public dimension_vo_field_ref: VOFieldRefVO,
        public dimension_custom_filter_name: string,
        public dimension_custom_filter_segment_type: number,

        /**
         * Datasets
         */
        public datasets: VarBarLineDatasetChartWidgetOptions[]
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return VarBarLineChartWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_var_name_code_text(page_widget_id: number, var_id: number): string {

        if ((!page_widget_id) || (!var_id)) {
            return null;
        }
        return VarBarLineChartWidgetOptions.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarBarLineChartWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }

        if (this.datasets && this.datasets.length) {

            for (let i in this.datasets) {
                let dataset = this.datasets[i];

                let placeholder_name_code_text_var_id_1: string = this.get_var_name_code_text(page_widget_id, dataset.var_id);
                if (placeholder_name_code_text_var_id_1) {

                    res[placeholder_name_code_text_var_id_1] =
                        VarBarLineChartWidgetOptions.TITLE_CODE_PREFIX +
                        '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + dataset.var_id + '}}' +
                        '.' +
                        '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                        DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                }
            }
        }

        return res;
    }
}
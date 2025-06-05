import VarChartScaleOptionsVO from "./VarChartScaleOptionsVO";
import VarChartWidgetOptionsBaseVO from "./VarChartWidgetOptionsBaseVO";

/**
 * Radar chart widget options
 *  - To be able to configure a radar chart widget
 *  - We may configure 2 vars with the same dimension
 */
export default class VarRadarChartWidgetOptionsVO extends VarChartWidgetOptionsBaseVO {

    // public static TITLE_CODE_PREFIX: string = "VarRadarChartWidgetOptions.title.";

    public static API_TYPE_ID: string = "var_radar_chart_widget_options";
    public _type: string = VarRadarChartWidgetOptionsVO.API_TYPE_ID;

    /**
     * Si on a pas de dimension, on peut choisir de comparer la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
     * Anciennement max_is_sum_of_var_1_and_2 mais on généralise pour x vars
     */
    public max_is_sum: boolean;

    /**
     * Anciennement multiple_dataset_vo_field_ref
     */
    public multiple_dataset_vo_field_ref_id: number;

    /**
     * Permet de limiter le nombre de datasets affichés (par défaut 10)
     */
    public max_dataset_values: number;

    public var_chart_scales_options: VarChartScaleOptionsVO[]; // On peut en avoir plusieurs ?

    // public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
    //     if (page_widget.json_options) {
    //         let options = JSON.parse(page_widget.json_options) as VarRadarChartWidgetOptionsVO;

    //         if (options && options.has_dimension && options.dimension_is_vo_field_ref && options.dimension_vo_field_ref) {
    //             return {
    //                 [options.dimension_vo_field_ref.api_type_id]: {
    //                     [options.dimension_vo_field_ref.field_id]: true
    //                 }
    //             };
    //         }
    //     }
    //     return {};
    // }

    // public static createDefault() {
    //     return new VarRadarChartWidgetOptionsVO(

    //         /**
    //          * Paramètres du widget
    //          */
    //         null,

    //         /**
    //          * Paramètres du graph
    //          */
    //         true,
    //         'top',
    //         '#666',
    //         12,
    //         40,
    //         10,
    //         false,

    //         false,
    //         '#666',
    //         16,
    //         10,

    //         // 50, // 0-100 - exemples : donut 50, camembert 0
    //         // 270, // 0-360 - exemples : donut 270, camembert 0
    //         // 180, // 0-180 - exemples : donut 180, camembert 0

    //         true,
    //         10, // Permet de limiter le nombre de vars affichées (par défaut 10)
    //         null,
    //         true,

    //         /**
    //          * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
    //          */
    //         true,
    //         null,
    //         null,
    //         TimeSegment.TYPE_YEAR,

    //         /**
    //          * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
    //          *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
    //          */
    //         null,
    //         null,

    //         /**
    //          * Var 1
    //          */
    //         null,

    //         {},

    //         "#ff1a1a",
    //         null,
    //         null,

    //         /**
    //          * Var 2 si pas de dimension
    //          */
    //         null,

    //         {},

    //         null,
    //         '#666',
    //         null,

    //         false,
    //         null,
    //         10,
    //         false
    //     );
    // }

    // public get_title_name_code_text(page_widget_id: number): string {

    //     if (!page_widget_id) {
    //         return null;
    //     }

    //     return VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

    // public get_var_name_code_text(page_widget_id: number, var_id: number): string {

    //     if ((!page_widget_id) || (!var_id)) {
    //         return null;
    //     }

    //     return VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

    // public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
    //     let res: { [exportable_code_text: string]: string } = {};

    //     let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
    //     if (placeholder_name_code_text) {

    //         res[placeholder_name_code_text] =
    //             VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX +
    //             '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //             DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //     }

    //     if (this.var_id_1) {

    //         let placeholder_name_code_text_var_id_1: string = this.get_var_name_code_text(page_widget_id, this.var_id_1);
    //         if (placeholder_name_code_text_var_id_1) {

    //             res[placeholder_name_code_text_var_id_1] =
    //                 VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX +
    //                 '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id_1 + '}}' +
    //                 '.' +
    //                 '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //                 DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //         }
    //     }

    //     if (this.var_id_2) {

    //         let placeholder_name_code_text_var_id_2: string = this.get_var_name_code_text(page_widget_id, this.var_id_2);
    //         if (placeholder_name_code_text_var_id_2) {

    //             res[placeholder_name_code_text_var_id_2] =
    //                 VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX +
    //                 '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id_2 + '}}' +
    //                 '.' +
    //                 '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //                 DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //         }
    //     }

    //     return res;
    // }
}
import NumRange from "../../../DataRender/vos/NumRange";
import WidgetOptionsBaseVO from "./WidgetOptionsBaseVO";
import ValueFilterVO from "./tools/ValueFilterVO";

/**
 * On va gérer 2 types de paramétrages :
 *  - soit 1 var et une dimension :
 *      - exemple var_id 15 et sur cette var on a un ts_ranges, on le propose en dimension et on doit choisir le segment_type (dont la segmentation minimale
 *          est le segment_type du ts_ranges)
 *  - Soit 2 vars sans dimension :
 *      - exemple on veut un donut à 50% de circonférence et on compare la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
 */
export default class VarPieChartWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static LEGEND_POSITION_TOP: number = 0;
    public static LEGEND_POSITION_BOTTOM: number = 1;
    public static LEGEND_POSITION_LEFT: number = 2;
    public static LEGEND_POSITION_RIGHT: number = 3;
    public static LEGEND_POSITION_CHART_AREA: number = 4;
    public static LEGEND_POSITION_LABELS: { [position: number]: string } = {
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_TOP]: "VarPieChartWidgetOptionsVO.LEGEND_POSITION_TOP",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_BOTTOM]: "VarPieChartWidgetOptionsVO.LEGEND_POSITION_BOTTOM",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_LEFT]: "VarPieChartWidgetOptionsVO.LEGEND_POSITION_LEFT",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_RIGHT]: "VarPieChartWidgetOptionsVO.LEGEND_POSITION_RIGHT",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_CHART_AREA]: "VarPieChartWidgetOptionsVO.LEGEND_POSITION_CHART_AREA",
    };

    public static LEGEND_POSITION_ENUM_TO_CSS: { [position_enum: number]: string } = {
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_TOP]: "top",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_BOTTOM]: "bottom",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_LEFT]: "left",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_RIGHT]: "right",
        [VarPieChartWidgetOptionsVO.LEGEND_POSITION_CHART_AREA]: "chartArea",
    };

    public static TITLE_CODE_PREFIX: string = "VarPieChartWidgetOptions.title.";

    public static API_TYPE_ID: string = "var_pie_chart_widget_options";

    public _type: string = VarPieChartWidgetOptionsVO.API_TYPE_ID;
    public id: number;

    /**
     * Paramètres du graph
     */
    public label_display: boolean;

    public legend_display: boolean;

    /**
     * Position de la légende : Anciennement string !
     */
    public legend_position: number;

    /**
     * Style de la légende :
     *  Anciennement legend_font_color et legend_font_size, et qui peut contenir beaucoup plus d'infos du coup
     */
    public legend_font_style_id: number;

    /**
     * Padding de la légende, pour gérer le padding entre les items de la légende
     */
    public legend_padding_id: number;

    public legend_box_width: number;
    public legend_use_point_style: boolean;

    public cutout_percentage: number; // 0-100 - exemples : donut 50, camembert 0
    public rotation: number; // 0-360 - exemples : gauge 270, camembert 0
    public circumference: number; // 0-360 - exemples : gauge 180, camembert 0

    public has_dimension: boolean;
    public max_dimension_values: number; // Permet de limiter le nombre de vars affichées (par défaut 10)

    /**
     * Anciennement VOFieldRefVO, maintenant ref à Moduletablefieldvo
     */
    public sort_dimension_by_vo_field_ref_id: number;
    public sort_dimension_by_asc: boolean;

    /**
     * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
     */
    public dimension_is_vo_field_ref: boolean;

    /**
     * Anciennement VOFieldRefVO, maintenant ref à Moduletablefieldvo
     */
    public dimension_vo_field_ref_id: number;

    public dimension_custom_filter_name: string;
    public dimension_custom_filter_segment_type: number;

    /**
     * La configuration du filtre de valeur => anciennement filter_type && filter_additional_params
     */
    public value_filter: ValueFilterVO;

    // /**
    //  * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
    //  *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
    //  */
    // public filter_type: string,
    // public filter_additional_params: string,

    /**
     * Var 1
     */
    public var_id_1: number;

    /**
     * Une interface spécifique pour ce type de champs est nécessaire pour gérer les filtres personnalisés
     */
    public filter_custom_field_filters_1: { [field_id: string]: string };

    /**
     * DashboardGraphColorPaletteVO
     * Anciennement color_palette
     */
    public color_palette_id: number;

    /**
     * Ordered ref ranges ! une interface spécifique pour ce type de champs est nécessaire :
     * Le champs de sélection => quand on sélectionne, ça l'ajoute dans une liste, et on peut réordonner les éléments de la liste / les retirer facilement
     * anciennement bg_colors
     * refs de ColorVO
     */
    public bg_color_id_ranges: NumRange[];
    public bg_gradient: boolean;

    /**
     * Anciennement bg_color_1
     * ref de ColorVO
     */
    public bg_color_1_id: number;

    /**
     * Anciennement border_color_1
     * ref de ColorVO
     */
    public border_color_1_id: number;

    public border_width_1: number;

    /**
     * Var 2 si pas de dimension
     */
    public var_id_2: number;

    public filter_custom_field_filters_2: { [field_id: string]: string };

    /**
     * Anciennement border_color_2
     * ref de ColorVO
     */
    public bg_color_2_id: number;

    /**
     * Anciennement border_color_2
     * ref de ColorVO
     */
    public border_color_2_id: number;

    public border_width_2: number;

    /**
     * Si on a pas de dimension, on peut choisir de comparer la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
     */
    public max_is_sum_of_var_1_and_2: boolean;

    // public static createDefault() {
    //     return new VarPieChartWidgetOptionsVO(

    //         /**
    //          * Paramètres du widget
    //          */
    //         '#e3dede',

    //         /**
    //          * Paramètres du graph
    //          */
    //         true,
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

    //         0, // 0-100 - exemples : donut 50, camembert 0
    //         0, // 0-360 - exemples : donut 270, camembert 0
    //         360, // 0-180 - exemples : donut 180, camembert 0

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
    //         Filters.FILTER_TYPE_none,
    //         null,

    //         /**
    //          * Var 1
    //          */
    //         null,

    //         {},
    //         null,
    //         [],
    //         null,

    //         null,
    //         null,
    //         0,

    //         /**
    //          * Var 2 si pas de dimension
    //          */
    //         null,

    //         {},

    //         null,
    //         null,
    //         0,

    //         false,
    //         false
    //     );
    // }

    // public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
    //     if (page_widget.json_options) {
    //         let options = JSON.parse(page_widget.json_options) as VarPieChartWidgetOptionsVO;

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

    // public get_title_name_code_text(page_widget_id: number): string {

    //     if (!page_widget_id) {
    //         return null;
    //     }

    //     return VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

    // public get_var_name_code_text(page_widget_id: number, var_id: number): string {

    //     if ((!page_widget_id) || (!var_id)) {
    //         return null;
    //     }

    //     return VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

    // public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
    //     let res: { [exportable_code_text: string]: string } = {};

    //     let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
    //     if (placeholder_name_code_text) {

    //         res[placeholder_name_code_text] =
    //             VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX +
    //             '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //             DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //     }

    //     if (this.var_id_1) {

    //         let placeholder_name_code_text_var_id_1: string = this.get_var_name_code_text(page_widget_id, this.var_id_1);
    //         if (placeholder_name_code_text_var_id_1) {

    //             res[placeholder_name_code_text_var_id_1] =
    //                 VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX +
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
    //                 VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX +
    //                 '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id_2 + '}}' +
    //                 '.' +
    //                 '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //                 DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //         }
    //     }

    //     return res;
    // }
}
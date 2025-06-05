import VarChartVarOptionsVO from "./VarChartVarOptionsVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";
import ValueFilterVO from "../tools/ValueFilterVO";

export default abstract class VarChartWidgetOptionsBaseVO extends WidgetOptionsBaseVO {

    public static LEGEND_POSITION_TOP: number = 0;
    public static LEGEND_POSITION_BOTTOM: number = 1;
    public static LEGEND_POSITION_LEFT: number = 2;
    public static LEGEND_POSITION_RIGHT: number = 3;
    public static LEGEND_POSITION_CHART_AREA: number = 4;
    public static LEGEND_POSITION_LABELS: { [position: number]: string } = {
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_TOP]: "VarChartWidgetOptionsBaseVO.LEGEND_POSITION_TOP",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_BOTTOM]: "VarChartWidgetOptionsBaseVO.LEGEND_POSITION_BOTTOM",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_LEFT]: "VarChartWidgetOptionsBaseVO.LEGEND_POSITION_LEFT",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_RIGHT]: "VarChartWidgetOptionsBaseVO.LEGEND_POSITION_RIGHT",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_CHART_AREA]: "VarChartWidgetOptionsBaseVO.LEGEND_POSITION_CHART_AREA",
    };

    public static LEGEND_POSITION_ENUM_TO_CSS: { [position_enum: number]: string } = {
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_TOP]: "top",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_BOTTOM]: "bottom",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_LEFT]: "left",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_RIGHT]: "right",
        [VarChartWidgetOptionsBaseVO.LEGEND_POSITION_CHART_AREA]: "chartArea",
    };

    public id: number;

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
     * Anciennement sort_dimension_by_vo_field_ref_label VOFieldRefVO, maintenant ref à Moduletablefieldvo
     */
    public dimension_vo_field_ref_id: number;

    public dimension_custom_filter_name: string;
    public dimension_custom_filter_segment_type: number;

    /**
     * La configuration du filtre de valeur => anciennement filter_type && filter_additional_params
     */
    public value_filter: ValueFilterVO;

    /**
     * Liste des configs de vars pour les séries
     */
    public var_charts_options: VarChartVarOptionsVO[];

}
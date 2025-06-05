import { Tick } from "chart.js/dist/core/core.scale";
import IDistantVOBase from "../../../../IDistantVOBase";
import ValueFilterVO from "../tools/ValueFilterVO";

export default class VarChartScaleOptionsVO implements IDistantVOBase {

    public static POSITION_TOP: number = 0;
    public static POSITION_BOTTOM: number = 1;
    public static POSITION_LEFT: number = 2;
    public static POSITION_RIGHT: number = 3;
    public static POSITION_CENTER: number = 4;
    public static POSITION_LABELS: { [position: number]: string } = {
        [VarChartScaleOptionsVO.POSITION_TOP]: "VarChartScaleOptionsVO.POSITION_TOP",
        [VarChartScaleOptionsVO.POSITION_BOTTOM]: "VarChartScaleOptionsVO.POSITION_BOTTOM",
        [VarChartScaleOptionsVO.POSITION_LEFT]: "VarChartScaleOptionsVO.POSITION_LEFT",
        [VarChartScaleOptionsVO.POSITION_RIGHT]: "VarChartScaleOptionsVO.POSITION_RIGHT",
        [VarChartScaleOptionsVO.POSITION_CENTER]: "VarChartScaleOptionsVO.POSITION_CENTER",
    };

    public static POSITION_ENUM_TO_CSS: { [position_enum: number]: string } = {
        [VarChartScaleOptionsVO.POSITION_TOP]: "top",
        [VarChartScaleOptionsVO.POSITION_BOTTOM]: "bottom",
        [VarChartScaleOptionsVO.POSITION_LEFT]: "left",
        [VarChartScaleOptionsVO.POSITION_RIGHT]: "right",
        [VarChartScaleOptionsVO.POSITION_CENTER]: "center",
    };

    public static AXIS_X: number = 0;
    public static AXIS_Y: number = 1;
    public static AXIS_R: number = 2; // Pour les radiaux
    public static AXIS_LABELS: { [axis: number]: string } = {
        [VarChartScaleOptionsVO.AXIS_X]: "var_chart_scales_options.axis.x",
        [VarChartScaleOptionsVO.AXIS_Y]: "var_chart_scales_options.axis.y",
        [VarChartScaleOptionsVO.AXIS_R]: "var_chart_scales_options.axis.r",
    };
    public static AXIS_ENUM_TO_CHART_JS: { [axis_enum: number]: string } = {
        [VarChartScaleOptionsVO.AXIS_X]: "x",
        [VarChartScaleOptionsVO.AXIS_Y]: "y",
        [VarChartScaleOptionsVO.AXIS_R]: "r",
    };

    public static TITLE_CODE_PREFIX: string = "VarChartScalesOptions.title.";
    public static API_TYPE_ID: string = "var_chart_scales_options";

    public _type: string = VarChartScaleOptionsVO.API_TYPE_ID;
    public id: number;

    public chart_id: number;

    public max_width: number;
    public max_height: number;

    public padding_top: number;
    public padding_bottom: number;
    public padding_left: number;
    public padding_right: number;

    public axis: number;

    public labelRotation: number;
    public min: number;
    public max: number;

    public ticks: Tick[];

    /**
     * La configuration du filtre de valeur => anciennement filter_type && filter_additional_params
     */
    public value_filter: ValueFilterVO;

    public show_scale_title: boolean;

    public page_widget_id: number;

    public selected_position: number;

    public fill: boolean;
    public stacked: boolean;

    // public get_title_name_code_text(page_widget_id: number, chart_id: number): string {

    //     if (!page_widget_id) {
    //         return null;
    //     }

    //     return VarChartScalesOptionsVO.TITLE_CODE_PREFIX + page_widget_id + '.' + chart_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

}
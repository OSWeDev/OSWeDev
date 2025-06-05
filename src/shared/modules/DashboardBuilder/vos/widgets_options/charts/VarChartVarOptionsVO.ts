import IDistantVOBase from "../../../../IDistantVOBase";
import FontStyleVO from "../styles/FontStyleVO";
import ValueFilterVO from "../tools/ValueFilterVO";

export default class VarChartVarOptionsVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_chart_var_options";

    public _type: string = VarChartVarOptionsVO.API_TYPE_ID;
    public id: number;

    public chart_id: number; // The chart id this options are for => vraiment utile ça ?

    public var_id: number;

    public custom_filter_names: { [field_id: string]: string };


    public selected_filter_id: number; // ?? je comprends pas ce que c'est
    public selected_filter_name: string;

    /**
     * The type of the graph (line, bar, radar)
     * JNE : et pourquoi  pas osef ?
     */
    public type: string;


    /**
     * Anciennement border_color
     * ref de ColorVO
     */
    public bg_color_id: number;

    /**
     * Anciennement border_color
     * ref de ColorVO
     */
    public border_color_id: number;

    /**
     * Anciennement border_width
     */
    public border_width: number;

    /**
     * Anciennement value_label_size
     */
    public value_label_style: FontStyleVO;

    public has_gradient: boolean;

    public show_values: boolean;
    public show_zeros: boolean;

    /**
     * La configuration du filtre de valeur => anciennement filter_type && filter_additional_params
     */
    public value_filter: ValueFilterVO;

    // /**
    //  * DashboardGraphColorPaletteVO
    //  * Anciennement color_palette
    // bisqareement dans VarChartOptionsVO on a  une ref de palette mais pkoi ? alors qu'on a une ref sur le widget de graph directement
    //  */
    // public color_palette_id: number;

    public stacked: boolean;
    public fill: boolean;
}
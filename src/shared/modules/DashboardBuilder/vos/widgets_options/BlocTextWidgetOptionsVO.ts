import WidgetOptionsBaseVO from "./WidgetOptionsBaseVO";

export default class BlocTextWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "bloc_text_widget_options";
    public _type: string = BlocTextWidgetOptionsVO.API_TYPE_ID;

    /**
     * Type HTML
     */
    public bloc_text: string;
}
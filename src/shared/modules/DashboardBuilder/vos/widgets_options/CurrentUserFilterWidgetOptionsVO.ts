import WidgetOptionsBaseVO from "./WidgetOptionsBaseVO";

export default class CurrentUserFilterWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "current_user_filter_widget_options";
    public _type: string = CurrentUserFilterWidgetOptionsVO.API_TYPE_ID;
}
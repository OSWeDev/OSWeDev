import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * FavoritesFiltersWidgetOptionsVO
 *  - Options for the FavoritesFiltersWidget
 */
export default class FavoritesFiltersWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "FavoritesFiltersWidgetOptionsVO.title.";

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public max_visible_options?: number,
        public can_configure_export?: boolean,
        public can_configure_date_filters?: boolean, // If true, the widget will allow the user to configure each Month/Year WidgetOptions for the export
        public send_email_with_export_notification?: boolean, // If true, the app will send to the user an email with a notification of export
    ) {
        super();
    }
}
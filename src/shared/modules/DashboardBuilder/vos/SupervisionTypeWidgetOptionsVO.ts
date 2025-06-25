import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";

/**
 * SupervisionTypeWidgetOptionsVO
 *  - TODO: May be rename to SupervisionTypeFilterWidgetOptionsVO
 */
export default class SupervisionTypeWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "SupervisionTypeWidgetOptionsVO.title.";
    public static FIELD_ID_INDICATOR: string = 'id';

    public constructor(
        /**
         * Used to filter the supervision probes from each datatable
         */
        public supervision_api_type_ids?: string[],
        /**
         * if true, the supervision probes will be ordered by categories
         */
        public order_by_categories?: boolean,
        /***
         *  if true, the supervision probes will display a counter
         */
        public show_counter?: boolean,
        public refresh_button?: boolean,
        public auto_refresh?: boolean,
        public auto_refresh_seconds?: number,
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        return res;
    }
}
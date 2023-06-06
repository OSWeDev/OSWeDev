
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import VOFieldRefVO from "../vos/VOFieldRefVO";
import { isEmpty } from 'lodash';

/**
 * @class VOFieldRefVOManager
 */
export default class VOFieldRefVOManager {

    /**
     * Create Readable Label From VOFieldRefVO
     * - This method is responsible for creating the readable label from a VOFieldRefVO
     *
     * TODO: Maybe we should move this method to WidgetOptionsVOManager
     *
     * @return {string}
     */
    public static async create_readable_vo_field_ref_label(
        vo_field_ref: { api_type_id: string, field_id: string },
        page_id?: number
    ): Promise<string> {

        // Get sorted_page_widgets_options from dashboard
        let sorted_page_widgets_options = null;
        if (page_id) {
            sorted_page_widgets_options = await DashboardPageWidgetVOManager.find_all_wigdets_options_metadata_by_page_id(page_id);
        } else {
            sorted_page_widgets_options = DashboardPageWidgetVOManager.find_all_sorted_page_wigdets_options();
        }

        let page_wigdet_options = null;
        // Label of filter to be displayed
        let label: string = null;

        if (!(vo_field_ref instanceof VOFieldRefVO)) {
            // Path to find the actual filter
            vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                { vo_field_ref },
            );
        }

        if (!isEmpty(sorted_page_widgets_options)) {
            // Get the page_wigdet_options from sorted_page_widgets_options
            // - The page_wigdet_options is used to get the label of the filter
            page_wigdet_options = Object.values(sorted_page_widgets_options)?.filter((sorted_page_widget_option: any) => {
                const widget_options = sorted_page_widget_option?.widget_options;
                const _vo_field_ref = widget_options?.vo_field_ref;

                const has_api_type_id = _vo_field_ref?.api_type_id === vo_field_ref.api_type_id;
                const has_field_id = _vo_field_ref?.field_id === vo_field_ref.field_id;

                if (widget_options?.is_vo_field_ref === false) {
                    return widget_options?.custom_filter_name === vo_field_ref.field_id;
                }

                return has_api_type_id && has_field_id;
            })?.shift();
        }

        if (page_wigdet_options?.page_widget_id) {
            label = (vo_field_ref as VOFieldRefVO).get_translatable_name_code_text(page_wigdet_options.page_widget_id);
        }

        label = (label?.length > 0) ? label : `${vo_field_ref.api_type_id}.${vo_field_ref.field_id}`;

        return label;
    }

    /**
     * Create a VOFieldRefVO from a widget_options
     *
     * @param {any} widget_options
     * @returns {VOFieldRefVO}
     */
    public static create_vo_field_ref_vo_from_widget_options(
        widget_options: {
            vo_field_ref: {
                api_type_id: string,
                field_id: string
            }
            custom_filter_name?: string,
            is_vo_field_ref?: boolean,
        }
    ): VOFieldRefVO {

        let vo_field_ref: Partial<VOFieldRefVO> = widget_options?.vo_field_ref;

        if (!(vo_field_ref instanceof VOFieldRefVO)) {
            vo_field_ref = new VOFieldRefVO().from(vo_field_ref);
        }

        if (widget_options?.is_vo_field_ref === false) {
            vo_field_ref = new VOFieldRefVO().from({
                api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE,
                field_id: widget_options.custom_filter_name
            });
        }

        return vo_field_ref as VOFieldRefVO;
    }

    public static getInstance(): VOFieldRefVOManager {
        if (!VOFieldRefVOManager.instance) {
            VOFieldRefVOManager.instance = new VOFieldRefVOManager();
        }
        return VOFieldRefVOManager.instance;
    }

    protected static instance: VOFieldRefVOManager = null;
}
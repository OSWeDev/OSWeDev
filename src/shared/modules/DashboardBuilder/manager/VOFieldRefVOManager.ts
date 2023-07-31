
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import VOFieldRefVO from "../vos/VOFieldRefVO";
import { isEmpty } from 'lodash';

/**
 * @class VOFieldRefVOManager
 */
export default class VOFieldRefVOManager {

    /**
     * create_readable_vo_field_ref_label
     * - Create Readable Label From VOFieldRefVO
     * - This method is responsible for creating the readable label from a VOFieldRefVO
     *
     * TODO: Maybe we should move this method to WidgetOptionsVOManager
     *
     * @return {Promise<string>}
     */
    public static async create_readable_vo_field_ref_label(
        vo_field_ref: { api_type_id: string, field_id: string },
        page_id?: number
    ): Promise<string> {

        // Get widgets_options_metadata from dashboard
        let widgets_options_metadata = null;
        if (page_id) {
            widgets_options_metadata = await DashboardPageWidgetVOManager.find_all_widgets_options_metadata_by_page_id(page_id);
        } else {
            // TODO: To be removed
            widgets_options_metadata = DashboardPageWidgetVOManager.find_all_widgets_options_metadata();
        }

        let page_widget_options = null;
        // Label of filter to be displayed
        let label: string = null;

        if (!(vo_field_ref instanceof VOFieldRefVO)) {
            // Path to find the actual filter
            vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                { vo_field_ref },
            );
        }

        if (!isEmpty(widgets_options_metadata)) {
            // Get the page_widget_options from widgets_options_metadata
            // - The page_widget_options is used to get the label of the filter
            page_widget_options = Object.values(widgets_options_metadata)?.filter((sorted_page_widget_option: any) => {
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

        if (page_widget_options?.widget_options?.is_vo_field_ref === false) {
            label = page_widget_options?.widget_options?.custom_filter_name;

        } else if (page_widget_options?.page_widget_id) {
            label = (vo_field_ref as VOFieldRefVO).get_translatable_name_code_text(
                page_widget_options.page_widget_id
            );
        }

        label = (label?.length > 0) ? label : `${vo_field_ref.api_type_id}.${vo_field_ref.field_id}`;

        return label;
    }

    /**
     * Create a VOFieldRefVO from a widget_options
     * - Question: Is it a VOFieldRefVO if is_vo_field_ref is false ????
     * - Maybe we should call it FieldRefVO instead of VOFieldRefVO (as it is not a VO)
     *
     * @param {any} widget_options
     * @returns {VOFieldRefVO}
     */
    public static create_vo_field_ref_vo_from_widget_options(
        widget_options: {
            vo_field_ref?: {
                api_type_id: string,
                field_id: string
            }
            custom_filter_name?: string,
            is_vo_field_ref?: boolean,
        }
    ): VOFieldRefVO {

        if (!widget_options?.vo_field_ref && !widget_options?.custom_filter_name) {
            return null;
        }

        const vo_field_ref: Partial<VOFieldRefVO> = widget_options?.vo_field_ref;

        let api_type_id = vo_field_ref?.api_type_id;
        let field_id = vo_field_ref?.field_id;

        if (widget_options?.is_vo_field_ref === false) {
            api_type_id = ContextFilterVO.CUSTOM_FILTERS_TYPE;
            field_id = widget_options?.custom_filter_name;
        }

        return new VOFieldRefVO().from({
            api_type_id,
            field_id,
        });
    }

    public static getInstance(): VOFieldRefVOManager {
        if (!VOFieldRefVOManager.instance) {
            VOFieldRefVOManager.instance = new VOFieldRefVOManager();
        }
        return VOFieldRefVOManager.instance;
    }

    protected static instance: VOFieldRefVOManager = null;
}
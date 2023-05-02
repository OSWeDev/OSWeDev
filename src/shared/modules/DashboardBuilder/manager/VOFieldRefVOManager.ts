import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import VOFieldRefVO from "../vos/VOFieldRefVO";


/**
 * @class VOFieldRefVOManager
 */
export default class VOFieldRefVOManager {

    /**
     * Create a VOFieldRefVO from a widget_options
     *
     * @param {any} widget_options
     * @returns {VOFieldRefVO}
     */
    public static create_vo_field_ref_vo_from_widget_options(
        widget_options: {
            vo_field_ref: { api_type_id: string, field_id: string }
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
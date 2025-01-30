import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class ListObjectWidgetOptionsVO extends AbstractVO {

    public static TYPE_DISPLAY_CARD: number = 1;
    public static TYPE_DISPLAY_LIST: number = 2;

    public static TYPE_DISPLAY_LABELS: { [id: number]: string } = {
        [ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD]: 'ListObjectWidgetOptionsVO.type_display_card.___LABEL___',
        [ListObjectWidgetOptionsVO.TYPE_DISPLAY_LIST]: 'ListObjectWidgetOptionsVO.type_display_list.___LABEL___',
    };

    public static DISPLAY_ORIENTATION_HORIZONTAL: number = 1;
    public static DISPLAY_ORIENTATION_VERTICAL: number = 2;

    public static DISPLAY_ORIENTATION_LABELS: { [id: number]: string } = {
        [ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_HORIZONTAL]: 'ListObjectWidgetOptionsVO.display_orientation_horizontal.___LABEL___',
        [ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_VERTICAL]: 'ListObjectWidgetOptionsVO.display_orientation_vertical.___LABEL___',
    };

    public type_display: number;
    public display_orientation: number;
    public number_of_elements: number;
    public sort_dimension_by: string;
    public image_id: VOFieldRefVO;
    public title: VOFieldRefVO;
    public surtitre: VOFieldRefVO;
    public subtitle: VOFieldRefVO;
    public number: VOFieldRefVO;
    public sort_field_ref: VOFieldRefVO;
    public button_elements: boolean;
    public url: VOFieldRefVO;
    public blank: boolean;
    public is_card_display_single: boolean;
    public do_not_use_page_widget_ids?: number[];
    public show_message_no_data?: boolean;
    public message_no_data?: string;

    public static createNew(
        type_display: number,
        display_orientation: number,
        number_of_elements: number,
        sort_dimension_by: string,
        image_id: VOFieldRefVO,
        title: VOFieldRefVO,
        subtitle: VOFieldRefVO,
        surtitre: VOFieldRefVO,
        number: VOFieldRefVO,
        sort_field_ref: VOFieldRefVO,
        button_elements: boolean,
        url: VOFieldRefVO,
        blank: boolean,
        is_card_display_single: boolean,
        do_not_use_page_widget_ids?: number[],
        show_message_no_data?: boolean,
        message_no_data?: string,
    ): ListObjectWidgetOptionsVO {
        const res = new ListObjectWidgetOptionsVO();
        res.type_display = type_display;
        res.display_orientation = display_orientation;
        res.number_of_elements = number_of_elements;
        res.sort_dimension_by = sort_dimension_by;
        res.image_id = image_id;
        res.title = title;
        res.subtitle = subtitle;
        res.surtitre = surtitre;
        res.number = number;
        res.sort_field_ref = sort_field_ref;
        res.button_elements = button_elements;
        res.url = url;
        res.blank = blank;
        res.is_card_display_single = is_card_display_single;
        res.do_not_use_page_widget_ids = do_not_use_page_widget_ids;
        res.show_message_no_data = show_message_no_data;
        res.message_no_data = message_no_data;

        return res;
    }
}
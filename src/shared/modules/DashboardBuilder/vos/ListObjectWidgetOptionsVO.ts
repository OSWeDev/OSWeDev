import NumRange from "../../DataRender/vos/NumRange";
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
    public sort_field_ref: VOFieldRefVO;
    public button_elements: boolean;
    public url: VOFieldRefVO;
    public blank: boolean;
    public is_card_display_single: boolean;
    public do_not_use_page_widget_ids?: number[];
    public show_message_no_data?: boolean;
    public message_no_data?: string;
    public filter_on_cmv_vo: boolean;
    public field_filter_cmv_vo: VOFieldRefVO;
    public symbole_surtitre: string;
    public symbole_sous_titre: string;
    public filter_on_distant_vo: boolean;
    public field_filter_distant_vo: VOFieldRefVO;
    public zoom_on_click: boolean;
    public card_footer_label: VOFieldRefVO;
    public activate_like_button: boolean;


    public static createNew(
        type_display: number,
        display_orientation: number,
        number_of_elements: number,
        sort_dimension_by: string,
        image_id: VOFieldRefVO,
        title: VOFieldRefVO,
        subtitle: VOFieldRefVO,
        surtitre: VOFieldRefVO,
        sort_field_ref: VOFieldRefVO,
        button_elements: boolean,
        url: VOFieldRefVO,
        blank: boolean,
        is_card_display_single: boolean,
        filter_on_cmv_vo: boolean,
        field_filter_cmv_vo: VOFieldRefVO,
        filter_on_distant_vo: boolean,
        field_filter_distant_vo: VOFieldRefVO,
        zoom_on_click: boolean,
        card_footer_label: VOFieldRefVO,
        activate_like_button: boolean,

        do_not_use_page_widget_ids?: number[],
        show_message_no_data?: boolean,
        message_no_data?: string,
        symbole_surtitre?: string,
        symbole_sous_titre?: string,
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
        res.sort_field_ref = sort_field_ref;
        res.button_elements = button_elements;
        res.url = url;
        res.blank = blank;
        res.is_card_display_single = is_card_display_single;
        res.do_not_use_page_widget_ids = do_not_use_page_widget_ids;
        res.show_message_no_data = show_message_no_data;
        res.message_no_data = message_no_data;
        res.filter_on_cmv_vo = filter_on_cmv_vo;
        res.field_filter_cmv_vo = field_filter_cmv_vo;
        res.symbole_surtitre = symbole_surtitre;
        res.symbole_sous_titre = symbole_sous_titre;
        res.filter_on_distant_vo = filter_on_distant_vo;
        res.field_filter_distant_vo = field_filter_distant_vo;
        res.zoom_on_click = zoom_on_click;
        res.card_footer_label = card_footer_label;
        res.activate_like_button = activate_like_button;

        return res;
    }
}
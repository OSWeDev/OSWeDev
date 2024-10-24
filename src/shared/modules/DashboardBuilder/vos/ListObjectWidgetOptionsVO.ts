import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class ListObjectWidgetOptionsVO extends AbstractVO {

    public display_orientation: string;
    public number_of_elements: number;
    public sort_dimension_by: string;
    public image_id: VOFieldRefVO;
    public title: VOFieldRefVO;
    public subtitle: VOFieldRefVO;
    public number: VOFieldRefVO;
    public sort_field_ref: VOFieldRefVO;
    public button_elements: boolean;
    public url: VOFieldRefVO;
    public blank: boolean;

    public static createNew(
        display_orientation: string,
        number_of_elements: number,
        sort_dimension_by: string,
        image_id: VOFieldRefVO,
        title: VOFieldRefVO,
        subtitle: VOFieldRefVO,
        number: VOFieldRefVO,
        sort_field_ref: VOFieldRefVO,
        button_elements: boolean,
        url: VOFieldRefVO,
        blank: boolean
    ): ListObjectWidgetOptionsVO {
        const res = new ListObjectWidgetOptionsVO();
        res.display_orientation = display_orientation;
        res.number_of_elements = number_of_elements;
        res.sort_dimension_by = sort_dimension_by;
        res.image_id = image_id;
        res.title = title;
        res.subtitle = subtitle;
        res.number = number;
        res.sort_field_ref = sort_field_ref;
        res.button_elements = button_elements;
        res.url = url;
        res.blank = blank;

        return res;
    }

}
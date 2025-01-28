import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSLinkButtonWidgetOptionsVO extends AbstractVO {

    public url: string;
    public title: string;
    public color: string;
    public text_color: string;
    public about_blank: boolean;
    public radius: number;
    public url_field_ref: VOFieldRefVO;
    public icone: string;
    public is_url_field: boolean;

    public static createNew(
        url: string,
        title: string,
        color: string,
        text_color: string,
        about_blank: boolean,
        radius: number,
        url_field_ref: VOFieldRefVO,
        icone: string,
        is_url_field: boolean,
    ): CMSLinkButtonWidgetOptionsVO {
        const res = new CMSLinkButtonWidgetOptionsVO();

        res.url = url;
        res.title = title;
        res.color = color;
        res.text_color = text_color;
        res.about_blank = about_blank;
        res.radius = radius;
        res.url_field_ref = url_field_ref;
        res.icone = icone;
        res.is_url_field = is_url_field;

        return res;
    }
}
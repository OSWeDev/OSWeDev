import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSLinkButtonWidgetOptionsVO extends AbstractVO {

    public url: string;
    public title: string;
    public color: string;
    public text_color: string;
    public about_blank: boolean;
    public radius: number;

    public static createNew(
        url: string,
        title: string,
        color: string,
        text_color: string,
        about_blank: boolean,
        radius: number
    ): CMSLinkButtonWidgetOptionsVO {
        const res = new CMSLinkButtonWidgetOptionsVO();

        res.url = url;
        res.title = title;
        res.color = color;
        res.text_color = text_color;
        res.about_blank = about_blank;
        res.radius = radius;

        return res;
    }
}
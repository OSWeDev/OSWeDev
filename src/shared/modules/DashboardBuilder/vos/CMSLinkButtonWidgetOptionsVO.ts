import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSLinkButtonWidgetOptionsVO extends AbstractVO {

    public url: string;
    public title: string;
    public color: string;

    public static createNew(
        url: string,
        title: string,
        color: string,
    ): CMSLinkButtonWidgetOptionsVO {
        const res = new CMSLinkButtonWidgetOptionsVO();

        res.url = url;
        res.title = title;
        res.color = color;

        return res;
    }
}
import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSBooleanButtonWidgetOptionsVO extends AbstractVO {

    public title_ok: string;
    public title_nok: string;
    public color: string; // bg ou ?
    public text_color: string;
    public vo_field_ref: VOFieldRefVO;
    public icone_ok: string; // classes de FA icons (classescssvos ? avec un type fa ??)
    public icone_nok: string;
    public radius: number;
    public user_field_ref: VOFieldRefVO; // ???? flo sait pas

    public static createNew(
        title_ok: string,
        title_nok: string,
        color: string,
        text_color: string,
        vo_field_ref: VOFieldRefVO,
        icone_ok: string,
        icone_nok: string,
        radius: number,
        user_field_ref: VOFieldRefVO,
    ): CMSBooleanButtonWidgetOptionsVO {
        const res = new CMSBooleanButtonWidgetOptionsVO();

        res.title_ok = title_ok;
        res.title_nok = title_nok;
        res.color = color;
        res.text_color = text_color;
        res.vo_field_ref = vo_field_ref;
        res.icone_ok = icone_ok;
        res.icone_nok = icone_nok;
        res.radius = radius;
        res.user_field_ref = user_field_ref;

        return res;
    }
}
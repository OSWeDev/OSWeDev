import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSImageWidgetOptionsVO extends AbstractVO {

    public file_id: number;
    public radius: number;
    public use_for_template: boolean;
    public field_ref_for_template: VOFieldRefVO;

    public static createNew(
        file_id: number,
        radius: number,
        use_for_template: boolean,
        field_ref_for_template: VOFieldRefVO,
    ): CMSImageWidgetOptionsVO {
        const res = new CMSImageWidgetOptionsVO();

        res.file_id = file_id;
        res.radius = radius;
        res.use_for_template = use_for_template;
        res.field_ref_for_template = field_ref_for_template;

        return res;
    }
}
import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSVisionneusePdfWidgetOptionsVO extends AbstractVO {

    public file_id: number;
    public use_for_template: boolean;
    public field_ref_for_template: VOFieldRefVO;

    public static createNew(
        file_id: number,
        use_for_template: boolean,
        field_ref_for_template: VOFieldRefVO,
    ): CMSVisionneusePdfWidgetOptionsVO {
        const res = new CMSVisionneusePdfWidgetOptionsVO();

        res.file_id = file_id;
        res.use_for_template = use_for_template;
        res.field_ref_for_template = field_ref_for_template;

        return res;
    }
}
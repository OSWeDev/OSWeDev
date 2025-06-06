import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSVisionneusePdfWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_visionneuse_pdf_widget_options";
    public _type: string = CMSVisionneusePdfWidgetOptionsVO.API_TYPE_ID;

    public file_id: number;

    public use_for_template: boolean;

    /**
     * Anciennement field_ref_for_template
     */
    public field_ref_for_template_id: number;
}
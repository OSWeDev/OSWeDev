import NumRange from "../../../../DataRender/vos/NumRange";
import ColorVO from "../styles/ColorVO";
import SizeAndUnitVO from "../styles/SizeAndUnitVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSLinkButtonWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_link_button_widget_options";
    public _type: string = CMSLinkButtonWidgetOptionsVO.API_TYPE_ID;

    public url: string;

    /**
     * Titre du bouton
     */
    public button_title: string;

    /**
     * Anciennement color
     */
    public button_bg_color_id: ColorVO;

    /**
     * Anciennement text_color
     */
    public button_text_color: string;

    public about_blank: boolean;

    /**
     * Anciennement radius number
     */
    public button_radius: SizeAndUnitVO;

    /**
     * Anciennement url_field_ref
     */
    public url_field_ref_id: number;

    /**
     * Classes CSS pour l'icone du bouton
     * Anciennement button_icone
     */
    public button_icone_classe_id_ranges: NumRange[];

    public is_url_field: boolean;

    /**
     * Anciennement button_class string
     */
    public button_classe_id_ranges: NumRange[];
}
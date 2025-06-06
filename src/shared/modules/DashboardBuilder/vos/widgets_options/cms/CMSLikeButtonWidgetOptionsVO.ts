import NumRange from "../../../../DataRender/vos/NumRange";
import ColorVO from "../styles/ColorVO";
import SizeAndUnitVO from "../styles/SizeAndUnitVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSLikeButtonWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_like_button_widget_options";
    public _type: string = CMSLikeButtonWidgetOptionsVO.API_TYPE_ID;

    /**
     * Anciennement color
     */
    public color_id: ColorVO;

    /**
     * Liste des utilisateurs qui ont liké
     */
    public user_list: NumRange[];

    /**
     * Anciennement radius number
     */
    public radius: SizeAndUnitVO;
}
import NumRange from "../../../../DataRender/vos/NumRange";
import SizeAndUnitVO from "../styles/SizeAndUnitVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSBooleanButtonWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_boolean_button_widget_options";
    public _type: string = CMSBooleanButtonWidgetOptionsVO.API_TYPE_ID;

    public title_ok: string;
    public title_nok: string;

    /**
     * Anciennement color
     */
    public bg_color_id: number;

    /**
     * Anciennement text_color
     */
    public text_color_style_id: number;

    /**
     * Anciennement vo_field_ref
     */
    public vo_field_ref_id: number;

    /**
     * classes fa par exemple pour les icones
     * Anciennement icone_ok
     */
    public icone_ok_classe_id_ranges: NumRange[];
    /**
     * classes fa par exemple pour les icones
     * Anciennement icone_nok
     */
    public icone_nok_classe_id_ranges: NumRange[];

    /**
     * Anciennement radius
     */
    public border_radius: SizeAndUnitVO;

    /**
     * Anciennement user_field_ref
     * A voir si c'est la bonne méthode à terme, pas convaincu, on a explicitement un filtre de user ici,
     * avec soit un lien directement dans l'objet vo_field_ref_id._type soit dans une table elle-meme liée à vo_field_ref_id._type directement...
     * difficile à expliquer dans l'interface cette logique...
     */
    public user_field_ref_id: number;
}
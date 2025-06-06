import NumRange from "../../../../DataRender/vos/NumRange";
import IDistantVOBase from "../../../../IDistantVOBase";
import BorderStyleVO from "./BorderStyleVO";

export default class WidgetStyleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "widget_style";

    public id: number;
    public _type: string = WidgetStyleVO.API_TYPE_ID;

    /**
     * Nom du style, pour l'affichage
     */
    public name: string;

    /**
     * Description du style, pour expliquer son usage
     */
    public description: string;


    /**
     * La couleur de bg du widget => ref de ColorVO
     *  -> Anciennement bg_color sur les widgets de type filtre
     */
    public bg_color_id: number;

    /**
     * Le style de la bordure du widget
     */
    public border_style_id: BorderStyleVO;

    /**
     * Le padding => ref de PaddingStyleVO
     */
    public padding_style_id: number;

    //#region title

    /**
     * Le style du titre => ref de FontStyleVO
     *  -> Anciennement fg_color_text sur les widgets de type filtre
     */
    public title_font_style_id: number;

    /**
     * Le padding du titre => ref de PaddingStyleVO
     */
    public title_padding_id: number;
    //#endregion
}

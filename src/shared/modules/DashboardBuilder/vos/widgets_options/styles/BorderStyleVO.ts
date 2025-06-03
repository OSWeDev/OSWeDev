import IDistantVOBase from "../../../../IDistantVOBase";
import BorderCornerStyleVO from "./BorderCornerStyleVO";
import BorderSideStyleVO from "./BorderSideStyleVO";

export default class BorderStyleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "border_style";

    public id: number;
    public _type: string = BorderStyleVO.API_TYPE_ID;

    /**
     * Nom du style, pour l'affichage
     */
    public name: string;

    /**
     * Description du style, pour expliquer son usage
     */
    public description: string;

    /**
     * Le.s style.s pour les côtés
     */
    public side_styles: BorderSideStyleVO[];

    /**
     * Le.s style.s pour les coins
     */
    public corner_styles: BorderCornerStyleVO[];
}
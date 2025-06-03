import IDistantVOBase from "../../../../IDistantVOBase";
import PaddingSideStyleVO from "./PaddingSideStyleVO";

export default class PaddingStyleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "padding_style";

    public id: number;
    public _type: string = PaddingStyleVO.API_TYPE_ID;

    /**
     * Nom du style, pour l'affichage
     */
    public name: string;

    /**
     * Description du style, pour expliquer son usage
     */
    public description: string;

    /**
     * Le découpage par côtés
     */
    public side_style: PaddingSideStyleVO[];
}
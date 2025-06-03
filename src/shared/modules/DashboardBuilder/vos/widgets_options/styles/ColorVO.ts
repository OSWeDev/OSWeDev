import IDistantVOBase from "../../../../IDistantVOBase";

export default class ColorVO implements IDistantVOBase {

    public static TYPE_HEX: number = 0;
    public static TYPE_RELATIVE: number = 1;

    public static TYPE_LABELS: { [type: number]: string } = {
        [ColorVO.TYPE_HEX]: "ColorVO.TYPE.hex",
        [ColorVO.TYPE_RELATIVE]: "ColorVO.TYPE.relative",
    };

    public static MODIFIER_LIGHTEN: number = 0;
    public static MODIFIER_DARKEN: number = 1;
    public static MODIFIER_SATURATE: number = 2;
    public static MODIFIER_DESATURATE: number = 3;

    public static MODIFIER_LABELS: { [modifier: number]: string } = {
        [ColorVO.MODIFIER_LIGHTEN]: "ColorVO.MODIFIER.lighten",
        [ColorVO.MODIFIER_DARKEN]: "ColorVO.MODIFIER.darken",
        [ColorVO.MODIFIER_SATURATE]: "ColorVO.MODIFIER.saturate",
        [ColorVO.MODIFIER_DESATURATE]: "ColorVO.MODIFIER.desaturate",
    };

    public static API_TYPE_ID: string = "color";

    public id: number;
    public _type: string = ColorVO.API_TYPE_ID;

    /**
     * Nom de la couleur pour l'affichage
     */
    public name: string;

    /**
     * Description de la couleur, pour expliquer son usage
     */
    public description: string;

    /**
     * Type de la couleur : Hexadécimal ou relative à une autre couleur
     */
    public type: number;

    /**
     * Si type est Hexadécimal, c'est la valeur hexadécimale de la couleur
     * Sinon c'est null
     */
    public value: string;

    /**
     * Si type est Relative, c'est la référence à une autre couleur
     * Sinon c'est null
     */
    public relative_color_id: number;

    /**
     * Si type est Relative, c'est le modificateur appliqué à la couleur relative
     */
    public relative_modifier: number;

    /**
     * Si type est Relative, c'est le pourcentage de modification appliqué à la couleur relative
     * ]0,1] a priori, par exemple 50% pour une couleur plus claire ou plus foncée
     */
    public relative_percentage: number;
}
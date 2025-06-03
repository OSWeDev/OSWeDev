import IDistantVOBase from "../../../../IDistantVOBase";
import SizeAndUnitVO from "./SizeAndUnitVO";

export default class FontStyleVO implements IDistantVOBase {

    public static WEIGHT_THIN: number = 0;
    public static WEIGHT_EXTRA_LIGHT: number = 1;
    public static WEIGHT_LIGHT: number = 2;
    public static WEIGHT_NORMAL: number = 3;
    public static WEIGHT_MEDIUM: number = 4;
    public static WEIGHT_SEMI_BOLD: number = 5;
    public static WEIGHT_BOLD: number = 6;
    public static WEIGHT_EXTRA_BOLD: number = 7;
    public static WEIGHT_BLACK: number = 8;

    public static WEIGHT_ENUM_TO_CSS: { [weight_enum: number]: number } = {
        [FontStyleVO.WEIGHT_THIN]: 100,
        [FontStyleVO.WEIGHT_EXTRA_LIGHT]: 200,
        [FontStyleVO.WEIGHT_LIGHT]: 300,
        [FontStyleVO.WEIGHT_NORMAL]: 400,
        [FontStyleVO.WEIGHT_MEDIUM]: 500,
        [FontStyleVO.WEIGHT_SEMI_BOLD]: 600,
        [FontStyleVO.WEIGHT_BOLD]: 700,
        [FontStyleVO.WEIGHT_EXTRA_BOLD]: 800,
        [FontStyleVO.WEIGHT_BLACK]: 900,
    };

    public static WEIGHT_LABELS: { [weight: number]: string } = {
        [FontStyleVO.WEIGHT_THIN]: "FontStyleVO.WEIGHT_THIN",
        [FontStyleVO.WEIGHT_EXTRA_LIGHT]: "FontStyleVO.WEIGHT_EXTRA_LIGHT",
        [FontStyleVO.WEIGHT_LIGHT]: "FontStyleVO.WEIGHT_LIGHT",
        [FontStyleVO.WEIGHT_NORMAL]: "FontStyleVO.WEIGHT_NORMAL",
        [FontStyleVO.WEIGHT_MEDIUM]: "FontStyleVO.WEIGHT_MEDIUM",
        [FontStyleVO.WEIGHT_SEMI_BOLD]: "FontStyleVO.WEIGHT_SEMI_BOLD",
        [FontStyleVO.WEIGHT_BOLD]: "FontStyleVO.WEIGHT_BOLD",
        [FontStyleVO.WEIGHT_EXTRA_BOLD]: "FontStyleVO.WEIGHT_EXTRA_BOLD",
        [FontStyleVO.WEIGHT_BLACK]: "FontStyleVO.WEIGHT_BLACK",
    };


    public static API_TYPE_ID: string = "font_style";

    public id: number;
    public _type: string = FontStyleVO.API_TYPE_ID;

    /**
     * Nom du style, pour l'affichage
     */
    public name: string;

    /**
     * Description du style, pour expliquer son usage
     */
    public description: string;

    /**
     * Nom de la police de caractère
     */
    public font_family: string;

    /**
     * La taille de la police de caractère
     */
    public font_size: SizeAndUnitVO;

    /**
     * Le poids de la police de caractère
     * Correspond à FontStyleVO.WEIGHT_*
     */
    public font_weight: number;

    /**
     * La couleur de la police de caractère
     * Référence à une ColorVO
     */
    public color_id: number;
}
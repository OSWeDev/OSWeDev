import IDistantVOBase from "../../../../IDistantVOBase";
import SizeAndUnitVO from "./SizeAndUnitVO";

export default class BorderSideStyleVO implements IDistantVOBase {

    public static SIDE_ALL: number = 0;
    public static SIDE_LEFT: number = 1;
    public static SIDE_TOP: number = 2;
    public static SIDE_RIGHT: number = 3;
    public static SIDE_BOTTOM: number = 4;

    public static SIDE_LABELS: { [weight: number]: string } = {
        [BorderSideStyleVO.SIDE_ALL]: "BorderSideStyleVO.SIDE_ALL",
        [BorderSideStyleVO.SIDE_LEFT]: "BorderSideStyleVO.SIDE_LEFT",
        [BorderSideStyleVO.SIDE_TOP]: "BorderSideStyleVO.SIDE_TOP",
        [BorderSideStyleVO.SIDE_RIGHT]: "BorderSideStyleVO.SIDE_RIGHT",
        [BorderSideStyleVO.SIDE_BOTTOM]: "BorderSideStyleVO.SIDE_BOTTOM",
    };

    public static STYLE_NONE: number = 0;
    public static STYLE_SOLID: number = 1;
    public static STYLE_DASHED: number = 2;
    public static STYLE_DOTTED: number = 3;
    public static STYLE_DOUBLE: number = 4;
    public static STYLE_GROOVE: number = 5;
    public static STYLE_RIDGE: number = 6;
    public static STYLE_INSET: number = 7;
    public static STYLE_OUTSET: number = 8;

    public static STYLE_LABELS: { [style: number]: string } = {
        [BorderSideStyleVO.STYLE_NONE]: "BorderSideStyleVO.STYLE_NONE",
        [BorderSideStyleVO.STYLE_SOLID]: "BorderSideStyleVO.STYLE_SOLID",
        [BorderSideStyleVO.STYLE_DASHED]: "BorderSideStyleVO.STYLE_DASHED",
        [BorderSideStyleVO.STYLE_DOTTED]: "BorderSideStyleVO.STYLE_DOTTED",
        [BorderSideStyleVO.STYLE_DOUBLE]: "BorderSideStyleVO.STYLE_DOUBLE",
        [BorderSideStyleVO.STYLE_GROOVE]: "BorderSideStyleVO.STYLE_GROOVE",
        [BorderSideStyleVO.STYLE_RIDGE]: "BorderSideStyleVO.STYLE_RIDGE",
        [BorderSideStyleVO.STYLE_INSET]: "BorderSideStyleVO.STYLE_INSET",
        [BorderSideStyleVO.STYLE_OUTSET]: "BorderSideStyleVO.STYLE_OUTSET",
    };

    public static STYLE_ENUM_TO_CSS: { [style_enum: number]: string } = {
        [BorderSideStyleVO.STYLE_NONE]: "none",
        [BorderSideStyleVO.STYLE_SOLID]: "solid",
        [BorderSideStyleVO.STYLE_DASHED]: "dashed",
        [BorderSideStyleVO.STYLE_DOTTED]: "dotted",
        [BorderSideStyleVO.STYLE_DOUBLE]: "double",
        [BorderSideStyleVO.STYLE_GROOVE]: "groove",
        [BorderSideStyleVO.STYLE_RIDGE]: "ridge",
        [BorderSideStyleVO.STYLE_INSET]: "inset",
        [BorderSideStyleVO.STYLE_OUTSET]: "outset",
    };

    public static API_TYPE_ID: string = "border_side_style";

    public id: number;
    public _type: string = BorderSideStyleVO.API_TYPE_ID;

    public side: number;

    public color_id: number;
    public width_size: SizeAndUnitVO;
    public style: number;
}
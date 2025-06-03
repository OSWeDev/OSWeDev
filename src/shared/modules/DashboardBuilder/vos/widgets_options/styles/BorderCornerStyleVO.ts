import IDistantVOBase from "../../../../IDistantVOBase";
import SizeAndUnitVO from "./SizeAndUnitVO";

export default class BorderCornerStyleVO implements IDistantVOBase {

    public static SIDE_ALL: number = 0;
    public static SIDE_TOP_LEFT: number = 1;
    public static SIDE_TOP_RIGHT: number = 2;
    public static SIDE_BOTTOM_RIGHT: number = 3;
    public static SIDE_BOTTOM_LEFT: number = 4;

    public static SIDE_LABELS: { [weight: number]: string } = {
        [BorderCornerStyleVO.SIDE_ALL]: "BorderCornerStyleVO.SIDE_ALL",
        [BorderCornerStyleVO.SIDE_TOP_LEFT]: "BorderCornerStyleVO.SIDE_TOP_LEFT",
        [BorderCornerStyleVO.SIDE_TOP_RIGHT]: "BorderCornerStyleVO.SIDE_TOP_RIGHT",
        [BorderCornerStyleVO.SIDE_BOTTOM_RIGHT]: "BorderCornerStyleVO.SIDE_BOTTOM_RIGHT",
        [BorderCornerStyleVO.SIDE_BOTTOM_LEFT]: "BorderCornerStyleVO.SIDE_BOTTOM_LEFT",
    };

    public static API_TYPE_ID: string = "border_corner_style";

    public id: number;
    public _type: string = BorderCornerStyleVO.API_TYPE_ID;

    public side: number;
    public radius: SizeAndUnitVO;
}
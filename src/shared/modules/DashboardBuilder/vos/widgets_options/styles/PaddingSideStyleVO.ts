import IDistantVOBase from "../../../../IDistantVOBase";
import SizeAndUnitVO from "./SizeAndUnitVO";

export default class PaddingSideStyleVO implements IDistantVOBase {

    public static SIDE_ALL: number = 0;
    public static SIDE_LEFT: number = 1;
    public static SIDE_TOP: number = 2;
    public static SIDE_RIGHT: number = 3;
    public static SIDE_BOTTOM: number = 4;

    public static SIDE_LABELS: { [weight: number]: string } = {
        [PaddingSideStyleVO.SIDE_ALL]: "PaddingSideStyleVO.SIDE_ALL",
        [PaddingSideStyleVO.SIDE_LEFT]: "PaddingSideStyleVO.SIDE_LEFT",
        [PaddingSideStyleVO.SIDE_TOP]: "PaddingSideStyleVO.SIDE_TOP",
        [PaddingSideStyleVO.SIDE_RIGHT]: "PaddingSideStyleVO.SIDE_RIGHT",
        [PaddingSideStyleVO.SIDE_BOTTOM]: "PaddingSideStyleVO.SIDE_BOTTOM",
    };

    public static API_TYPE_ID: string = "padding_side_style";

    public id: number;
    public _type: string = PaddingSideStyleVO.API_TYPE_ID;

    public side: number;
    public size: SizeAndUnitVO;
}
import IDistantVOBase from "../../../../IDistantVOBase";

export default class FontSizeVO implements IDistantVOBase {

    public static UNIT_PX: number = 0;
    public static UNIT_PT: number = 1;
    public static UNIT_EM: number = 2;
    public static UNIT_REM: number = 3;
    public static UNIT_PERCENT: number = 4;

    public static UNIT_LABELS: { [unit: number]: string } = {
        [FontSizeVO.UNIT_PX]: "FontSizeVO.UNIT.px",
        [FontSizeVO.UNIT_PT]: "FontSizeVO.UNIT.pt",
        [FontSizeVO.UNIT_EM]: "FontSizeVO.UNIT.em",
        [FontSizeVO.UNIT_REM]: "FontSizeVO.UNIT.rem",
        [FontSizeVO.UNIT_PERCENT]: "FontSizeVO.UNIT.%"
    };

    public static API_TYPE_ID: string = "font_size";

    public id: number;

    public _type: string = FontSizeVO.API_TYPE_ID;

    public size: number;
    public unit: number;
}
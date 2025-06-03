import IDistantVOBase from "../../../../IDistantVOBase";

export default class SizeAndUnitVO implements IDistantVOBase {

    public static UNIT_PX: number = 0;
    public static UNIT_PT: number = 1;
    public static UNIT_EM: number = 2;
    public static UNIT_REM: number = 3;
    public static UNIT_PERCENT: number = 4;

    public static UNIT_LABELS: { [unit: number]: string } = {
        [SizeAndUnitVO.UNIT_PX]: "SizeAndUnitVO.UNIT.px",
        [SizeAndUnitVO.UNIT_PT]: "SizeAndUnitVO.UNIT.pt",
        [SizeAndUnitVO.UNIT_EM]: "SizeAndUnitVO.UNIT.em",
        [SizeAndUnitVO.UNIT_REM]: "SizeAndUnitVO.UNIT.rem",
        [SizeAndUnitVO.UNIT_PERCENT]: "SizeAndUnitVO.UNIT.%"
    };

    public static API_TYPE_ID: string = "size_and_unit";

    public id: number;

    public _type: string = SizeAndUnitVO.API_TYPE_ID;

    public size: number;
    public unit: number;
}
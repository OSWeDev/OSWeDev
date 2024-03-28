export default class EvolizUnitCodeVO {
    public static API_TYPE_ID: string = "evoliz_unit_code";

    public id: number;
    public _type: string = EvolizUnitCodeVO.API_TYPE_ID;

    // Unit code identifier
    public unitcodeid: number;
    // Unit code
    public unitcode: string;
    // Unit code label
    public label: string;
    // Unit code symbol
    public symbol: string;
}
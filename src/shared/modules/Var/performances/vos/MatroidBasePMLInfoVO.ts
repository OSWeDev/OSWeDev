import IDistantVOBase from "../../../IDistantVOBase";
import IPerfMonLineInfo from "../../../PerfMon/interfaces/IPerfMonLineInfo";

export default class MatroidBasePMLInfoVO implements IDistantVOBase, IPerfMonLineInfo {

    public static API_TYPE_ID: string = "matroidbase_pmlinfo";

    public id: number;
    public _type: string = MatroidBasePMLInfoVO.API_TYPE_ID;

    public perf_line_id: number;

    public vo_type: string;
    public field_id: string;
    public range_type: number;
    public segment_type: number;
    public min_as_number: number;
    public max_as_number: number;
    public is_max_range: boolean;
    public cardinal: number;
}
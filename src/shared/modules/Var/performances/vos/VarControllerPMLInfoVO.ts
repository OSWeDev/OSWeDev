import IDistantVOBase from "../../../IDistantVOBase";
import IPerfMonLineInfo from "../../../PerfMon/interfaces/IPerfMonLineInfo";

export default class VarControllerPMLInfoVO implements IDistantVOBase, IPerfMonLineInfo {

    public static API_TYPE_ID: string = "varctrl_pmlinfo";

    public id: number;
    public _type: string = VarControllerPMLInfoVO.API_TYPE_ID;

    public perf_line_id: number;

    public var_id: number;
}
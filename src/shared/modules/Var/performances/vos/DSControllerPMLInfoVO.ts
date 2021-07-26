import IDistantVOBase from "../../../IDistantVOBase";
import IPerfMonLineInfo from "../../../PerfMon/interfaces/IPerfMonLineInfo";

export default class DSControllerPMLInfoVO implements IDistantVOBase, IPerfMonLineInfo {

    public static API_TYPE_ID: string = "dsctrl_pmlinfo";

    public id: number;
    public _type: string = DSControllerPMLInfoVO.API_TYPE_ID;

    public perf_line_id: number;

    public ds_name: string;
}
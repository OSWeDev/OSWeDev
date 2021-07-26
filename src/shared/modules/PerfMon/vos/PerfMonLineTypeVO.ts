import INamedVO from "../../../interfaces/INamedVO";
import IDistantVOBase from "../../IDistantVOBase";

export default class PerfMonLineTypeVO implements IDistantVOBase, INamedVO {
    public static API_TYPE_ID: string = "perfmon_line_type";

    public id: number;
    public _type: string = PerfMonLineTypeVO.API_TYPE_ID;

    public name: string;
    public is_active: boolean;
}
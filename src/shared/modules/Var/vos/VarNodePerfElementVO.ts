import IDistantVOBase from '../../IDistantVOBase';

export default class VarNodePerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_node_perf_element";

    public _type: string = VarNodePerfElementVO.API_TYPE_ID;
    public id: number;

    public created_time: number;
    public initialestimated_work_time: number;
    public estimated_work_time: number;
    public real_work_time: number;
    public skipped: boolean;
    public end_time: number;

    public constructor() {
        this.created_time = 0;
        this.estimated_work_time = 0;
        this.real_work_time = 0;
        this.skipped = false;
        this.end_time = 0;
    }
}
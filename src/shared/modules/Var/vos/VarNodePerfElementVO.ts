import IDistantVOBase from '../../IDistantVOBase';

export default class VarNodePerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_node_perf_element";

    public _type: string = VarNodePerfElementVO.API_TYPE_ID;
    public id: number;

    public start_time: number = null;
    public initial_estimated_work_time: number = 0;
    public updated_estimated_work_time: number = 0;
    public total_elapsed_time: number = 0;
    public skipped: boolean = false;
    public end_time: number = null;

    public nb_calls: number;
    public sum_card: number;

    public constructor() { }

    public skip_and_update_parents_perfs(parents: VarNodePerfElementVO[]) {

        if (!!this.updated_estimated_work_time) {
            for (let i in parents) {
                let parent = parents[i];
                parent.updated_estimated_work_time = parent.updated_estimated_work_time - this.updated_estimated_work_time;
            }
        }

        this.updated_estimated_work_time = 0;
        this.skipped = true;
    }

    public init_estimated_work_time_and_update_parents_perfs(estimated_work_time: number, parents: VarNodePerfElementVO[]) {

        let diff_estimated_work_time = (this.initial_estimated_work_time != null) ? this.initial_estimated_work_time : 0;

        this.initial_estimated_work_time = (estimated_work_time != null) ? estimated_work_time : 0;
        this.updated_estimated_work_time = this.initial_estimated_work_time;
        diff_estimated_work_time = this.initial_estimated_work_time - diff_estimated_work_time;

        if (!!diff_estimated_work_time) {
            for (let i in parents) {
                let parent = parents[i];
                parent.initial_estimated_work_time = parent.initial_estimated_work_time + diff_estimated_work_time;
                parent.updated_estimated_work_time = parent.initial_estimated_work_time;
            }
        }
    }

    public update_estimated_work_time_and_update_parents_perfs(estimated_work_time: number, parents: VarNodePerfElementVO[]) {

        let diff_estimated_work_time = (this.updated_estimated_work_time != null) ? this.updated_estimated_work_time : 0;

        this.updated_estimated_work_time = (estimated_work_time != null) ? estimated_work_time : 0;
        diff_estimated_work_time = this.updated_estimated_work_time - diff_estimated_work_time;

        if (!!diff_estimated_work_time) {
            for (let i in parents) {
                let parent = parents[i];
                parent.updated_estimated_work_time = parent.updated_estimated_work_time + diff_estimated_work_time;
            }
        }
    }
}
import IDistantVOBase from '../../IDistantVOBase';
import VarDAG from '../graph/VarDAG';
import VarNodeParentPerfVO from './VarNodeParentPerfVO';


export default class VarNodePerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_node_perf_element";

    public static get_perf_by_ref(perf_ref: VarNodeParentPerfVO, var_dag: VarDAG): VarNodePerfElementVO {
        if (!perf_ref) {
            return null;
        }

        if (!perf_ref.node_name) {
            return var_dag.perfs[perf_ref.perf_name] as VarNodePerfElementVO;
        } else {
            let node = var_dag.nodes[perf_ref.node_name];
            return node ? node.perfs[perf_ref.perf_name] as VarNodePerfElementVO : null;
        }
    }

    public _type: string = VarNodePerfElementVO.API_TYPE_ID;
    public id: number;

    public node_name: string;
    public perf_name: string;

    public start_time: number;
    public initial_estimated_work_time: number;
    public updated_estimated_work_time: number;
    public total_elapsed_time: number;
    public skipped: boolean = false;
    public end_time: number;

    public nb_calls: number;
    public sum_card: number;

    public child_perfs_ref: VarNodeParentPerfVO[] = [];
    public parent_perf_ref: VarNodeParentPerfVO;

    /**
     * @param node_name null si la perf appartient à var_dag.perfs ou le nom du node lié
     * @param perf_name le nom de la perf (réflexivité)
     * @param var_dag obligatoire si on déclare un parent_perf_ref sinon vide
     * @param parent_perf_ref la perf parente si il y en a une
     */
    public constructor(
        node_name: string,
        perf_name: string,
        var_dag: VarDAG,
        parent_perf_ref: VarNodeParentPerfVO = null
    ) {
        this.node_name = node_name;
        this.perf_name = perf_name;
        this.parent_perf_ref = parent_perf_ref;

        let parent_perf = VarNodePerfElementVO.get_perf_by_ref(parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.child_perfs_ref.push(VarNodeParentPerfVO.create_new(this.node_name, this.perf_name));
        }
    }

    public delete_this_perf(var_dag: VarDAG) {

        this.update_estimated_work_time_and_update_parents_perfs(0, var_dag);

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.remove_from_children(this);
        }

        for (let i in this.child_perfs_ref) {
            let child_perf_ref = this.child_perfs_ref[i];

            let child_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(child_perf_ref, var_dag);
            if (!!child_perf) {
                child_perf.parent_perf_ref = null;
            }
        }
        delete this.child_perfs_ref;
    }

    public remove_from_children(perf: VarNodePerfElementVO) {
        let found_index = null;
        for (let i in this.child_perfs_ref) {
            let child_perf = this.child_perfs_ref[i];

            if ((child_perf.node_name == perf.node_name) && (child_perf.perf_name == perf.perf_name)) {
                found_index = i;
                break;
            }
        }

        if (found_index != null) {
            this.child_perfs_ref.splice(found_index, 1);
        }
    }

    public skip_and_update_parents_perfs(var_dag: VarDAG) {

        if ((!!this.parent_perf_ref) && (!!this.updated_estimated_work_time)) {

            let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
            if (parent_perf) {
                parent_perf.update_estimated_work_time_and_update_parents_perfs_from_diff(-this.updated_estimated_work_time, var_dag);
            }
        }

        this.sum_card = 0;
        this.nb_calls = 0;
        this.updated_estimated_work_time = 0;
        this.total_elapsed_time = 0;
        this.start_time = null;
        this.end_time = null;
        this.skipped = true;
    }

    public initialize_estimated_work_time_and_update_parents_perfs(estimated_work_time: number, var_dag: VarDAG) {

        let old_estimated_work_time = (this.initial_estimated_work_time != null) ? this.initial_estimated_work_time : 0;
        let new_estimated_work_time = (estimated_work_time != null) ? estimated_work_time : 0;
        let diff_estimated_work_time = new_estimated_work_time - old_estimated_work_time;

        this.initial_estimated_work_time = estimated_work_time;
        this.updated_estimated_work_time = estimated_work_time;

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.initialize_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time, var_dag);
        }
    }
    public initialize_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time: number, var_dag: VarDAG) {

        this.initial_estimated_work_time = ((this.initial_estimated_work_time != null) ? this.initial_estimated_work_time : 0) + diff_estimated_work_time;
        this.updated_estimated_work_time = ((this.updated_estimated_work_time != null) ? this.updated_estimated_work_time : 0) + diff_estimated_work_time;

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.initialize_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time, var_dag);
        }
    }

    public update_estimated_work_time_and_update_parents_perfs(estimated_work_time: number, var_dag: VarDAG) {

        let old_estimated_work_time = (this.updated_estimated_work_time != null) ? this.updated_estimated_work_time : 0;
        let new_estimated_work_time = (estimated_work_time != null) ? estimated_work_time : 0;
        let diff_estimated_work_time = new_estimated_work_time - old_estimated_work_time;

        this.updated_estimated_work_time = estimated_work_time;

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.update_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time, var_dag);
        }
    }
    public update_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time: number, var_dag: VarDAG) {

        this.updated_estimated_work_time = ((this.updated_estimated_work_time != null) ? this.updated_estimated_work_time : 0) + diff_estimated_work_time;

        let parent_perf: VarNodePerfElementVO = VarNodePerfElementVO.get_perf_by_ref(this.parent_perf_ref, var_dag);
        if (!!parent_perf) {
            parent_perf.update_estimated_work_time_and_update_parents_perfs_from_diff(diff_estimated_work_time, var_dag);
        }
    }
}
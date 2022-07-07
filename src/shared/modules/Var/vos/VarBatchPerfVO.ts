import IDistantVOBase from '../../IDistantVOBase';
import VarBatchVarPerfVO from './VarBatchVarPerfVO';
import VarPerfElementVO from './VarPerfElementVO';

export default class VarBatchPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_perf";

    public _type: string = VarBatchPerfVO.API_TYPE_ID;
    public id: number;

    public batch_id: number;

    public var_perfs: VarBatchVarPerfVO[];

    public get_vars_to_compute: VarPerfElementVO;

    public create_tree: VarPerfElementVO;
    public load_nodes_datas: VarPerfElementVO;
    public compute_node: VarPerfElementVO;

    public cache_datas: VarPerfElementVO;
    public update_cards_in_perfs: VarPerfElementVO;

    // Les estimations concernent la partie centrale, les vars : create_tree + load_nodes_datas + compute_node

    public initial_estimated_time: number;
    public start_time: number;
    public current_estimated_remaining_time: number;
    public end_time: number;
}
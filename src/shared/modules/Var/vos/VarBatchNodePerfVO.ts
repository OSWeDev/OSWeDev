import IDistantVOBase from '../../IDistantVOBase';
import VarBatchVarPerfVO from './VarBatchVarPerfVO';
import VarPerfElementVO from './VarPerfElementVO';

export default class VarBatchNodePerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_node_perf";

    public _type: string = VarBatchNodePerfVO.API_TYPE_ID;
    public id: number;

    public index: string;
    public var_id: number;

    public create_tree: VarNodePerfElementVO;
    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node: VarNodePerfElementVO;

    public initial_estimated_time: number;
    public current_estimated_remaining_time: number;
}
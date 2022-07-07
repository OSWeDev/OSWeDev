import IDistantVOBase from '../../IDistantVOBase';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchNodePerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_node_perf";

    public _type: string = VarBatchNodePerfVO.API_TYPE_ID;
    public id: number;

    public index: string;
    public var_id: number;

    public create_tree: VarNodePerfElementVO;
    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node: VarNodePerfElementVO;

    public creation_time: number;
    public initial_estimated_time: number;
    public current_estimated_remaining_time: number;
}
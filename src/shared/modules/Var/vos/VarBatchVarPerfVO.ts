import IDistantVOBase from '../../IDistantVOBase';
import VarPerfElementVO from './VarPerfElementVO';

export default class VarBatchVarPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_var_perf";

    public _type: string = VarBatchVarPerfVO.API_TYPE_ID;
    public id: number;

    public var_id: number;

    public create_tree: VarPerfElementVO;
    public load_nodes_datas: VarPerfElementVO;
    public compute_node: VarPerfElementVO;
}
import IDistantVOBase from '../../IDistantVOBase';
import VarPerfElementVO from './VarPerfElementVO';

export default class VarBatchVarPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_var_perf";

    public _type: string = VarBatchVarPerfVO.API_TYPE_ID;
    public id: number;

    public var_batch_perf_id: number;
    public var_id: number;

    public ctree_ddeps_try_load_cache_complet: VarPerfElementVO;
    public ctree_ddeps_load_imports_and_split_nodes: VarPerfElementVO;
    public ctree_ddeps_try_load_cache_partiel: VarPerfElementVO;
    public ctree_ddeps_get_node_deps: VarPerfElementVO;
    public ctree_ddeps_handle_pixellisation: VarPerfElementVO;

    public load_node_datas: VarPerfElementVO;
    public compute_node: VarPerfElementVO;
}
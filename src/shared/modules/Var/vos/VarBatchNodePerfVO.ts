import IDistantVOBase from '../../IDistantVOBase';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchNodePerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_node_perf";

    public _type: string = VarBatchNodePerfVO.API_TYPE_ID;
    public id: number;

    public index: string;
    public var_id: number;

    public ctree_deploy_deps: VarNodePerfElementVO;
    public ctree_ddeps_try_load_cache_complet: VarNodePerfElementVO;
    public ctree_ddeps_load_imports_and_split_nodes: VarNodePerfElementVO;
    public ctree_ddeps_try_load_cache_partiel: VarNodePerfElementVO;
    public ctree_ddeps_get_node_deps: VarNodePerfElementVO;
    public ctree_ddeps_handle_pixellisation: VarNodePerfElementVO;


    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node: VarNodePerfElementVO;

    public constructor() { }
}
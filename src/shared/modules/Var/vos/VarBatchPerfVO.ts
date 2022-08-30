import IDistantVOBase from '../../IDistantVOBase';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_perf";

    public _type: string = VarBatchPerfVO.API_TYPE_ID;
    public id: number;

    public batch_id: number;

    public batch_wrapper: VarNodePerfElementVO;
    //+ batch_wrapper
    public handle_invalidators: VarNodePerfElementVO;

    public handle_buffer_varsdatasproxy: VarNodePerfElementVO;
    public handle_buffer_varsdatasvoupdate: VarNodePerfElementVO;

    public computation_wrapper: VarNodePerfElementVO;
    //+ computation_wrapper
    public create_tree: VarNodePerfElementVO;

    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node_wrapper: VarNodePerfElementVO;
    //- computation_wrapper

    public cache_datas: VarNodePerfElementVO;
    //- batch_wrapper

    /**
     * Nombre de vars qu'on essaie vraiment de résoudre à la base
     */
    public nb_batch_vars: number;
}
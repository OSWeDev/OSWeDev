import VarBatchPerfVO from "../vos/VarBatchPerfVO";
import VarNodePerfElementVO from "../vos/VarNodePerfElementVO";
import DAG from "./dagbase/DAG";
import VarDAGNode from "./VarDAGNode";

export default class VarDAG extends DAG<VarDAGNode> {

    public perfs: VarBatchPerfVO;
    public timed_out: boolean = false;

    public constructor(batch_id: number) {
        super();

        this.perfs = new VarBatchPerfVO();
        this.perfs.batch_id = batch_id;

        this.perfs.batch_wrapper = new VarNodePerfElementVO();

        this.perfs.computation_wrapper = new VarNodePerfElementVO();

        this.perfs.handle_invalidate_intersectors = new VarNodePerfElementVO();
        this.perfs.handle_invalidate_matroids = new VarNodePerfElementVO();
        this.perfs.handle_buffer_varsdatasproxy = new VarNodePerfElementVO();
        this.perfs.handle_buffer_varsdatasvoupdate = new VarNodePerfElementVO();
        this.perfs.create_tree = new VarNodePerfElementVO();
        this.perfs.ctree_deploy_deps = new VarNodePerfElementVO();
        this.perfs.ctree_ddeps_try_load_cache_complet = new VarNodePerfElementVO();
        this.perfs.ctree_ddeps_load_imports_and_split_nodes = new VarNodePerfElementVO();
        this.perfs.ctree_ddeps_try_load_cache_partiel = new VarNodePerfElementVO();
        this.perfs.ctree_ddeps_get_node_deps = new VarNodePerfElementVO();
        this.perfs.ctree_ddeps_handle_pixellisation = new VarNodePerfElementVO();
        this.perfs.load_nodes_datas = new VarNodePerfElementVO();
        this.perfs.compute_node = new VarNodePerfElementVO();
        this.perfs.cache_datas = new VarNodePerfElementVO();

        this.perfs.nb_batch_vars = 0;
    }
}
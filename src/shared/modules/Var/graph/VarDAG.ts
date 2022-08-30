import VarBatchPerfVO from "../vos/VarBatchPerfVO";
import VarNodeParentPerfVO from "../vos/VarNodeParentPerfVO";
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

        this.perfs.batch_wrapper = new VarNodePerfElementVO(null, 'batch_wrapper', this);

        this.perfs.handle_invalidators = new VarNodePerfElementVO(null, 'handle_invalidators', this, VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));
        this.perfs.handle_buffer_varsdatasproxy = new VarNodePerfElementVO(null, 'handle_buffer_varsdatasproxy', this, VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));
        this.perfs.handle_buffer_varsdatasvoupdate = new VarNodePerfElementVO(null, 'handle_buffer_varsdatasvoupdate', this, VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.computation_wrapper = new VarNodePerfElementVO(null, 'computation_wrapper', this, VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.create_tree = new VarNodePerfElementVO(null, 'create_tree', this, VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));
        this.perfs.load_nodes_datas = new VarNodePerfElementVO(null, 'load_nodes_datas', this, VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));
        this.perfs.compute_node_wrapper = new VarNodePerfElementVO(null, 'compute_node_wrapper', this, VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));

        this.perfs.cache_datas = new VarNodePerfElementVO(null, 'cache_datas', this, VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.nb_batch_vars = 0;
    }
}
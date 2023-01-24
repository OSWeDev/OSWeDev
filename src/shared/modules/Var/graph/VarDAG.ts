import ModuleParams from "../../Params/ModuleParams";
import ModuleVar from "../ModuleVar";
import VarBatchPerfVO from "../vos/VarBatchPerfVO";
import VarNodeParentPerfVO from "../vos/VarNodeParentPerfVO";
import VarNodePerfElementVO from "../vos/VarNodePerfElementVO";
import DAG from "./dagbase/DAG";
import VarDAGNode from "./VarDAGNode";

export default class VarDAG extends DAG<VarDAGNode> {

    public static injection_performance = null;

    public static async dag_is_in_timeout_with_elpased_time(var_dag: VarDAG): Promise<boolean> {
        if (!VarDAG.injection_performance) {
            return false;
        }

        let estimated_tree_computation_time_limit = await ModuleParams.getInstance().getParamValueAsInt(ModuleVar.PARAM_NAME_estimated_tree_computation_time_limit, 300000, 180000);

        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDAG.get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
        let current_computation_wrapper_total_elapsed_time = var_dag.perfs ? VarDAG.injection_performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;

        return (batchperf_computation_wrapper_total_estimated_remaining_time && current_computation_wrapper_total_elapsed_time && ((batchperf_computation_wrapper_total_estimated_remaining_time + current_computation_wrapper_total_elapsed_time) > estimated_tree_computation_time_limit));
    }

    public static async dag_is_in_timeout_without_elpased_time(var_dag: VarDAG): Promise<boolean> {
        if (!VarDAG.injection_performance) {
            return false;
        }

        let estimated_tree_computation_time_limit = await ModuleParams.getInstance().getParamValueAsInt(ModuleVar.PARAM_NAME_estimated_tree_computation_time_limit, 300000, 180000);

        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDAG.get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;

        return (batchperf_computation_wrapper_total_estimated_remaining_time && (batchperf_computation_wrapper_total_estimated_remaining_time > estimated_tree_computation_time_limit));
    }

    /**
     * 2 cas : on a des enfants : on prend la somme des estimations de temps restant sur les enfants. sinon on calcul sur soi
     * @param nodeperfelement
     * @returns
     */
    public static get_nodeperfelement_estimated_remaining_work_time(nodeperfelement: VarNodePerfElementVO): number {

        if (!VarDAG.injection_performance) {
            return 0;
        }

        if (!nodeperfelement) {
            return 0;
        }

        if (nodeperfelement.child_perfs_ref && nodeperfelement.child_perfs_ref.length) {
            return (
                Math.max(
                    0,
                    (nodeperfelement.start_time_global - nodeperfelement.nb_started_global * VarDAG.injection_performance.now()) +
                    ((nodeperfelement.updated_estimated_work_time_global / nodeperfelement.nb_noeuds_global) * nodeperfelement.nb_started_global))
            ) + (
                    (nodeperfelement.updated_estimated_work_time_global / nodeperfelement.nb_noeuds_global) * (nodeperfelement.nb_noeuds_global - nodeperfelement.nb_started_global)
                );
        }

        return Math.max(0, (
            ((!!nodeperfelement.updated_estimated_work_time) && !!nodeperfelement.start_time) ?
                (nodeperfelement.start_time + nodeperfelement.updated_estimated_work_time) - VarDAG.injection_performance.now() :
                ((!!nodeperfelement.updated_estimated_work_time) ? nodeperfelement.updated_estimated_work_time : 0)));
    }

    public perfs: VarBatchPerfVO;
    public timed_out: boolean = false;

    public has_perfs: boolean = false;

    public constructor() {
        super();
    }

    public init_perfs(batch_id: number) {

        this.has_perfs = true;
        this.perfs = new VarBatchPerfVO();
        this.perfs.batch_id = batch_id;

        this.perfs.batch_wrapper = new VarNodePerfElementVO(null, 'batch_wrapper');

        this.perfs.handle_invalidators = new VarNodePerfElementVO(null, 'handle_invalidators', VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));
        this.perfs.handle_buffer_varsdatasproxy = new VarNodePerfElementVO(null, 'handle_buffer_varsdatasproxy', VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));
        this.perfs.handle_buffer_varsdatasvoupdate = new VarNodePerfElementVO(null, 'handle_buffer_varsdatasvoupdate', VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.computation_wrapper = new VarNodePerfElementVO(null, 'computation_wrapper', VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.create_tree = new VarNodePerfElementVO(null, 'create_tree', VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));
        this.perfs.load_nodes_datas = new VarNodePerfElementVO(null, 'load_nodes_datas', VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));
        this.perfs.compute_node_wrapper = new VarNodePerfElementVO(null, 'compute_node_wrapper', VarNodeParentPerfVO.create_new(null, 'computation_wrapper'));

        this.perfs.cache_datas = new VarNodePerfElementVO(null, 'cache_datas', VarNodeParentPerfVO.create_new(null, 'batch_wrapper'));

        this.perfs.nb_batch_vars = 0;
    }
}
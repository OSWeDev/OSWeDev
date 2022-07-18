import IDistantVOBase from '../../IDistantVOBase';
import VarDAG from '../graph/VarDAG';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchNodePerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_node_perf";

    public _type: string = VarBatchNodePerfVO.API_TYPE_ID;
    public id: number;

    public index: string;
    public var_id: number;

    public ctree_deploy_deps: VarNodePerfElementVO = new VarNodePerfElementVO();
    public ctree_ddeps_try_load_cache_complet: VarNodePerfElementVO = new VarNodePerfElementVO();
    public ctree_ddeps_load_imports_and_split_nodes: VarNodePerfElementVO = new VarNodePerfElementVO();
    public ctree_ddeps_try_load_cache_partiel: VarNodePerfElementVO = new VarNodePerfElementVO();
    public ctree_ddeps_get_node_deps: VarNodePerfElementVO = new VarNodePerfElementVO();
    public ctree_ddeps_handle_pixellisation: VarNodePerfElementVO = new VarNodePerfElementVO();


    public load_nodes_datas: VarNodePerfElementVO = new VarNodePerfElementVO();
    public compute_node: VarNodePerfElementVO = new VarNodePerfElementVO();

    public skip_ctree_ddeps_try_load_cache_complet(var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs(this.get_parents_ctree_ddeps_try_load_cache_complet(var_dag));
    }
    public init_estimated_work_time_ctree_ddeps_try_load_cache_complet(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_complet.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_try_load_cache_complet(var_dag));
    }
    public update_estimated_work_time_ctree_ddeps_try_load_cache_complet(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_complet.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_try_load_cache_complet(var_dag));
    }

    public skip_ctree_ddeps_load_imports_and_split_nodes(var_dag: VarDAG) {
        this.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs(this.get_parents_ctree_ddeps_load_imports_and_split_nodes(var_dag));
    }
    public init_estimated_work_time_ctree_ddeps_load_imports_and_split_nodes(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_load_imports_and_split_nodes.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_load_imports_and_split_nodes(var_dag));
    }
    public update_estimated_work_time_ctree_ddeps_load_imports_and_split_nodes(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_load_imports_and_split_nodes.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_load_imports_and_split_nodes(var_dag));
    }

    public skip_ctree_ddeps_try_load_cache_partiel(var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs(this.get_parents_ctree_ddeps_try_load_cache_partiel(var_dag));
    }
    public init_estimated_work_time_ctree_ddeps_try_load_cache_partiel(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_partiel.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_try_load_cache_partiel(var_dag));
    }
    public update_estimated_work_time_ctree_ddeps_try_load_cache_partiel(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_try_load_cache_partiel.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_try_load_cache_partiel(var_dag));
    }

    public skip_ctree_ddeps_get_node_deps(var_dag: VarDAG) {
        this.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs(this.get_parents_ctree_ddeps_get_node_deps(var_dag));
    }
    public init_estimated_work_time_ctree_ddeps_get_node_deps(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_get_node_deps.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_get_node_deps(var_dag));
    }
    public update_estimated_work_time_ctree_ddeps_get_node_deps(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_get_node_deps.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_get_node_deps(var_dag));
    }

    public skip_ctree_ddeps_handle_pixellisation(var_dag: VarDAG) {
        this.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs(this.get_parents_ctree_ddeps_handle_pixellisation(var_dag));
    }
    public init_estimated_work_time_ctree_ddeps_handle_pixellisation(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_handle_pixellisation.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_handle_pixellisation(var_dag));
    }
    public update_estimated_work_time_ctree_ddeps_handle_pixellisation(estimated_work_time: number, var_dag: VarDAG) {
        this.ctree_ddeps_handle_pixellisation.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_ctree_ddeps_handle_pixellisation(var_dag));
    }



    public skip_load_nodes_datas(var_dag: VarDAG) {
        this.load_nodes_datas.skip_and_update_parents_perfs(this.get_parents_load_nodes_datas(var_dag));
    }
    public init_estimated_work_time_load_nodes_datas(estimated_work_time: number, var_dag: VarDAG) {
        this.load_nodes_datas.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_load_nodes_datas(var_dag));
    }
    public update_estimated_work_time_load_nodes_datas(estimated_work_time: number, var_dag: VarDAG) {
        this.load_nodes_datas.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_load_nodes_datas(var_dag));
    }

    public skip_compute_node(var_dag: VarDAG) {
        this.compute_node.skip_and_update_parents_perfs(this.get_parents_compute_node(var_dag));
    }
    public init_estimated_work_time_compute_node(estimated_work_time: number, var_dag: VarDAG) {
        this.compute_node.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_compute_node(var_dag));
    }
    public update_estimated_work_time_compute_node(estimated_work_time: number, var_dag: VarDAG) {
        this.compute_node.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_compute_node(var_dag));
    }

    private get_parents_ctree_ddeps_try_load_cache_complet(var_dag: VarDAG) {
        return [this.ctree_deploy_deps, var_dag.perfs.ctree_ddeps_try_load_cache_complet, var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_load_imports_and_split_nodes(var_dag: VarDAG) {
        return [this.ctree_deploy_deps, var_dag.perfs.ctree_ddeps_load_imports_and_split_nodes, var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_try_load_cache_partiel(var_dag: VarDAG) {
        return [this.ctree_deploy_deps, var_dag.perfs.ctree_ddeps_try_load_cache_partiel, var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_get_node_deps(var_dag: VarDAG) {
        return [this.ctree_deploy_deps, var_dag.perfs.ctree_ddeps_get_node_deps, var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_handle_pixellisation(var_dag: VarDAG) {
        return [this.ctree_deploy_deps, var_dag.perfs.ctree_ddeps_handle_pixellisation, var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.batch_wrapper];
    }

    private get_parents_load_nodes_datas(var_dag: VarDAG) {
        return [var_dag.perfs.load_nodes_datas, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_compute_node(var_dag: VarDAG) {
        return [var_dag.perfs.compute_node, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
}
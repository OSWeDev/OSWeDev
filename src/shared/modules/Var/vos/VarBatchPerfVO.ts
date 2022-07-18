import IDistantVOBase from '../../IDistantVOBase';
import VarDAG from '../graph/VarDAG';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_perf";

    public _type: string = VarBatchPerfVO.API_TYPE_ID;
    public id: number;

    public batch_id: number;

    public batch_wrapper: VarNodePerfElementVO;
    //+ batch_wrapper
    public handle_invalidate_intersectors: VarNodePerfElementVO;
    public handle_invalidate_matroids: VarNodePerfElementVO;

    public handle_buffer_varsdatasproxy: VarNodePerfElementVO;
    public handle_buffer_varsdatasvoupdate: VarNodePerfElementVO;

    public computation_wrapper: VarNodePerfElementVO;
    //+ computation_wrapper
    public create_tree: VarNodePerfElementVO;
    public ctree_deploy_deps: VarNodePerfElementVO;
    public ctree_ddeps_try_load_cache_complet: VarNodePerfElementVO;
    public ctree_ddeps_load_imports_and_split_nodes: VarNodePerfElementVO;
    public ctree_ddeps_try_load_cache_partiel: VarNodePerfElementVO;
    public ctree_ddeps_get_node_deps: VarNodePerfElementVO;
    public ctree_ddeps_handle_pixellisation: VarNodePerfElementVO;

    public load_nodes_datas: VarNodePerfElementVO;
    public compute_node_wrapper: VarNodePerfElementVO;
    public compute_node: VarNodePerfElementVO;
    //- computation_wrapper

    public cache_datas: VarNodePerfElementVO;
    //- batch_wrapper

    /**
     * Nombre de vars qu'on essaie vraiment de résoudre à la base
     */
    public nb_batch_vars: number;


    public skip_handle_invalidate_intersectors(var_dag: VarDAG) {
        this.handle_invalidate_intersectors.skip_and_update_parents_perfs(this.get_parents_handle_invalidate_intersectors(var_dag));
    }
    public init_estimated_work_time_handle_invalidate_intersectors(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_invalidate_intersectors.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_invalidate_intersectors(var_dag));
    }
    public update_estimated_work_time_handle_invalidate_intersectors(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_invalidate_intersectors.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_invalidate_intersectors(var_dag));
    }
    public skip_handle_invalidate_matroids(var_dag: VarDAG) {
        this.handle_invalidate_matroids.skip_and_update_parents_perfs(this.get_parents_handle_invalidate_matroids(var_dag));
    }
    public init_estimated_work_time_handle_invalidate_matroids(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_invalidate_matroids.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_invalidate_matroids(var_dag));
    }
    public update_estimated_work_time_handle_invalidate_matroids(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_invalidate_matroids.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_invalidate_matroids(var_dag));
    }

    public skip_handle_buffer_varsdatasproxy(var_dag: VarDAG) {
        this.handle_buffer_varsdatasproxy.skip_and_update_parents_perfs(this.get_parents_handle_buffer_varsdatasproxy(var_dag));
    }
    public init_estimated_work_time_handle_buffer_varsdatasproxy(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_buffer_varsdatasproxy.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_buffer_varsdatasproxy(var_dag));
    }
    public update_estimated_work_time_handle_buffer_varsdatasproxy(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_buffer_varsdatasproxy.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_buffer_varsdatasproxy(var_dag));
    }
    public skip_handle_buffer_varsdatasvoupdate(var_dag: VarDAG) {
        this.handle_buffer_varsdatasvoupdate.skip_and_update_parents_perfs(this.get_parents_handle_buffer_varsdatasvoupdate(var_dag));
    }
    public init_estimated_work_time_handle_buffer_varsdatasvoupdate(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_buffer_varsdatasvoupdate.init_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_buffer_varsdatasvoupdate(var_dag));
    }
    public update_estimated_work_time_handle_buffer_varsdatasvoupdate(estimated_work_time: number, var_dag: VarDAG) {
        this.handle_buffer_varsdatasvoupdate.update_estimated_work_time_and_update_parents_perfs(estimated_work_time, this.get_parents_handle_buffer_varsdatasvoupdate(var_dag));
    }


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







    private get_parents_handle_invalidate_intersectors(var_dag: VarDAG) {
        return [var_dag.perfs.batch_wrapper];
    }
    private get_parents_handle_invalidate_matroids(var_dag: VarDAG) {
        return [var_dag.perfs.batch_wrapper];
    }

    private get_parents_handle_buffer_varsdatasproxy(var_dag: VarDAG) {
        return [var_dag.perfs.batch_wrapper];
    }
    private get_parents_handle_buffer_varsdatasvoupdate(var_dag: VarDAG) {
        return [var_dag.perfs.batch_wrapper];
    }


    private get_parents_ctree_ddeps_try_load_cache_complet(var_dag: VarDAG) {
        return [var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_load_imports_and_split_nodes(var_dag: VarDAG) {
        return [var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_try_load_cache_partiel(var_dag: VarDAG) {
        return [var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_get_node_deps(var_dag: VarDAG) {
        return [var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_ctree_ddeps_handle_pixellisation(var_dag: VarDAG) {
        return [var_dag.perfs.ctree_deploy_deps, var_dag.perfs.create_tree, var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }

    private get_parents_load_nodes_datas(var_dag: VarDAG) {
        return [var_dag.perfs.computation_wrapper, var_dag.perfs.batch_wrapper];
    }
    private get_parents_compute_node(var_dag: VarDAG) {
        return [var_dag.perfs.computation_wrapper, var_dag.perfs.compute_node_wrapper, var_dag.perfs.batch_wrapper];
    }
}
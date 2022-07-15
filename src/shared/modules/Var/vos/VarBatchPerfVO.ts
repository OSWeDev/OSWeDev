import ConfigurationService from '../../../../server/env/ConfigurationService';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import IDistantVOBase from '../../IDistantVOBase';
import VarBatchVarPerfVO from './VarBatchVarPerfVO';
import VarNodePerfElementVO from './VarNodePerfElementVO';

export default class VarBatchPerfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_batch_perf";

    public _type: string = VarBatchPerfVO.API_TYPE_ID;
    public id: number;

    public batch_id: number;

    public computation_wrapper: VarNodePerfElementVO;

    public var_perfs: VarBatchVarPerfVO[];

    public handle_invalidate_intersectors: VarNodePerfElementVO;
    public handle_invalidate_matroids: VarNodePerfElementVO;

    public handle_buffer_varsdatasproxy: VarNodePerfElementVO;
    public handle_buffer_varsdatasvoupdate: VarNodePerfElementVO;

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

    public cache_datas: VarNodePerfElementVO;

    // Les estimations concernent la partie centrale, les vars : create_tree + load_nodes_datas + compute_node

    public initial_estimated_time: number;
    public start_time: number;
    public current_estimated_remaining_time: number;
    public total_elapsed_time: number;
    public end_time: number;

    /**
     * Nombre de vars qu'on essaie vraiment de résoudre à la base
     */
    public nb_batch_vars: number;

    public start() {
        this.start_time = performance.now();

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread:VarBatchPerfVO:start");
        }
    }

    public end() {
        this.end_time = performance.now();
        this.total_elapsed_time = this.end_time - this.start_time;

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log("VarsdatasComputerBGThread:VarBatchPerfVO:end");
        }
    }
}
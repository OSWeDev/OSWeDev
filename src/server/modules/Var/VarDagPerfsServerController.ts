import { performance } from "perf_hooks";
import VarNodePerfElementVO from "../../../shared/modules/Var/vos/VarNodePerfElementVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ConfigurationService from "../../env/ConfigurationService";
import VarsComputeController from "./VarsComputeController";
import VarDAG from "../../../shared/modules/Var/graph/VarDAG";

export default class VarDagPerfsServerController {

    public static async dag_is_in_timeout_with_elpased_time(var_dag: VarDAG): Promise<boolean> {
        let estimated_tree_computation_time_limit = await VarsComputeController.get_estimated_tree_computation_time_limit();

        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
        let current_computation_wrapper_total_elapsed_time = var_dag.perfs ? performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;

        return (batchperf_computation_wrapper_total_estimated_remaining_time && current_computation_wrapper_total_elapsed_time && ((batchperf_computation_wrapper_total_estimated_remaining_time + current_computation_wrapper_total_elapsed_time) > estimated_tree_computation_time_limit));
    }

    public static async dag_is_in_timeout_without_elpased_time(var_dag: VarDAG): Promise<boolean> {
        let estimated_tree_computation_time_limit = await VarsComputeController.get_estimated_tree_computation_time_limit();

        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;

        return (batchperf_computation_wrapper_total_estimated_remaining_time && (batchperf_computation_wrapper_total_estimated_remaining_time > estimated_tree_computation_time_limit));
    }


    public static getInstance(): VarDagPerfsServerController {
        if (!VarDagPerfsServerController.instance) {
            VarDagPerfsServerController.instance = new VarDagPerfsServerController();
        }
        return VarDagPerfsServerController.instance;
    }

    private static instance: VarDagPerfsServerController = null;

    protected constructor() {
    }

    /**
     * 2 cas : on a des enfants : on prend la somme des estimations de temps restant sur les enfants. sinon on calcul sur soi
     * @param nodeperfelement
     * @returns
     */
    public get_nodeperfelement_estimated_remaining_work_time(nodeperfelement: VarNodePerfElementVO): number {

        if (!nodeperfelement) {
            return 0;
        }

        if (nodeperfelement.child_perfs_ref && nodeperfelement.child_perfs_ref.length) {
            return (
                Math.max(
                    0,
                    (nodeperfelement.start_time_global - nodeperfelement.nb_started_global * performance.now()) +
                    ((nodeperfelement.updated_estimated_work_time_global / nodeperfelement.nb_noeuds_global) * nodeperfelement.nb_started_global))
            ) + (
                    (nodeperfelement.updated_estimated_work_time_global / nodeperfelement.nb_noeuds_global) * (nodeperfelement.nb_noeuds_global - nodeperfelement.nb_started_global)
                );
        }

        return Math.max(0, (
            ((!!nodeperfelement.updated_estimated_work_time) && !!nodeperfelement.start_time) ?
                (nodeperfelement.start_time + nodeperfelement.updated_estimated_work_time) - performance.now() :
                ((!!nodeperfelement.updated_estimated_work_time) ? nodeperfelement.updated_estimated_work_time : 0)));
    }

    public start_nodeperfelement(nodeperfelement: VarNodePerfElementVO, log_perf_name: string = null) {
        if (!nodeperfelement) {
            return;
        }

        nodeperfelement.start_time = performance.now();

        if (log_perf_name && ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log("VarsdatasComputerBGThread:VarNodePerfElementVO:" + log_perf_name + ":start" +
                (nodeperfelement.initial_estimated_work_time != null ? ':initial_estimated_work_time:' +
                    (Math.round((nodeperfelement.initial_estimated_work_time ? nodeperfelement.initial_estimated_work_time : 0) * 100) / 100) + ' ms' : '') +
                (nodeperfelement.updated_estimated_work_time != null ? ':updated_estimated_work_time:' +
                    (Math.round((nodeperfelement.updated_estimated_work_time ? nodeperfelement.updated_estimated_work_time : 0) * 100) / 100) + ' ms' : ''));
        }
    }

    public end_nodeperfelement(nodeperfelement: VarNodePerfElementVO, log_perf_name: string = null) {
        if (!nodeperfelement) {
            return;
        }

        nodeperfelement.end_time = performance.now();
        let nodeperfelement_elapsed_time = nodeperfelement.end_time - nodeperfelement.start_time;
        nodeperfelement.total_elapsed_time = (!nodeperfelement.total_elapsed_time) ? nodeperfelement_elapsed_time : (nodeperfelement.total_elapsed_time + nodeperfelement_elapsed_time);

        if (log_perf_name && ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log("VarsdatasComputerBGThread:VarNodePerfElementVO:" + log_perf_name + ":end:elapsed:" +
                (Math.round(nodeperfelement.total_elapsed_time * 100) / 100) + ' ms' +
                (nodeperfelement.initial_estimated_work_time != null ? ':initial_estimated_work_time:' +
                    (Math.round((nodeperfelement.initial_estimated_work_time ? nodeperfelement.initial_estimated_work_time : 0) * 100) / 100) + ' ms' : '') +
                (nodeperfelement.updated_estimated_work_time != null ? ':updated_estimated_work_time:' +
                    (Math.round((nodeperfelement.updated_estimated_work_time ? nodeperfelement.updated_estimated_work_time : 0) * 100) / 100) + ' ms' : ''));
        }
    }
}
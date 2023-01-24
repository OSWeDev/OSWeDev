import { performance } from "perf_hooks";
import VarNodePerfElementVO from "../../../shared/modules/Var/vos/VarNodePerfElementVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ConfigurationService from "../../env/ConfigurationService";

export default class VarDagPerfsServerController {

    public static getInstance(): VarDagPerfsServerController {
        if (!VarDagPerfsServerController.instance) {
            VarDagPerfsServerController.instance = new VarDagPerfsServerController();
        }
        return VarDagPerfsServerController.instance;
    }

    private static instance: VarDagPerfsServerController = null;

    protected constructor() {
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
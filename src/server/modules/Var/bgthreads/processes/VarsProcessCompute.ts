import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';

export default class VarsProcessCompute extends VarsProcessBase {


    private static instance: VarsProcessCompute = null;

    private constructor() {
        super(
            'VarsProcessCompute',
            VarDAGNode.TAG_4_IS_COMPUTABLE,
            VarDAGNode.TAG_4_COMPUTING,
            VarDAGNode.TAG_4_COMPUTED,
            // 2
        );
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessCompute.instance) {
            VarsProcessCompute.instance = new VarsProcessCompute();
        }
        return VarsProcessCompute.instance;
    }

    protected async worker_async(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): Promise<boolean> {
        return false;
    }
    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }, nodes_to_unlock: VarDAGNode[]): Promise<boolean> {
        return false;
    }

    protected worker_sync(node: VarDAGNode, nodes_to_unlock: VarDAGNode[]): boolean {

        const controller = VarsServerController.getVarControllerById(node.var_data.var_id);

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessCompute:IN:' + node.var_data.index);
        }

        /**
         * Petit check en amont, si on a un denied en dep, on est denied par def donc on appel pas le compute
         */
        for (const i in node.outgoing_deps) {
            const dep = node.outgoing_deps[i];
            const dep_node: VarDAGNode = dep.outgoing_node as VarDAGNode;

            if (dep_node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                node.var_data.value = null;
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                StatsController.register_stat_COMPTEUR('VarsProcessCompute', 'worker_sync_denied_dep', controller.varConf.name);
                return true;
            }
        }

        try {
            controller.computeValue(node);
        } catch (error) {
            ConsoleHandler.error('VarsProcessCompute:ERROR:' + node.var_data.index + ':error:' + error);
            StatsController.register_stat_COMPTEUR('VarsProcessCompute', 'worker_sync_computeValue_throws', controller.varConf.name);
            node.var_data.value = null;
            node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
            return true;
        }

        if (ConfigurationService.node_configuration.debug_vars) {
            ConsoleHandler.log('VarsProcessCompute:OUT:' + node.var_data.index + ':value:' + node.var_data.value);
        }

        return true;
    }
}
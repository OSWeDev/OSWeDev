import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessCompute extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessCompute.instance) {
            VarsProcessCompute.instance = new VarsProcessCompute();
        }
        return VarsProcessCompute.instance;
    }

    private static instance: VarsProcessCompute = null;

    private constructor() {
        super('VarsProcessCompute', VarDAGNode.TAG_3_DATA_LOADED, VarDAGNode.TAG_4_COMPUTING, VarDAGNode.TAG_4_COMPUTED, 10);
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }
    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }

    protected worker_sync(node: VarDAGNode): boolean {

        if (!node.is_computable) {
            return false;
        }

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
        controller.computeValue(node);

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessCompute: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        return true;
    }
}
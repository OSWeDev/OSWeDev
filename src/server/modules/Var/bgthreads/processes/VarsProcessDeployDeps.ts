import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDeployDeps extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessDeployDeps.instance) {
            VarsProcessDeployDeps.instance = new VarsProcessDeployDeps();
        }
        return VarsProcessDeployDeps.instance;
    }

    private static instance: VarsProcessDeployDeps = null;

    private constructor() {
        super('VarsProcessDeployDeps', VarDAGNode.TAG_TO_DEPLOY, 1, false, ConfigurationService.node_configuration.MAX_VarsProcessDeployDeps);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> { }
    protected worker_sync(node: VarDAGNode): void { }

    protected async worker_async(node: VarDAGNode): Promise<void> {
        TODO
    }
}
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
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
        super('VarsProcessCompute', VarDAGNode.TAG_TO_COMPUTE, VarDAGNode.TAG_COMPUTING, VarDAGNode.TAG_TO_NOTIFY, 1);
    }

    protected async worker_async(node: VarDAGNode): Promise<void> { }
    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> { }

    protected worker_sync(node: VarDAGNode): void {
        TODO
    }

}
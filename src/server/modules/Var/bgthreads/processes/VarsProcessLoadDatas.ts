import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessLoadDatas extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessLoadDatas.instance) {
            VarsProcessLoadDatas.instance = new VarsProcessLoadDatas();
        }
        return VarsProcessLoadDatas.instance;
    }

    private static instance: VarsProcessLoadDatas = null;

    private constructor() {
        super('VarsProcessLoadDatas', VarDAGNode.TAG_TO_DATA_LOAD, 1, false, ConfigurationService.node_configuration.MAX_VarsProcessLoadDatas);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> { }
    protected worker_sync(node: VarDAGNode): void { }

    protected async worker_async(node: VarDAGNode): Promise<void> {
        TODO
    }
}
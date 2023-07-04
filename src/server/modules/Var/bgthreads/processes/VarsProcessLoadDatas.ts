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
        super('VarsProcessLoadDatas', VarDAGNode.TAG_2_DEPLOYED, VarDAGNode.TAG_3_DATA_LOADING, VarDAGNode.TAG_3_DATA_LOADED, 10, false, ConfigurationService.node_configuration.MAX_VarsProcessLoadDatas);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }
    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        TODO
        return true;
    }
}
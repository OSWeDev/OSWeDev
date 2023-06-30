import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessUpdateDB extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessUpdateDB.instance) {
            VarsProcessUpdateDB.instance = new VarsProcessUpdateDB();
        }
        return VarsProcessUpdateDB.instance;
    }

    private static instance: VarsProcessUpdateDB = null;

    private constructor() {
        super('VarsProcessUpdateDB', VarDAGNode.TAG_TO_UPDATE_IN_DB, 60000, true);
    }

    protected worker_sync(node: VarDAGNode): void { }
    protected async worker_async(node: VarDAGNode): Promise<void> { }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> {
        TODO
    }
}
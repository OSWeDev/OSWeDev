import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessUnregisteredNodeMarker extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessUnregisteredNodeMarker.instance) {
            VarsProcessUnregisteredNodeMarker.instance = new VarsProcessUnregisteredNodeMarker();
        }
        return VarsProcessUnregisteredNodeMarker.instance;
    }

    private static instance: VarsProcessUnregisteredNodeMarker = null;

    private constructor() {
        super('VarsProcessUnregisteredNodeMarker', VarDAGNode.TAG_CLIENT, 10000, true);
    }

    protected async worker_async(node?: VarDAGNode): Promise<void> { }
    protected worker_sync(node: VarDAGNode): void { }

    /**
     * Objectif : marquer tous les noeuds qui ne sont plus registered en client comme non client, et si non serveur aussi, alors ajout du tag TO_DELETE
     * @param node
     */
    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> {
        TODO
    }
}
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDagCleaner extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessDagCleaner.instance) {
            VarsProcessDagCleaner.instance = new VarsProcessDagCleaner();
        }
        return VarsProcessDagCleaner.instance;
    }

    private static instance: VarsProcessDagCleaner = null;

    // Cas particulier de la suppression de noeud, si le noeud existe encore en post traitement, on doit le tagguer à supprimer pour le prochain tour
    private constructor() {
        super('VarsProcessDagCleaner', VarDAGNode.TAG_TO_DELETE, VarDAGNode.TAG_DELETING, VarDAGNode.TAG_TO_DELETE, 5000, batch ou pas ? false, ConfigurationService.node_configuration.MAX_VarsProcessDagCleaner);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<void> { }
    protected worker_sync(node: VarDAGNode): void { }

    protected async worker_async(node: VarDAGNode): Promise<void> {
        TODO
    }
}
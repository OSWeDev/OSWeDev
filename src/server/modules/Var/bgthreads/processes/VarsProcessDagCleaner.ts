import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDagCleaner extends VarsProcessBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessDagCleaner.instance) {
            VarsProcessDagCleaner.instance = new VarsProcessDagCleaner();
        }
        return VarsProcessDagCleaner.instance;
    }

    private static instance: VarsProcessDagCleaner = null;

    // Cas particulier de la suppression de noeud, si le noeud existe encore en post traitement, on doit le tagguer à supprimer pour le prochain tour
    private constructor() {
        super('VarsProcessDagCleaner', VarDAGNode.TAG_6_UPDATED_IN_DB, VarDAGNode.TAG_7_DELETING, VarDAGNode.TAG_6_UPDATED_IN_DB, 5000, false);
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }

    protected worker_sync(node: VarDAGNode): boolean {
        if (!node.is_deletable) {
            return false;
        }

        node.unlinkFromDAG();

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessDagCleaner: ' + node.var_data.index + ' ' + node.var_data.value);
        }
        return true;
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }
}
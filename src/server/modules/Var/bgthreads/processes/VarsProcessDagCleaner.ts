import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarDAGNode from '../../../../modules/Var/vos/VarDAGNode';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessDagCleaner extends VarsProcessBase {

    private static instance: VarsProcessDagCleaner = null;

    // Cas particulier de la suppression de noeud, si le noeud existe encore en post traitement, on doit le tagguer à supprimer pour le prochain tour
    private constructor() {
        super(
            'VarsProcessDagCleaner',
            VarDAGNode.TAG_7_IS_DELETABLE,
            VarDAGNode.TAG_7_DELETING,
            VarDAGNode.TAG_6_UPDATED_IN_DB,
            // 2,
            true,
            ConfigurationService.node_configuration.max_varsprocessdagcleaner,
        );
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessDagCleaner.instance) {
            VarsProcessDagCleaner.instance = new VarsProcessDagCleaner();
        }
        return VarsProcessDagCleaner.instance;
    }


    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }, nodes_to_unlock: { [index: string]: VarDAGNode }): Promise<boolean> {
        // //FIXME DELETE
        // this.check_dag();

        for (const i in nodes) {
            const node = nodes[i];

            const outgoings = node.outgoing_deps;
            if (!node.unlinkFromDAG()) {
                continue;
            }

            // //FIXME DELETE
            // this.check_dag();

            // On impacte le tag sur les old outgoings si ils sont deletable
            for (const j in outgoings) {
                const child_node: VarDAGNode = outgoings[j].outgoing_node as VarDAGNode;

                if (child_node.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_7_IS_DELETABLE]) {
                    continue;
                }

                if (child_node.is_deletable) {
                    child_node.add_tag(VarDAGNode.TAG_7_IS_DELETABLE);

                    if (child_node.tags[VarDAGNode.TAG_6_UPDATED_IN_DB]) {
                        child_node.remove_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
                    }
                }
            }

            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log('VarsProcessDagCleaner: ' + node.var_data.index + ' ' + node.var_data.value);
            }
        }
        return true;
    }

    protected worker_sync(node: VarDAGNode, nodes_to_unlock: { [index: string]: VarDAGNode }): boolean {
        return false;
    }

    protected async worker_async(node: VarDAGNode, nodes_to_unlock: { [index: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }
}
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessCompute extends VarsProcessBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessCompute.instance) {
            VarsProcessCompute.instance = new VarsProcessCompute();
        }
        return VarsProcessCompute.instance;
    }

    private static instance: VarsProcessCompute = null;

    private constructor() {
        super('VarsProcessCompute', VarDAGNode.TAG_4_IS_COMPUTABLE, VarDAGNode.TAG_4_COMPUTING, VarDAGNode.TAG_4_COMPUTED, 10);
    }

    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }
    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {
        return false;
    }

    protected worker_sync(node: VarDAGNode): boolean {

        let controller = VarsServerController.getVarControllerById(node.var_data.var_id);
        controller.computeValue(node);

        // On impacte le tag sur les parents si tous leurs enfants sont computed
        for (let i in node.incoming_deps) {
            let deps = node.incoming_deps[i];

            for (let k in deps) {
                let dep = deps[k];

                let parent_node: VarDAGNode = dep.incoming_node as VarDAGNode;

                if (parent_node.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_IS_COMPUTABLE]) {
                    continue;
                }

                // On veut un is_computable mais avec un is_computing sur le noeud en cours de work
                let parent_is_computable = true;
                for (let j in parent_node.outgoing_deps) {
                    let outgoing_dep = parent_node.outgoing_deps[j];

                    if (outgoing_dep.outgoing_node == node) {
                        continue;
                    }

                    if ((outgoing_dep.outgoing_node as VarDAGNode).current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTED]) {
                        parent_is_computable = false;
                        break;
                    }
                }

                if (parent_is_computable) {
                    parent_node.add_tag(VarDAGNode.TAG_4_IS_COMPUTABLE);

                    if (parent_node.tags[VarDAGNode.TAG_3_DATA_LOADED]) {
                        parent_node.remove_tag(VarDAGNode.TAG_3_DATA_LOADED);
                    }
                }
            }
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsProcessCompute: ' + node.var_data.index + ' ' + node.var_data.value);
        }

        return true;
    }
}
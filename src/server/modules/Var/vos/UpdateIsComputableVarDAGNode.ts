import ThrottleHelper from "../../../../shared/tools/ThrottleHelper";
import VarDAGNode from "./VarDAGNode";

export default class UpdateIsComputableVarDAGNode {

    public static throttle_update_is_computable_var_dag_node = ThrottleHelper.declare_throttle_with_mappable_args(UpdateIsComputableVarDAGNode.update_is_computable_var_dag_node, 1);

    private static update_is_computable_var_dag_node(nodes: { [node_name: string]: VarDAGNode }) {

        // On impacte le tag sur les parents si tous leurs enfants sont computed
        for (const i in nodes) {
            const parent_node = nodes[i];

            // Si déjà taggé on refait pas
            if ((parent_node.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_IS_COMPUTABLE]) ||
                parent_node.tags[VarDAGNode.TAG_4_IS_COMPUTABLE]) {
                continue;
            }

            // Si le parent est pas encore déployé, on peut pas vérifier ses dépendances sortantes puisqu'elles sont pas encore déployées
            if (parent_node.current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_2_DEPLOYED]) {
                continue;
            }

            // On veut un is_computable mais avec un is_computing sur le noeud en cours de work
            let parent_is_computable = true;
            for (const j in parent_node.outgoing_deps) {
                const outgoing_dep = parent_node.outgoing_deps[j];

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
}

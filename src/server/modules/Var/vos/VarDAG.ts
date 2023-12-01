import DAG from "../../../../shared/modules/Var/graph/dagbase/DAG";
import VarDAGNode from "./VarDAGNode";

export default class VarDAG extends DAG<VarDAGNode> {

    /**
     * On stocke les tags des étapes courantes, c'est à dire le tag dont la valeur issue de VarDAGNode.STEP_TAGS_INDEXES[TAG_NAME]
     *  est la plus petite parmis les tags de type STEP
     * (ex si on a les tag TAG_0_CREATED, TAG_3_DATA_LOADED, TAG_5_NOTIFIED_END, on stocke le noeud uniquement dans TAG_0_CREATED)
     * La mise à jour se fait lors de l'ajout ou la suppression d'un tag sur un noeud
     */
    public current_step_tags: { [tag: string]: { [name: string]: VarDAGNode } } = {};

    public constructor() {
        super();
    }
}
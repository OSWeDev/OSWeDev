import IVarDAGDataHolder from './IVarDAGDataHolder';
import VarDAGNode from './VarDAGNode';

export default class VarDAGNodeDep implements IVarDAGDataHolder {

    public incoming_node: VarDAGNode = null;
    public outgoing_nodes: { [node_name: string]: VarDAGNode } = {};

    /**
     * Label qui permet d'identifier la liaison explicitement sur le noeud incoming pour faciliter les calculs
     *  Le nom doit être unique à l'échelle d'un node
     */
    public dep_name: string = null;

    /**
     * On ne peut pas supprimer une dep par défaut, sauf si on la crée en indiquant qu'elle n'est pas registered
     *  les noeuds étant registered avant de déployer les deps, on a pas de risque de créer un noeud registered après un non registered dont le param serait identique
     *  ce qui serait un problème sinon
     */
    public can_be_deleted: boolean = false;

    /**
     * La valeur 'cumulée' des noeuds outgoings :
     *  - undefined indique une valeur non calculée
     *  - null indique une valeur calculée, dont le résultat est : null
     */
    public value = undefined;

    /**
     * L'index du var data qui sert à initialiser la lisaison. Initialement on crée toujours le lien sur un noeud, et on splitt le noeud au besoin ensuite
     *  le var index lui n'est jamais modifié. Il est utilisé pour permettre de retrouver la valeur aggrégée si celle-ci est registered
     */
    public var_index: string = null;

    /**
     * Est-ce que la valeur doit être recalculée (en cas d'invalidation d'un outgoing, il faut invalider la value groupée)
     */
    public needs_computation: boolean = true;

    public constructor(dep_name: string, outgoing_nodes: { [node_name: string]: VarDAGNode }) {
        this.dep_name = dep_name;
        this.outgoing_nodes = outgoing_nodes;
    }
}
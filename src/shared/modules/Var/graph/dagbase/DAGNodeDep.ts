import DAGNodeBase from './DAGNodeBase';

export default class DAGNodeDep<T extends DAGNodeBase> {

    public incoming_node: T;
    public outgoing_node: T;

    /**
     * Label qui permet d'identifier la liaison explicitement sur le noeud incoming pour faciliter les calculs
     *  Le nom doit être unique à l'échelle d'un node
     */
    public dep_name: string;

    /**
     * DON'T USE this method to add a dep to a node, use addOutgoingDep on the node directly
     * @param dep_name
     * @param outgoing_node
     */
    public constructor(dep_name: string, outgoing_node: T) {
        this.dep_name = dep_name;
        this.outgoing_node = outgoing_node;
    }
}
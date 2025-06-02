import DAGNodeBase from './DAGNodeBase';

export default class DAG<T extends DAGNodeBase> {

    private static NEXT_UID: number = 0;

    // UID pour ce DAG, qui permettra de séparer les actions / caches en fonction du DAG
    public uid: number = DAG.NEXT_UID++;

    public nb_nodes: number = 0;
    public nodes: { [name: string]: T } = {};

    public roots: { [name: string]: T } = {};
    public leafs: { [name: string]: T } = {};

    public tags: { [tag: string]: { [name: string]: T } } = {};

    public constructor() { }

    /**
     * Méthode pour checker qu'il n'y a pas de cycle dans le DAG
     * @param dag
     */
    public is_acyclic_dag(dag: DAG<T>): boolean {
        const visited: { [name: string]: boolean } = {};
        const stack: { [name: string]: boolean } = {};

        for (const node_name in dag.nodes) {
            if (!visited[node_name]) {
                if (this.is_cyclic_util(dag.nodes[node_name], visited, stack)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Méthode utilitaire pour le check de cycle
     * @param node
     * @param visited
     * @param stack
     */
    private is_cyclic_util(node: T, visited: { [name: string]: boolean }, stack: { [name: string]: boolean }): boolean {
        if (!visited[node.node_name]) {
            visited[node.node_name] = true;
            stack[node.node_name] = true;

            for (const dep_name in node.outgoing_deps) {
                const dep = node.outgoing_deps[dep_name];
                if (!visited[dep.outgoing_node.node_name] && this.is_cyclic_util(dep.outgoing_node as T, visited, stack)) {
                    return true;
                } else if (stack[dep.outgoing_node.node_name]) {
                    return true;
                }
            }
        }
        stack[node.node_name] = false;
        return false;
    }
}

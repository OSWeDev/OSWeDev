import DAG from './DAG';
import DAGNode from './DAGNode';
import DAGVisitorBase from './DAGVisitorBase';

export default class DAGController {

    public static getInstance(): DAGController {
        if (!DAGController.instance) {
            DAGController.instance = new DAGController();
        }
        return DAGController.instance;
    }

    private static instance: DAGController = null;

    private constructor() { }

    /**
     * TODO ASAP VARS TU
     * Visit linéaire de l'arbre, avec possibilité d'interagir avant de continue quand on ne peut plus avancer (selon condition passée en param)
     * @param do_visit_condition pas obligatoire
     * @param visited_node_marker pas obligatoire
     * @param to_visit_roots_marker obligatoire
     */
    public async visit_dag<TNode extends DAGNode, TDAG extends DAG<TNode>>(
        dag: TDAG,
        visitor: DAGVisitorBase<TNode, TDAG>,
        do_visit_condition: (node: TNode) => boolean,
        visited_node_marker: string,
        to_visit_roots_marker: string,
        top_bottom: boolean = true,
        needs_action_before_continue_condition: (node: TNode) => boolean = null,
        action_before_continue: (dag: TDAG, node_names: string[]) => Promise<void> = null) {

        let waiting_node_marker: string = visited_node_marker + '__WAITING';
        let nodes_names: string[] = to_visit_roots_marker ? dag.marked_nodes_names[to_visit_roots_marker] : Object.keys(dag.roots);
        let waiting_nodes_names: string[] = [];

        while (nodes_names && nodes_names.length) {

            for (let root_name in nodes_names) {
                let node_name = nodes_names[root_name];
                let nodes_path: TNode[] = [];
                let actual_node: TNode = dag.nodes[node_name];


                let continue_visit: boolean = true;

                if (actual_node.hasMarker(visited_node_marker)) {
                    continue;
                }

                if (actual_node.hasMarker(waiting_node_marker)) {
                    continue;
                }

                if ((!!do_visit_condition) && (!do_visit_condition(actual_node))) {
                    continue;
                }

                while (continue_visit) {

                    continue_visit = false;
                    let go_further: boolean = false;
                    do {

                        go_further = false;

                        let children = top_bottom ? actual_node.incoming : actual_node.outgoing;

                        for (let i in children) {
                            let child: TNode = children[i] as TNode;

                            if (child.hasMarker(visited_node_marker)) {
                                continue;
                            }

                            if (child.hasMarker(waiting_node_marker)) {
                                continue;
                            }

                            if (!do_visit_condition(actual_node)) {
                                continue;
                            }

                            // On doit compute un noeud, on s'en occuppe
                            nodes_path.unshift(actual_node);
                            actual_node = child;
                            go_further = true;
                            break;
                        }
                    } while (go_further);

                    // On test si on doit faire une action ou pas pour débloquer d'avancer à la ligne suivante
                    if (needs_action_before_continue_condition && needs_action_before_continue_condition(actual_node)) {
                        waiting_nodes_names.push(actual_node.name);

                        if (nodes_path.length > 0) {
                            actual_node = nodes_path.shift();
                            continue_visit = true;
                        }

                        continue;
                    }

                    // On doit pouvoir visiter à ce stade
                    await visitor.visit(actual_node, dag, nodes_path);

                    if (to_visit_roots_marker) {
                        actual_node.removeMarker(to_visit_roots_marker, dag, true);
                    }
                    actual_node.addMarker(visited_node_marker, dag);

                    if (nodes_path.length > 0) {
                        actual_node = nodes_path.shift();
                        continue_visit = true;
                    }
                }
            }

            if (waiting_nodes_names && waiting_nodes_names.length) {
                await action_before_continue(dag, waiting_nodes_names);
                waiting_nodes_names = [];
                // TODO FIXME pas optimal on devrait repartir des noeuds en attente, mais il faut pouvoir remonter jusqu'aux roots et uniquement vers les roots...
            } else {
                nodes_names = [];
            }
        }
    }
}
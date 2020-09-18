import VarDAG from './VarDAG';
import VarDAGNode from './VarDAGNode';

export default class VarDAGController {

    public static getInstance(): VarDAGController {
        if (!VarDAGController.instance) {
            VarDAGController.instance = new VarDAGController();
        }
        return VarDAGController.instance;
    }

    private static instance: VarDAGController = null;

    private constructor() { }

    /**
     * TODO ASAP VARS TU
     * Visit linéaire de l'arbre, avec possibilité d'interagir avant de continue quand on ne peut plus avancer (selon condition passée en param)
     *
     * @param visited_node_marker Identifie un noeud visité et sera laissé en place après la visite
     * @param to_visit_roots_marker Identifie un noeud à visiter obligatoirement
     *
     * @param top_bottom Indique si l'on va dans le sens top=>bottom ou bottom=>top. true = top=>bottom implique qu'on suit les outgoings après chaque visite
     * @param do_not_require_parent_visit_before_marker Indique si l'on doit d'abord remonter jusqu'à l'extrémité de l'arbre (top ou bottom) avant de revenir vers le noeud marqué.
     *    True indique qu'on démarre directement sur le noeud marqué indépendamment des marquages en direction du top / bottom (suivant le param top_bottom)
     * @param do_not_propagate_after_marker Indique si l'on doit après visite continuer jusqu'à l'extrémité de l'arbre (bottom ou top).
     *    True indique qu'on arrête directement sur le noeud marqué
     *
     * @param passthrough_condition Condition qui permet d'indiquer qu'on doit continuer la visite après ce noeud, quelque soit l'issue du do_visit. True pour continuer.
     * @param do_visit_condition Condition qui indique si l'on doit visiter le noeud (même s'il possède le marker) et la visite pourra continuer ou non suivant la passthrough_condition. True pour visiter.
     *
     * @param needs_action_before_continue_condition Condition qui permet d'indiquer qu'on noeud ne peut pas êre visité avant d'avoir été passé à une fonction spécifique
     * @param action_before_continue La fonction qui sera appelée quand on est bloqué dans la visite à cause de la condition needs_action_before_continue_condition.
     *      On lance l'action sur l'ensemble des noeuds en attente directement.
     */
    public async visit_dag<TNode extends VarDAGNode, TDAG extends VarDAG<TNode>>(
        dag: TDAG,

        visitor: DAGVisitorBase<TNode, TDAG>,

        visited_node_marker: string,
        to_visit_roots_marker: string,

        top_bottom: boolean,
        do_not_require_parent_visit_before_marker: boolean,
        do_not_propagate_after_marker: boolean,

        passthrough_condition: (node: TNode) => boolean = null,
        do_visit_condition: (node: TNode) => boolean = null,

        needs_action_before_continue_condition: (node: TNode) => boolean = null,
        action_before_continue: (dag: TDAG, node_names: string[]) => Promise<void> = null) {

        let waiting_node_marker: string = visited_node_marker + '__WAITING';
        if (!dag.marked_nodes_names[to_visit_roots_marker]) {
            return;
        }
        let nodes_names: string[] = to_visit_roots_marker ? Array.from(dag.marked_nodes_names[to_visit_roots_marker]) : Object.keys(dag.roots);
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

                if ((!!passthrough_condition) && (!passthrough_condition(actual_node))) {
                    continue;
                }

                while (continue_visit) {

                    continue_visit = false;

                    if (!do_not_require_parent_visit_before_marker) {

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

                                if ((!!passthrough_condition) && (!passthrough_condition(child))) {
                                    continue;
                                }

                                // On doit compute un noeud, on s'en occuppe
                                nodes_path.unshift(actual_node);
                                actual_node = child;
                                go_further = true;
                                break;
                            }
                        } while (go_further);
                    }

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
                    if ((!do_visit_condition) || (do_visit_condition(actual_node))) {
                        await visitor.visit(actual_node, dag, nodes_path);
                    }

                    actual_node.removeMarker(to_visit_roots_marker, dag, true);
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

                if (do_not_propagate_after_marker) {
                    return;
                }

                break;
            }
        }

        // // Propagate after the markers has been reached
        // for (let root_name in nodes_names) {
        //     let node_name = nodes_names[root_name];
        //     let nodes_path: TNode[] = [];
        //     let actual_node: TNode = dag.nodes[node_name];
        //     let continue_visit: boolean = true;

        //     if ((!!passthrough_condition) && (!passthrough_condition(actual_node))) {
        //         continue;
        //     }

        //     while (continue_visit) {

        //         continue_visit = false;

        //         let go_further: boolean = false;
        //         do {

        //             go_further = false;

        //             let children = !top_bottom ? actual_node.incoming : actual_node.outgoing;

        //             for (let i in children) {
        //                 let child: TNode = children[i] as TNode;

        //                 if (child.hasMarker(visited_node_marker)) {
        //                     continue;
        //                 }

        //                 if (child.hasMarker(waiting_node_marker)) {
        //                     continue;
        //                 }

        //                 if ((!!passthrough_condition) && (!passthrough_condition(child))) {
        //                     continue;
        //                 }

        //                 if ((!do_visit_condition) || (do_visit_condition(actual_node))) {
        //                     await visitor.visit(actual_node, dag, nodes_path);
        //                 }

        //                 nodes_path.unshift(actual_node);
        //                 actual_node = child;
        //                 go_further = true;
        //                 break;
        //             }
        //         } while (go_further);

        //         actual_node.removeMarker(to_visit_roots_marker, dag, true);
        //         actual_node.addMarker(visited_node_marker, dag);

        //         if (nodes_path.length > 0) {
        //             actual_node = nodes_path.shift();
        //             continue_visit = true;
        //         }
        //     }
        // }
    }
}
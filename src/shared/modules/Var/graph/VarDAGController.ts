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
     * Visit bottom->up to node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up to node B => [E, F, B]
     */
    public visit_bottom_up_to_node(target_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        for (let i in target_node.outgoing_deps) {
            let outgoing_dep = target_node.outgoing_deps[i];

            this.visit_bottom_up_to_node(outgoing_dep.outgoing_node, callback);
        }

        callback(target_node);
    }

    /**
     * Visit top->bottom from node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom from node B => [B, E, F]
     */
    public visit_top_bottom_from_node(source_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        callback(source_node);

        for (let i in source_node.outgoing_deps) {
            let outgoing_dep = source_node.outgoing_deps[i];

            this.visit_top_bottom_from_node(outgoing_dep.outgoing_node, callback);
        }
    }

    /**
     * Visit bottom->up from node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up from node B => [B, A]
     */
    public visit_bottom_up_from_node(source_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        callback(source_node);

        for (let i in source_node.incoming_deps) {
            let incoming_dep = source_node.incoming_deps[i];

            this.visit_bottom_up_from_node(incoming_dep.incoming_node, callback);
        }
    }

    /**
     * Visit top->bottom to node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom to node B => [A, B]
     */
    public visit_top_bottom_to_node(target_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        for (let i in target_node.incoming_deps) {
            let incoming_dep = target_node.incoming_deps[i];

            this.visit_top_bottom_to_node(incoming_dep.incoming_node, callback);
        }

        callback(target_node);
    }

    /**
     * Visit bottom->up through node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up through node B => [E, F, B, A]
     */
    public visit_bottom_up_through_node(through_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        for (let i in through_node.outgoing_deps) {
            let outgoing_dep = through_node.outgoing_deps[i];

            this.visit_bottom_up_to_node(outgoing_dep.outgoing_node, callback);
        }

        callback(through_node);

        for (let i in through_node.incoming_deps) {
            let incoming_dep = through_node.incoming_deps[i];

            this.visit_bottom_up_to_node(incoming_dep.incoming_node, callback);
        }
    }

    /**
     * Visit top->bottom through node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * top->bottom through node B => [A, B, E, F]
     */
    public visit_top_bottom_through_node(through_node: VarDAGNode, callback: (node: VarDAGNode) => void): void {

        for (let i in through_node.incoming_deps) {
            let incoming_dep = through_node.incoming_deps[i];

            this.visit_bottom_up_to_node(incoming_dep.incoming_node, callback);
        }

        callback(through_node);

        for (let i in through_node.outgoing_deps) {
            let outgoing_dep = through_node.outgoing_deps[i];

            this.visit_bottom_up_to_node(outgoing_dep.outgoing_node, callback);
        }
    }
}
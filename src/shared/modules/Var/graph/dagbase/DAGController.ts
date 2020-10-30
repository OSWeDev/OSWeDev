import DAGNodeBase from './DAGNodeBase';

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
     * Visit bottom->up to node
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up to node B => [E, F, B]
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_bottom_up_to_node(target_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {


        for (let i in target_node.outgoing_deps) {
            let outgoing_dep = target_node.outgoing_deps[i];

            if ((!visit_condition) || visit_condition(outgoing_dep.outgoing_node)) {
                await this.visit_bottom_up_to_node(outgoing_dep.outgoing_node, callback, visit_condition);
            }
        }

        await callback(target_node);
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
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_top_bottom_from_node(source_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {

        await callback(source_node);

        for (let i in source_node.outgoing_deps) {
            let outgoing_dep = source_node.outgoing_deps[i];

            if ((!visit_condition) || visit_condition(outgoing_dep.outgoing_node)) {
                await this.visit_top_bottom_from_node(outgoing_dep.outgoing_node, callback, visit_condition);
            }
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
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_bottom_up_from_node(source_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {

        await callback(source_node);

        for (let i in source_node.incoming_deps) {
            let incoming_dep = source_node.incoming_deps[i];

            if ((!visit_condition) || visit_condition(incoming_dep.incoming_node)) {
                await this.visit_bottom_up_from_node(incoming_dep.incoming_node, callback, visit_condition);
            }
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
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_top_bottom_to_node(target_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {

        for (let i in target_node.incoming_deps) {
            let incoming_dep = target_node.incoming_deps[i];

            if ((!visit_condition) || visit_condition(incoming_dep.incoming_node)) {
                await this.visit_top_bottom_to_node(incoming_dep.incoming_node, callback, visit_condition);
            }
        }

        await callback(target_node);
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
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_bottom_up_through_node(through_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {

        for (let i in through_node.outgoing_deps) {
            let outgoing_dep = through_node.outgoing_deps[i];

            if ((!visit_condition) || visit_condition(outgoing_dep.outgoing_node)) {
                await this.visit_bottom_up_to_node(outgoing_dep.outgoing_node, callback, visit_condition);
            }
        }

        await callback(through_node);

        for (let i in through_node.incoming_deps) {
            let incoming_dep = through_node.incoming_deps[i];

            if ((!visit_condition) || visit_condition(incoming_dep.incoming_node)) {
                await this.visit_bottom_up_from_node(incoming_dep.incoming_node, callback, visit_condition);
            }
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
     * @param target_node
     * @param callback La fonction a appliquer au node
     * @param visit_condition La condition à remplir pour visiter le noeud, ou null pour tout visiter => la condition n'est pas testée sur le noeud de départ
     */
    public async visit_top_bottom_through_node(through_node: DAGNodeBase, callback: (node: DAGNodeBase) => Promise<any>, visit_condition: (node: DAGNodeBase) => boolean = null): Promise<void> {

        for (let i in through_node.incoming_deps) {
            let incoming_dep = through_node.incoming_deps[i];

            if ((!visit_condition) || visit_condition(incoming_dep.incoming_node)) {
                await this.visit_top_bottom_to_node(incoming_dep.incoming_node, callback, visit_condition);
            }
        }

        await callback(through_node);

        for (let i in through_node.outgoing_deps) {
            let outgoing_dep = through_node.outgoing_deps[i];

            if ((!visit_condition) || visit_condition(outgoing_dep.outgoing_node)) {
                await this.visit_top_bottom_from_node(outgoing_dep.outgoing_node, callback, visit_condition);
            }
        }
    }
}
import ConsoleHandler from '../../../tools/ConsoleHandler';
import ObjectHandler from '../../../tools/ObjectHandler';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import VarsController from '../VarsController';
import VarDAGNode from './VarDAGNode';

export default class VarDAG {

    public nodes_names: string[] = [];
    public nodes: { [name: string]: VarDAGNode } = {};

    public roots: { [name: string]: VarDAGNode } = {};
    public leafs: { [name: string]: VarDAGNode } = {};

    public constructor() { }

    /**
     * Supprime un noeud et ses refs dans les incoming et outgoing
     * On nettoie aussi l'arbre au passage de tout ce qui n'est plus registered ou lié à des registered
     *  (parmis les eléments qu'on est en train de toucher pas sur tout l'arbre)
     */
    public deletedNode(
        node_name: string,
        propagate_to_bottom_if_condition: (propagation_target: string) => boolean
    ) {
        if (!this.nodes[node_name]) {
            return;
        }

        // On supprime le noeud des incomings, et des outgoings
        // On impacte le incoming et le ougoing on fait des copies des listes avant
        let incoming_names = Array.from(this.nodes[node_name].incomingNames);
        let outgoing_names = Array.from(this.nodes[node_name].outgoingNames);
        for (let i in incoming_names) {
            let incoming: VarDAGNode = this.nodes[incoming_names[i]] as VarDAGNode;

            if (!incoming) {
                continue;
            }

            incoming.removeNodeFromOutgoing(node_name);
        }

        // On supprime le noeud des incomings, et des outgoings
        for (let i in outgoing_names) {
            let outgoing_name = outgoing_names[i];
            let outgoing: VarDAGNode = this.nodes[outgoing_name] as VarDAGNode;

            if (!outgoing) {
                continue;
            }

            outgoing.removeNodeFromIncoming(node_name);

            if (propagate_to_bottom_if_condition && propagate_to_bottom_if_condition(outgoing_name)) {
                this.deletedNode(outgoing_name, propagate_to_bottom_if_condition);
            }
        }

        // FIXME TODO Qu'est-ce qu'il se passe quand un noeud n'a plus de outgoing alors qu'il en avait ?
        // Est-ce que c'est possible dans notre cas ? Est-ce que c'est possible dans d'autres cas ? Est-ce qu'il faut le gérer ?

        delete this.nodes[node_name];

        if (!!this.leafs[node_name]) {
            delete this.leafs[node_name];
        }
        if (!!this.roots[node_name]) {
            delete this.roots[node_name];
        }

        let indexof = this.nodes_names.indexOf(node_name);
        if (indexof >= 0) {
            this.nodes_names.splice(indexof, 1);
        }
    }

    public registerParams(params: IVarDataVOBase[], reload_on_register: boolean = false, ignore_unvalidated_datas: boolean = false) {
        for (let i in params) {
            let param: IVarDataVOBase = params[i];
            let index: string = param.index;

            if (!index) {
                ConsoleHandler.getInstance().error('Une var est probablement mal instantiée');
                continue;
            }

            let node: VarDAGNode = this.nodes[index];

            /**
             * Quand on recalcule des vars, on peut avoir des index qui changent pas mais des ids qui évoluent, il faut reprendre le nouveau
             *  si on dit explicitement que c'est un rechargement
             */
            if (reload_on_register && !!node) {

                if ((!!node.param) && (node.param.id != param.id)) {
                    node.param.id = param.id;
                }
            }


            if (!node) {

                // On ajoute le noeud à l'arbre
                // Quand on ajoute un noeud, on doit demander à charger ses deps dès que possible
                this.add(index, param);
                node = this.nodes[index];
            }

            node.ignore_unvalidated_datas = ignore_unvalidated_datas;

            if (reload_on_register) {
                // On doit aussi clean le node pour le remettre à 0 pour les calculs à venir
                if (VarsController.getInstance().varDatasBATCHCache && VarsController.getInstance().varDatasBATCHCache[index]) {
                    delete VarsController.getInstance().varDatasBATCHCache[index];
                }
                if (VarsController.getInstance().varDatas && VarsController.getInstance().varDatas[index]) {
                    delete VarsController.getInstance().varDatas[index];
                }
                if (VarsController.getInstance().varDatasStaticCache && VarsController.getInstance().varDatasStaticCache[index]) {
                    delete VarsController.getInstance().varDatasStaticCache[index];
                }

                node.loaded_datas_matroids = null;
                node.computed_datas_matroids = null;
                node.loaded_datas_matroids_sum_value = null;
                node.removeMarkers(this);
                node.initializeNode(this);
                node.needs_deps_loading = true;
            }

            node.addMarker(VarDAG.VARDAG_MARKER_REGISTERED, this);
        }
    }
}

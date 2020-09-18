import ObjectHandler from '../../../tools/ObjectHandler';
import VarDataBaseVO from '../params/VarDataBaseVO';
import VarDAG from './VarDAG';
import VarDAGNodeDep from './VarDAGNodeDep';

export default class VarDAGNode {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param is_registered permet d'indiquer si le noeud peut etre supprimé ou non dans le fonctionnement du calcul
     */
    public static getInstance(dag: VarDAG, var_data: VarDataBaseVO/*, is_registered: boolean = false*/): VarDAGNode {
        if (!!dag.nodes[var_data.index]) {
            return dag.nodes[var_data.index];
        }

        return new VarDAGNode(dag, var_data/*, is_registered*/).linkToDAG();
    }

    /**
     * Les dépendances ascendantes.
     */
    public incoming_deps: { [dep_name: string]: VarDAGNodeDep };

    /**
     * Tous les noeuds sont déclarés / initialisés comme des noeuds de calcul. C'est uniquement en cas de split (sur un import ou précalcul partiel)
     *  qu'on va switcher sur un mode aggégateur et configurer des aggregated_nodes
     */
    public is_aggregator: boolean = false;

    /**
     * CAS A : On a une noeud de calcul - qui utilise la fonction compute du VarController : Les dépendances descendantes :
     *  - undefined indique qu'on a pas chargé les deps ou que l'on est en cas B
     *  - toutes les deps doivent donc être chargées en même temps (c'est le cas dans le fonctionnement actuel des VarsControllers)
     */
    public outgoing_deps: { [dep_name: string]: VarDAGNodeDep };

    /**
     * CAS B : On a une noeud aggregateur - qui utilise la fonction aggregate du VarController : Les noeuds aggrégés :
     *  - undefined indique qu'on est en cas A
     */
    public aggregated_nodes: { [var_data_index: string]: VarDAGNode };

    // /**
    //  * On ne peut pas supprimer un noeud par défaut, sauf si on le crée en indiquant qu'il n'est pas registered
    //  *  les noeuds étant registered avant de déployer les deps, on a pas de risque de créer un noeud registered après un non registered dont le param serait identique
    //  *  ce qui serait un problème sinon
    //  */
    // public can_be_deleted: boolean = false;

    /**
     * ! TODO FIXME a voir comment on gère cette optimisation - à mon avis osef puisqu'on passe tout côté serveur
     */
    public needs_to_load_precompiled_or_imported_data: boolean = true;
    public needs_parent_to_load_precompiled_or_imported_data: boolean = false;
    /* ! */

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: VarDAG, public var_data: VarDataBaseVO/*, is_registered: boolean*/) {
        // this.can_be_deleted = !is_registered;
    }

    /**
     * @returns true si le noeuds à des deps descendantes, false sinon => dans ce cas on parle de noeud feuille/leaf
     */
    get hasOutgoing(): boolean {
        return !ObjectHandler.getInstance().hasAtLeastOneAttribute(this.outgoing_deps);
    }

    /**
     * @returns false si le noeuds à des deps ascendantes, false sinon => dans ce cas on parle de noeud racine/root
     */
    get hasIncoming(): boolean {
        return !ObjectHandler.getInstance().hasAtLeastOneAttribute(this.incoming_deps);
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep: VarDAGNodeDep) {
        dep.incoming_node = this;
        this.outgoing_deps[dep.dep_name] = dep;

        for (let i in dep.outgoing_nodes) {
            let outgoing_dep = dep.outgoing_nodes[i];

            outgoing_dep.incoming_deps[dep.dep_name] = dep;

            if (!!this.dag.roots[outgoing_dep.var_data.index]) {
                delete this.dag.roots[outgoing_dep.var_data.index];
            }
        }

        if (!!this.dag.leafs[this.var_data.index]) {
            delete this.dag.leafs[this.var_data.index];
        }

        // TODO FIXME a supprimer quand on a géré le cas de l'opti liée à needs_to_load_precompiled_or_imported_data & needs_parent_to_load_precompiled_or_imported_data
        // public addEdge(fromName: string, toName: string, depId: string) {
        //     super.addEdge(fromName, toName, depId);
        //     // On ajoute l'info de nécessité de loading de datas ou pas pour simplifier à mort les chargements de datas des matroids
        //     // Si le noeud from nécessite un chargement, on nécessite un chargement
        //     let fromNode: VarDAGNode = this.nodes[fromName];
        //     let toNode: VarDAGNode = this.nodes[toName];
        //     if (fromNode.needs_to_load_precompiled_or_imported_data) {
        //         toNode.needs_parent_to_load_precompiled_or_imported_data = true;
        //     } else {
        //         toNode.needs_parent_to_load_precompiled_or_imported_data = fromNode.needs_parent_to_load_precompiled_or_imported_data || toNode.needs_parent_to_load_precompiled_or_imported_data;
        //     }
        // }
    }

    /**
     * Fonction qui switch le noeud actuel en mode aggrégateur, et qui met à jour les deps
     *  FIXME TODO : Vérifier cette phrase après avoir refondu le processus de compute, Si on essaie de d'abord générer les deps et ensuite de charger les précals même partiels, c'est surement faux :
     *          "Normalement à ce stade on a pas de dépendances sur ce noeud"
     *          Si c'est faux il faut gérer de supprimer les deps de ce noeud, tout en ne supprimant rien que l'on a pas le droit de supprimer
     * @param splitted_nodes Tableau de VarDAGNode qui doit couvrir le var_data du noeud actuel
     */
    public split_node(splitted_nodes: { [index: string]: VarDAGNode }) {
        this.is_aggregator = true;
        this.aggregated_nodes = splitted_nodes;
    }

    // // FIXME TODO a supprimer ou a refaire : On ne supprime jamais un noeud sans le remplacer par un groupe de noeuds, donc on
    // //  préfère coder directement la fonction qui gère les 2 étapes.
    // /**
    //  * Fonction qui supprime le noeud et donc toutes ses dépendances si il en a
    //  *  Toutes les suppressions sont soumises au flag can_be_deleted
    //  */
    // public delete() {
    //     if (!this.can_be_deleted) {
    //         return;
    //     }

    //     /**
    //      * On peut supprimer le noeud, on commence par supprimer les
    //      */

    //     // On supprime le noeud des incomings, et des outgoings
    //     // On impacte le incoming et le ougoing on fait des copies des listes avant
    //     let incoming_names = Array.from(this.nodes[node_name].incomingNames);
    //     let outgoing_names = Array.from(this.nodes[node_name].outgoingNames);
    //     for (let i in incoming_names) {
    //         let incoming: VarDAGNode = this.nodes[incoming_names[i]] as VarDAGNode;

    //         if (!incoming) {
    //             continue;
    //         }

    //         incoming.removeNodeFromOutgoing(node_name);
    //     }

    //     // On supprime le noeud des incomings, et des outgoings
    //     for (let i in outgoing_names) {
    //         let outgoing_name = outgoing_names[i];
    //         let outgoing: VarDAGNode = this.nodes[outgoing_name] as VarDAGNode;

    //         if (!outgoing) {
    //             continue;
    //         }

    //         outgoing.removeNodeFromIncoming(node_name);

    //         if (propagate_to_bottom_if_condition && propagate_to_bottom_if_condition(outgoing_name)) {
    //             this.deletedNode(outgoing_name, propagate_to_bottom_if_condition);
    //         }
    //     }

    //     // FIXME TODO Qu'est-ce qu'il se passe quand un noeud n'a plus de outgoing alors qu'il en avait ?
    //     // Est-ce que c'est possible dans notre cas ? Est-ce que c'est possible dans d'autres cas ? Est-ce qu'il faut le gérer ?

    //     delete this.nodes[node_name];

    //     if (!!this.leafs[node_name]) {
    //         delete this.leafs[node_name];
    //     }
    //     if (!!this.roots[node_name]) {
    //         delete this.roots[node_name];
    //     }

    //     let indexof = this.nodes_names.indexOf(node_name);
    //     if (indexof >= 0) {
    //         this.nodes_names.splice(indexof, 1);
    //     }
    // }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    private linkToDAG(): VarDAGNode {

        this.dag.nodes[this.var_data.index] = this;
        this.dag.nodes_names.push(this.var_data.index);

        this.dag.leafs[this.var_data.index] = this;
        this.dag.roots[this.var_data.index] = this;

        return this;
    }

    // TODO FIXME a supprimer quand on a géré le cas de l'opti liée à needs_to_load_precompiled_or_imported_data & needs_parent_to_load_precompiled_or_imported_data
    // /**
    //  * Use the factory
    //  */
    // private constructor(name: string, dag: VarDAG, public param: IVarDataVOBase) {
    //     super(name, dag);

    //     // On en profite pour afficher l'info de la nécessité ou non de chargement de data pour les matroids
    //     let var_controller = VarsController.getInstance().getVarControllerById(param.var_id);
    //     if (((!var_controller.can_load_precompiled_or_imported_datas_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
    //         ((!var_controller.can_load_precompiled_or_imported_datas_server_side) && (!!ModulesManager.getInstance().isServerSide))) {
    //         this.needs_to_load_precompiled_or_imported_data = false;
    //     } else {
    //         this.needs_to_load_precompiled_or_imported_data = true;
    //     }

    //     // Par défaut on a pas de parent donc...
    //     this.needs_parent_to_load_precompiled_or_imported_data = false;
    // }
}

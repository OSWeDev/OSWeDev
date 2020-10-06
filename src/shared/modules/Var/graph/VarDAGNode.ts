import ObjectHandler from '../../../tools/ObjectHandler';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarDAG from './VarDAG';
import VarDAGNodeDep from './VarDAGNodeDep';

export default class VarDAGNode {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     */
    public static getInstance(dag: VarDAG, var_data: VarDataBaseVO): VarDAGNode {
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

    /**
     * Toutes les données chargées pour ce noeud sont disponibles directement ici, classées par datasource
     */
    public datasources: { [ds_name: string]: any };

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: VarDAG, public var_data: VarDataBaseVO) { }

    /**
     * @returns true si le noeuds à des deps descendantes, false sinon => dans ce cas on parle de noeud feuille/leaf
     */
    get hasOutgoing(): boolean {
        return !!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.outgoing_deps);
    }

    /**
     * @returns false si le noeuds à des deps ascendantes, false sinon => dans ce cas on parle de noeud racine/root
     */
    get hasIncoming(): boolean {
        return !!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.incoming_deps);
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode) {

        let dep: VarDAGNodeDep = new VarDAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.dag.leafs[this.var_data.index]) {
            delete this.dag.leafs[this.var_data.index];
        }
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

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    private linkToDAG(): VarDAGNode {

        this.dag.nodes[this.var_data.index] = this;
        this.dag.nb_nodes++;

        this.dag.leafs[this.var_data.index] = this;
        this.dag.roots[this.var_data.index] = this;

        return this;
    }
}

import ObjectHandler from '../../../../tools/ObjectHandler';
import DAGNodeDep from './DAGNodeDep';

export default abstract class DAGNodeBase {

    public static TAG_TO_DELETE: string = 'TO_DELETE';

    /**
     * Les dépendances ascendantes.
     */
    public incoming_deps: { [dep_name: string]: DAGNodeDep<DAGNodeBase> } = {};

    /**
     * Les dépendances descendantes.
     */
    public outgoing_deps: { [dep_name: string]: DAGNodeDep<DAGNodeBase> } = {};

    public tags: { [tag_name: string]: boolean } = {};

    protected constructor() { }

    /**
     * @returns true si le noeuds à des deps descendantes, false sinon => dans ce cas on parle de noeud feuille/leaf
     */
    get hasOutgoing(): boolean {
        return !!ObjectHandler.hasAtLeastOneAttribute(this.outgoing_deps);
    }

    /**
     * @returns false si le noeuds à des deps ascendantes, false sinon => dans ce cas on parle de noeud racine/root
     */
    get hasIncoming(): boolean {
        return !!ObjectHandler.hasAtLeastOneAttribute(this.incoming_deps);
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep DAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public abstract addOutgoingDep(dep_name: string, outgoing_node: DAGNodeBase);

    get is_deletable(): boolean {
        return this.tags[DAGNodeBase.TAG_TO_DELETE] && !this.hasIncoming;
    }
}

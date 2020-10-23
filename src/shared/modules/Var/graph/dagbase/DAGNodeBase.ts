import VarServerControllerBase from '../../../../../server/modules/Var/VarServerControllerBase';
import ObjectHandler from '../../../../tools/ObjectHandler';
import DAGNodeDep from './DAGNodeDep';

export default abstract class DAGNodeBase {

    /**
     * Les dépendances ascendantes.
     */
    public incoming_deps: { [dep_name: string]: DAGNodeDep<DAGNodeBase> } = {};

    /**
     * Le contrôleur de ce noeud
     */
    public var_controller: VarServerControllerBase<any>;

    /**
     * Les dépendances descendantes.
     */
    public outgoing_deps: { [dep_name: string]: DAGNodeDep<DAGNodeBase> } = {};

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
     * @param dep DAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public abstract addOutgoingDep(dep_name: string, outgoing_node: DAGNodeBase);
}

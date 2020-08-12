import IDataSourceController from '../../../../DataSource/interfaces/IDataSourceController';
import ModulesManager from '../../../../ModulesManager';
import IVarDataVOBase from '../../../interfaces/IVarDataVOBase';
import VarsController from '../../../VarsController';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

/**
 * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
 * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
 */
export default class VarDAGDefineNodeDeps {


    /**
     * Retourne les nouveaux noeuds
     * @param node
     * @param path
     */
    public static defineNodeDeps(node: VarDAGNode, varDag: VarDAG, new_nodes: { [index: string]: VarDAGNode }): void {

        let controller = VarsController.getInstance().getVarControllerById(node.param.var_id);

        if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.hasMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING))) {
            return;
        }

        // On demande les deps de datasources
        if (!node.hasMarker(VarDAG.VARDAG_MARKER_DATASOURCES_LIST_LOADED)) {
            let deps_ds: Array<IDataSourceController<any>> = controller.getDataSourcesDependencies();
            for (let i in deps_ds) {
                let dep_ds = deps_ds[i];

                node.addMarker(VarDAG.VARDAG_MARKER_DATASOURCE_NAME + dep_ds.name, varDag);
            }
            node.addMarker(VarDAG.VARDAG_MARKER_DATASOURCES_LIST_LOADED, varDag);
        }

        // Si on peut pas calculer, inutile de regarder les deps et donc les ds predeps sont inutiles aussi
        let ne_peut_pas_calculer = ((!controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) || ((!controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide));
        if (!ne_peut_pas_calculer) {

            // On demande les datasources predeps : Si on en a, il faut indiquer qu'on attend une info avant de pouvoir load les deps
            if (!node.hasMarker(VarDAG.VARDAG_MARKER_PREDEPS_DATASOURCE_LOADED)) {

                let ds_predeps: Array<IDataSourceController<any>> = controller.getDataSourcesPredepsDependencies();
                if ((!!ds_predeps) && (!!ds_predeps.length)) {
                    node.addMarker(VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING, varDag);
                    return;
                }
            }

            // On demande les deps de vars
            let deps: IVarDataVOBase[] = controller.getParamDependencies(node, varDag);
            VarDAGDefineNodeDeps.add_node_deps(node, varDag, deps, new_nodes);
        }

        node.removeMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, varDag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, varDag);
    }

    public static clear_node_deps(node: VarDAGNode, dag: VarDAG) {

        if ((!node) || (!dag)) {
            return;
        }

        // On modifie les outgoings dans la boucle, il faut en faire une copie avant
        let outgoing_names = Array.from(node.outgoingNames);
        for (let i in outgoing_names) {

            let outgoing_name = outgoing_names[i];
            let outgoing = dag.nodes[outgoing_name];

            if (!outgoing) {
                continue;
            }

            outgoing.removeNodeFromIncoming(node.name);
            node.removeNodeFromOutgoing(outgoing_name);
        }
    }

    public static add_node_deps(node: VarDAGNode, dag: VarDAG, deps: IVarDataVOBase[], new_nodes: { [index: string]: VarDAGNode }) {
        for (let i in deps) {
            let dep: IVarDataVOBase = deps[i];
            let dep_index: string = dep.index;

            if (!dag.nodes[dep_index]) {

                new_nodes[dep_index] = dag.add(dep_index, dep);
            }

            dag.addEdge(node.name, dep_index);
        }
    }
}
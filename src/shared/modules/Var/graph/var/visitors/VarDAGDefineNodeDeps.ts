import IDataSourceController from '../../../../DataSource/interfaces/IDataSourceController';
import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
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
    public static async defineNodeDeps(node: VarDAGNode, varDag: VarDAG, new_nodes: { [index: string]: VarDAGNode }): Promise<VarDAGNode[]> {

        if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.hasMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING))) {
            return null;
        }

        // On demande les deps de datasources
        if (!node.hasMarker(VarDAG.VARDAG_MARKER_DATASOURCES_LIST_LOADED)) {
            let deps_ds: Array<IDataSourceController<any, any>> = VarsController.getInstance().getVarControllerById(node.param.var_id).getDataSourcesDependencies();
            for (let i in deps_ds) {
                let dep_ds = deps_ds[i];

                node.addMarker(VarDAG.VARDAG_MARKER_DATASOURCE_NAME + dep_ds.name, varDag);
            }
            node.addMarker(VarDAG.VARDAG_MARKER_DATASOURCES_LIST_LOADED, varDag);
        }

        // On demande les datasources predeps : Si on en a, il faut indiquer qu'on attend une info avant de pouvoir load les deps
        if (!node.hasMarker(VarDAG.VARDAG_MARKER_PREDEPS_DATASOURCE_LOADED)) {

            let ds_predeps: Array<IDataSourceController<any, any>> = VarsController.getInstance().getVarControllerById(node.param.var_id).getDataSourcesPredepsDependencies();
            if ((!!ds_predeps) && (!!ds_predeps.length)) {
                node.addMarker(VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING, varDag);
                return null;
            }
        }

        // On demande les deps de vars
        let deps: IVarDataParamVOBase[] = await VarsController.getInstance().getVarControllerById(node.param.var_id).getSegmentedParamDependencies(node, varDag);
        VarDAGDefineNodeDeps.add_node_deps(node, varDag, deps, new_nodes);

        node.removeMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, varDag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, varDag);
    }

    public static clear_node_deps(node: VarDAGNode, dag: VarDAG) {

        if ((!node) || (!dag)) {
            return;
        }

        for (let i in node.outgoingNames) {

            let outgoing_name = node.outgoingNames[i];
            let outgoing = dag.nodes[outgoing_name];

            // Si on est le seul à référencer ce noeud, on le supprime, sinon on supprime juste la liaison
            if ((outgoing.incomingNames.length == 1) && (!outgoing.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED))) {
                dag.deletedNode(outgoing_name, (propagate_name: string) => {
                    return ((!dag.nodes[propagate_name].incomingNames) || (!dag.nodes[propagate_name].incomingNames.length)) && (!dag.nodes[propagate_name].hasMarker(VarDAG.VARDAG_MARKER_REGISTERED));
                });
            } else {
                outgoing.removeNodeFromIncoming(node.name);
                node.removeNodeFromOutgoing(outgoing_name);
            }
        }
    }

    public static add_node_deps(node: VarDAGNode, dag: VarDAG, deps: IVarDataParamVOBase[], new_nodes: { [index: string]: VarDAGNode }) {
        for (let i in deps) {
            let dep: IVarDataParamVOBase = deps[i];
            let dep_index: string = VarsController.getInstance().getIndex(dep);

            if (!dag.nodes[dep_index]) {

                new_nodes[dep_index] = dag.add(dep_index, dep);
            }

            dag.addEdge(node.name, dep_index);
        }
    }
}
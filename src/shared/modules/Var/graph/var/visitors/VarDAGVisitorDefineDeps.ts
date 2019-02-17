import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import VarsController from '../../../VarsController';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

/**
 * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
 * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
 */
export default class VarDAGVisitorDefineDeps extends DAGVisitorBase<VarDAG> {


    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: VarDAGNode, path: string[]): Promise<boolean> {

        if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED)) {
            return false;
        }

        // On demande les deps
        let deps: IVarDataParamVOBase[] = await VarsController.getInstance().getVarControllerById(node.param.var_id).getParamDependencies(node.param, this.dag);

        for (let i in deps) {
            let dep: IVarDataParamVOBase = deps[i];
            let dep_index: string = VarsController.getInstance().getVarControllerById(dep.var_id).varDataParamController.getIndex(dep);

            this.dag.addEdge(node.name, dep_index);
            if (!this.dag.nodes[dep_index].param) {
                this.dag.nodes[dep_index].param = dep;
            }
        }

        node.addMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, this.dag);
        return true;
    }
}
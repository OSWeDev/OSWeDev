import IDataSourceController from '../../../../DataSource/interfaces/IDataSourceController';
import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import VarsController from '../../../VarsController';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';
import PerfMonFunction from '../../../../PerfMon/annotations/PerfMonFunction';

/**
 * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
 * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
 */
export default class VarDAGVisitorDefineNodeDeps extends DAGVisitorBase<VarDAG> {


    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: VarDAGNode, path: string[]): Promise<boolean> {
        return await this.varDAGVisitorDefineNodeDeps(node, path);
    }

    @PerfMonFunction
    public async varDAGVisitorDefineNodeDeps(node: VarDAGNode, path: string[]): Promise<boolean> {

        if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.hasMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING))) {
            return false;
        }

        // On demande les deps de datasources
        let deps_ds: Array<IDataSourceController<any, any>> = await VarsController.getInstance().getVarControllerById(node.param.var_id).getDataSourcesDependencies();
        for (let i in deps_ds) {
            let dep_ds = deps_ds[i];

            node.addMarker(VarDAG.VARDAG_MARKER_DATASOURCE_NAME + dep_ds.name, this.dag);
        }

        // On demande les deps de vars
        let deps: IVarDataParamVOBase[] = await VarsController.getInstance().getVarControllerById(node.param.var_id).getParamDependencies(node, this.dag);

        for (let i in deps) {
            let dep: IVarDataParamVOBase = deps[i];
            let dep_index: string = VarsController.getInstance().getVarControllerById(dep.var_id).varDataParamController.getIndex(dep);

            if (!this.dag.nodes[dep_index]) {
                this.dag.add(dep_index, dep);
            }

            this.dag.addEdge(node.name, dep_index);
        }

        node.removeMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, this.dag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, this.dag);
        return false;
    }
}
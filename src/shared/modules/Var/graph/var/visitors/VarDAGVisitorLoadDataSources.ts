import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import VarsController from '../../../VarsController';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';
import IVarDataVOBase from '../../../interfaces/IVarDataVOBase';

/**
 * Visiteur qui doit charger les datasources pour un batch donné
 */
export default class VarDAGVisitorLoadDataSources extends DAGVisitorBase<VarDAG> {


    public constructor(dag: VarDAG) {
        super(false, dag);
    }

    public async visit(node: VarDAGNode, path: string[]): Promise<boolean> {

        // Si tous les outgoing ne sont pas chargés, on ne continue pas
        for (let i in node.outgoing) {
            let outgoing: VarDAGNode = node.outgoing[i];

            if (!outgoing.hasMarker(VarDAG.VARDAG_MARKER_BATCH_DATASOURCE_LOADED)) {
                return false;
            }
        }


        if (!node.hasMarker(VarDAG.VARDAG_MARKER_BATCH_DATASOURCE_LOADED)) {

            let params_by_index: { [index: string]: IVarDataParamVOBase } = {};

            for (let i in this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_VAR_ID + node.param.var_id]) {
                let index: string = this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_VAR_ID + node.param.var_id][i];
                params_by_index[index] = this.dag.nodes[index].param;
            }

            let imported_datas: { [var_id: number]: { [index: string]: IVarDataVOBase } } = {};

            for (let i in this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_IMPORTED_DATA]) {
                let index: string = this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_IMPORTED_DATA][i];
                let var_id: number = this.dag.nodes[index].param.var_id;

                if (!imported_datas[var_id]) {
                    imported_datas[var_id] = {};
                }
                imported_datas[var_id][index] = this.dag.nodes[index].imported;
            }

            // On demande le chargement pour ce var_id
            await VarsController.getInstance().getVarControllerById(node.param.var_id).begin_batch(
                // VarsController.getInstance().BATCH_UIDs_by_var_id[node.param.var_id],
                params_by_index,
                imported_datas);

            // On marque tous les noeuds de ce var_id
            for (let i in this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_VAR_ID + node.param.var_id]) {
                let node_v_id: VarDAGNode = this.dag.nodes[this.dag.marked_nodes_names[VarDAG.VARDAG_MARKER_VAR_ID + node.param.var_id][i]];

                node_v_id.addMarker(VarDAG.VARDAG_MARKER_BATCH_DATASOURCE_LOADED, this.dag);
            }
        }

        return true;
    }
}
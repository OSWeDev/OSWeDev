import MatroidController from '../../../../Matroid/MatroidController';
import MatroidCutResult from '../../../../Matroid/vos/MatroidCutResult';
import VOsTypesManager from '../../../../VOsTypesManager';
import ISimpleNumberVarMatroidData from '../../../interfaces/ISimpleNumberVarMatroidData';
import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import IVarMatroidDataParamVO from '../../../interfaces/IVarMatroidDataParamVO';
import IVarMatroidDataVO from '../../../interfaces/IVarMatroidDataVO';
import VarsController from '../../../VarsController';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';
import VarDAGDefineNodeDeps from './VarDAGDefineNodeDeps';

/**
 * Visiteur qui doit charger les datas précalculées et/ou importées
 */
export default class VarDAGVisitorLoadPrecompiled extends DAGVisitorBase<VarDAGNode, VarDAG> {


    public static MARKER_visited_node_marker: string = 'LoadPrecompiled_ok';

    public async visit(node: VarDAGNode, dag: VarDAG, nodes_path: VarDAGNode[]): Promise<boolean> {

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[VarsController.getInstance().getVarConfById(node.param.var_id).var_data_vo_type];

        if (!moduletable.isMatroidTable) {
            return true;
        }

        let matroids_list: ISimpleNumberVarMatroidData[] = node.loaded_datas_matroids as ISimpleNumberVarMatroidData[];

        node.parents_loaded_datas_matroids = [];

        // On rempli au passage la liste des matroids utilisés dans l'arborescence avant ce node
        for (let j in node.incoming) {
            let incoming = node.incoming[j];

            node.parents_loaded_datas_matroids = node.parents_loaded_datas_matroids.concat(incoming.parents_loaded_datas_matroids);
        }


        node.loaded_datas_matroids_sum_value = null;
        let remaining_matroids = [MatroidController.getInstance().cloneFrom(node.param as IVarMatroidDataParamVO)];


        for (let j in matroids_list) {
            let matroid = matroids_list[j];

            if ((matroid.value == null) || (typeof matroid.value == "undefined")) {
                continue;
            }

            if (node.loaded_datas_matroids_sum_value == null) {
                node.loaded_datas_matroids_sum_value = matroid.value;
                continue;
            }
            node.loaded_datas_matroids_sum_value += matroid.value;

            let cut_results: Array<MatroidCutResult<IVarMatroidDataParamVO>> = MatroidController.getInstance().cut_matroids(matroid, remaining_matroids);
            remaining_matroids = [];
            for (let k in cut_results) {
                remaining_matroids = remaining_matroids.concat(cut_results[k].remaining_items);
            }
        }

        node.computed_datas_matroids = remaining_matroids as IVarMatroidDataVO[];

        // ça veut dire aussi qu'on se demande ici quels params on doit vraiment charger en deps de ce params pour pouvoir calculer
        //  et on doit modifier l'arbre en conséquence
        let node_controller = VarsController.getInstance().getVarControllerById(node.param.var_id);

        VarDAGDefineNodeDeps.clear_node_deps(node, dag);

        // On doit faire un fake vardagnode pour chaque matroid à calculer (donc résultant de la coupe) et on additionnera les résultats
        for (let i in node.computed_datas_matroids) {
            let computed_datas_matroid = node.computed_datas_matroids[i];

            let fake_vardagnode = new VarDAGNode(VarsController.getInstance().getIndex(computed_datas_matroid), null, computed_datas_matroid);
            let deps: IVarDataParamVOBase[] = await node_controller.getSegmentedParamDependencies(fake_vardagnode, dag);

            VarDAGDefineNodeDeps.add_node_deps(node, dag, deps, {});

            // TODO FIXME VARS : On devrait pas par hasard ajouter des markers à ce niveau ?
        }

        return true;
    }
}
import DAG from '../dag/DAG';
import VarDAGNode from './VarDAGNode';
import VarDAGVisitorMarkForDeletion from './visitors/VarDAGVisitorMarkForDeletion';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import VarsController from '../../VarsController';

export default class VarDAG extends DAG<VarDAGNode> {

    public static VARDAG_MARKER_REGISTERED: string = 'REGISTERED';

    public static VARDAG_MARKER_IMPORTED_DATA: string = 'IMPORTED_DATA';

    public static VARDAG_MARKER_VAR_ID: string = 'VAR_ID_';

    public static VARDAG_MARKER_DEPS_LOADED: string = 'DEPS_LOADED';

    public static VARDAG_MARKER_BATCH_DATASOURCE_LOADED: string = 'BATCH_DATASOURCE_LOADED';
    public static VARDAG_MARKER_BATCH_DATASOURCE_UNLOADED: string = 'BATCH_DATASOURCE_UNLOADED';

    public static VARDAG_MARKER_COMPUTED: string = 'COMPUTED';

    public static VARDAG_MARKER_MARKED_FOR_DELETION: string = 'MARKED_FOR_DELETION';
    public static VARDAG_MARKER_MARKED_FOR_UPDATE: string = 'MARKED_FOR_UPDATE';
    public static VARDAG_MARKER_ONGOING_UPDATE: string = 'ONGOING_UPDATE';
    public static VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE: string = 'MARKED_FOR_NEXT_UPDATE';


    public registerParams(params: IVarDataParamVOBase[]) {
        for (let i in params) {
            let param: IVarDataParamVOBase = params[i];
            let index: string = VarsController.getInstance().getIndex(param);
            let node: VarDAGNode = this.nodes[index];

            if (!node) {

                // On ajoute le noeud à l'arbre
                // Quand on ajoute un noeud, on doit demander à charger ses deps dès que possible
                this.add(index, param);
                node = this.nodes[index];
            }

            node.addMarker(VarDAG.VARDAG_MARKER_REGISTERED, this);
        }
    }

    public unregisterIndexes(indexes: string[]) {
        for (let i in indexes) {
            let index: string = indexes[i];
            let node: VarDAGNode = this.nodes[index];

            if (!!node) {
                node.removeMarker(VarDAG.VARDAG_MARKER_REGISTERED, this);

                // Si on est plus marqué et qu'on est un top élément (root), on supprime le noeud et on lance le visiteur pour supprimer tous les suivants
                if (!node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {

                    // Suppression en 2 étapes, on marque pour suppression et on demande la suppression des noeuds marqués
                    node.visit(new VarDAGVisitorMarkForDeletion(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION, this));
                    this.deletedMarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION);
                }
            }
        }
    }
}
